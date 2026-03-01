// ═══════════════════════════════════════════════════════════════
// Auto-play move scorer — evaluates swap quality based on
// simulation results, game state, and strategy weights
// ═══════════════════════════════════════════════════════════════

import type { SimulationResult, QuickResult } from './auto-simulator';
import { atkGemDamage, starGemDamage, hpPerGem, shieldPerGem } from '../utils/combat-formulas';
import { getComboTier } from '../match3/combat.config';
import { getLearnedWeights } from './auto-learner';
import strategy from './auto-strategy.json';

// ═══ Types ═══

/** All info scorer needs from game state — controller builds this */
export interface ScorerGameState {
  playerHP: number;
  playerMaxHP: number;
  playerATK: number;
  playerHP_stat: number;
  playerDEF_stat: number;
  playerMANA: number;
  bossHP: number;
  bossMaxHP: number;
  bossDEF: number;
  bossArchetype: string;
  bossHealPercent: number;
  enrageMultiplier: number;
  ultCharge: number;
  activeDebuffs: Set<string>;
  activeBossBuffs: Set<string>;
  eggActive: boolean;
  otHiemActive: boolean;
  isDeVuong: boolean;
  deVuongPhase: number;
  isWeeklyBoss: boolean;
  vipLevel?: number;
}

interface Weights { atk: number; hp: number; def: number; star: number }

type SituationKey =
  | 'healBlock' | 'armorBreak' | 'bossShield' | 'bossReflect'
  | 'playerCritical' | 'playerDanger' | 'playerLow' | 'boss39Execute'
  | 'bossAlmostDead' | 'bossLowHP'
  | 'bossHighDEF' | 'bossHighDEFWithOtHiem' | 'bossVeryHighDEF'
  | 'ultAlmostReady' | 'ultReadyBossShielded'
  | 'eggActive'
  | 'bossHealerRace' | 'bossHealerLowHP'
  | 'enrageLate' | 'enrageCritical'
  | 'normal';

// ═══ Internal helpers ═══

const sw = strategy.situationWeights;

function weightsFrom(key: SituationKey): Weights {
  const s = sw[key] as unknown as Record<string, number>;
  return { atk: s.atk, hp: s.hp, def: s.def, star: s.star };
}

const zeroBias = { atkBias: 0, hpBias: 0, defBias: 0, starBias: 0 };

const { specialGemCreation, cascadeDepthBonus, matchCountBonus } = strategy.bonusWeights;
const avgSpecialValue =
  (specialGemCreation.striped + specialGemCreation.bomb + specialGemCreation.rainbow) / 3;

// ═══ selectSituation — pick ONE situation from priority list ═══

export function selectSituation(state: ScorerGameState): SituationKey {
  // Priority 0-3: Debuffs / Boss buffs (always override)
  if (state.activeDebuffs.has('healBlock')) return 'healBlock';
  if (state.activeDebuffs.has('armorBreak')) return 'armorBreak';
  if (state.activeBossBuffs.has('shield')) {
    // Refine: if ULT already full, don't farm star → use specific weights
    return state.ultCharge >= 100 ? 'ultReadyBossShielded' : 'bossShield';
  }
  if (state.activeBossBuffs.has('reflect')) return 'bossReflect';

  // Priority 10-12: Player HP (survival > everything)
  const hpPct = state.playerMaxHP > 0 ? state.playerHP / state.playerMaxHP : 1;
  if (hpPct <= 0.15) return 'playerCritical';
  if (hpPct <= 0.30) return 'playerDanger';
  if (hpPct <= 0.50) return 'playerLow';

  // Priority 20-21: Boss HP (finish fight)
  const bossHpPct = state.bossMaxHP > 0 ? state.bossHP / state.bossMaxHP : 1;
  if (bossHpPct <= 0.05) return 'bossAlmostDead';
  if (bossHpPct <= 0.20) return 'bossLowHP';

  // Priority 30-32: Boss DEF (most specific first)
  if (state.bossDEF >= 400 && !state.otHiemActive) return 'bossVeryHighDEF';
  if (state.bossDEF >= 200 && state.otHiemActive) return 'bossHighDEFWithOtHiem';
  if (state.bossDEF >= 200) return 'bossHighDEF';

  // Priority 40: ULT charge
  if (state.ultCharge >= 70) return 'ultAlmostReady';

  // Priority 50: Egg
  if (state.eggActive) return 'eggActive';

  // Priority 60-61: Healer race
  if (state.bossHealPercent > 0) {
    return bossHpPct <= 0.30 ? 'bossHealerLowHP' : 'bossHealerRace';
  }

  // Priority 70-71: Enrage (most specific first)
  if (state.enrageMultiplier >= 1.8) return 'enrageCritical';
  if (state.enrageMultiplier >= 1.5) return 'enrageLate';

  return 'normal';
}

// Archetype bias only applied for these neutral situations
const BIAS_SITUATIONS = new Set<SituationKey>(['normal', 'enrageLate', 'enrageCritical']);

// ═══ getWeights — resolve final weights for current state ═══

export function getWeights(state: ScorerGameState): Weights {
  // Weekly boss: fixed simple weights
  if (state.isWeeklyBoss) {
    const w = strategy.weeklyBossStrategy.weights;
    return { atk: w.atk, hp: w.hp, def: w.def, star: w.star };
  }

  // De Vuong: phase-specific weights (override if HP critical)
  if (state.isDeVuong) {
    const hpPct = state.playerMaxHP > 0 ? state.playerHP / state.playerMaxHP : 1;
    if (hpPct <= 0.15) return weightsFrom('playerCritical');
    const phaseKey = `phase${state.deVuongPhase}` as 'phase1' | 'phase2' | 'phase3' | 'phase4';
    const phase = strategy.deVuongStrategy[phaseKey];
    if (phase) {
      const w = phase.weights;
      return { atk: w.atk, hp: w.hp, def: w.def, star: w.star };
    }
  }

  // Normal: situation weights + optional archetype bias
  const key = selectSituation(state);
  const base = weightsFrom(key);

  if (BIAS_SITUATIONS.has(key)) {
    const overrides = strategy.archetypeOverrides as unknown as Record<string, typeof zeroBias>;
    const bias = overrides[state.bossArchetype] ?? zeroBias;
    base.atk = Math.max(0, base.atk + bias.atkBias);
    base.hp = Math.max(0, base.hp + bias.hpBias);
    base.def = Math.max(0, base.def + bias.defBias);
    base.star = Math.max(0, base.star + bias.starBias);
  }

  // Lv5: apply self-learning multipliers
  if ((state.vipLevel ?? 1) >= 5) {
    const learned = getLearnedWeights(state.bossArchetype);
    base.atk *= learned.atk;
    base.hp *= learned.hp;
    base.def *= learned.def;
    base.star *= learned.star;
  }

  return base;
}

// ═══ Bonus scoring ═══

function matchBonus(totalCleared: number): number {
  if (totalCleared >= 6) return matchCountBonus.match6plus * 10;
  if (totalCleared >= 5) return matchCountBonus.match5 * 10;
  if (totalCleared >= 4) return matchCountBonus.match4 * 10;
  return matchCountBonus.match3 * 10;
}

// ═══ scoreMove — full simulation scoring ═══

export function scoreMove(
  simResult: SimulationResult,
  state: ScorerGameState,
): number {
  if (!simResult.isValid) return -1;

  const weights = getWeights(state);
  const atkVal = atkGemDamage(state.playerATK);
  const hpVal = hpPerGem(state.playerHP_stat);
  const defVal = shieldPerGem(state.playerDEF_stat, state.playerMaxHP);
  const starVal = starGemDamage(state.playerATK) + 8 * 3; // damage + ULT charge value

  // Step 1: Gem value score
  let gemScore =
    simResult.totalGems.atk  * weights.atk  * atkVal +
    simResult.totalGems.hp   * weights.hp   * hpVal +
    simResult.totalGems.def  * weights.def  * defVal +
    simResult.totalGems.star * weights.star * starVal;

  // Step 2: Reduce ATK portion by boss DEF
  if (state.bossDEF > 0 && !state.otHiemActive) {
    const defReduction = 1 - state.bossDEF / (state.bossDEF + 500);
    const atkPortion = simResult.totalGems.atk * weights.atk * atkVal;
    gemScore -= atkPortion * (1 - defReduction);
  }

  // Step 3: Combo multiplier from total gems cleared
  gemScore *= getComboTier(simResult.totalGemsCleared).mult;

  // Step 4: Bonus points
  let bonus = 0;
  bonus += simResult.specialGemsCreated * avgSpecialValue;
  bonus += simResult.specialGemsTriggered * avgSpecialValue * 0.8;
  bonus += Math.min(simResult.cascadeDepth * cascadeDepthBonus.perStep, cascadeDepthBonus.maxBonus);
  bonus += matchBonus(simResult.totalGemsCleared);

  return gemScore + bonus;
}

// ═══ scoreMoveQuick — fast scoring for greedy Lv2 (no cascade) ═══

export function scoreMoveQuick(
  quickResult: QuickResult,
  state: ScorerGameState,
): number {
  if (!quickResult.isValid) return -1;

  const weights = getWeights(state);
  const atkVal = atkGemDamage(state.playerATK);
  const hpVal = hpPerGem(state.playerHP_stat);
  const defVal = shieldPerGem(state.playerDEF_stat, state.playerMaxHP);
  const starVal = starGemDamage(state.playerATK) + 8 * 3;

  let gemScore =
    quickResult.gemCounts.atk  * weights.atk  * atkVal +
    quickResult.gemCounts.hp   * weights.hp   * hpVal +
    quickResult.gemCounts.def  * weights.def  * defVal +
    quickResult.gemCounts.star * weights.star * starVal;

  // Boss DEF reduction on ATK portion
  if (state.bossDEF > 0 && !state.otHiemActive) {
    const defReduction = 1 - state.bossDEF / (state.bossDEF + 500);
    const atkPortion = quickResult.gemCounts.atk * weights.atk * atkVal;
    gemScore -= atkPortion * (1 - defReduction);
  }

  // No cascade → combo mult 1.0, no cascade depth bonus
  let bonus = quickResult.specialGemsCreated * avgSpecialValue;
  bonus += matchBonus(quickResult.matchedCount);

  return gemScore + bonus;
}
