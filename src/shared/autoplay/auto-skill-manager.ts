// ═══════════════════════════════════════════════════════════════
// Auto-play skill manager — decides when to use dodge/ULT/buffs
// Called BEFORE gem swap each tick: skill action > gem swap
// ═══════════════════════════════════════════════════════════════

import { dodgeCost, ultCost } from '../utils/combat-formulas';

// ═══ Types ═══

export type SkillActionType = 'dodge' | 'samDong' | 'otHiem' | 'romBoc';

export interface SkillDecision {
  action: SkillActionType;
  reason: string;
  manaCost: number;
  ognCost: number;
}

export interface SkillManagerState {
  playerHP: number;
  playerMaxHP: number;
  playerMANA_stat: number;
  currentMana: number;
  ultCharge: number;

  skillWarning: boolean;
  otHiemActive: boolean;
  otHiemOnCooldown: boolean;
  romBocActive: boolean;
  romBocOnCooldown: boolean;
  samDongLevel: number;
  otHiemLevel: number;
  romBocLevel: number;

  bossHP: number;
  bossMaxHP: number;
  bossDEF: number;
  bossATK: number;
  bossArchetype: string;
  activeBossBuffs: Set<string>;

  isDeVuong: boolean;
  deVuongPhase: number;

  dodgesUsedThisBattle: number;
  dodgeFreeLimit: number;

  vipLevel: number;
  turnsSinceUlt: number;
  enrageMultiplier: number;
}

// ═══ Internal helpers ═══

function calcDodgeManaCost(manaStat: number): number {
  return dodgeCost(manaStat >= 250);
}

function calcUltManaCost(state: SkillManagerState): number {
  // SuperMana: free ULT every 8 turns
  if (state.playerMANA_stat >= 3000 && state.turnsSinceUlt >= 8) return 0;
  // Milestone discount (65) vs level 5 discount (60) — use cheaper
  const baseCost = ultCost(state.playerMANA_stat >= 800);
  return state.samDongLevel >= 5 ? Math.min(baseCost, 60) : baseCost;
}

// ═══ getSkillDecision — main entry point ═══

export function getSkillDecision(state: SkillManagerState): SkillDecision | null {
  // ─── PRIORITY 1: DODGE ───
  if (state.skillWarning && state.vipLevel >= 3) {
    const manaCost = calcDodgeManaCost(state.playerMANA_stat);
    const isFree = state.dodgesUsedThisBattle < state.dodgeFreeLimit;
    const ognCost = isFree ? 0 : 5;

    if (state.currentMana >= manaCost) {
      // Exception: skip dodge to save mana for ULT against weak bosses
      const estDmg = state.bossATK * 2.0 * state.enrageMultiplier;
      const canSurviveHit = estDmg < state.playerHP * 0.25;
      const manaShort = state.currentMana < manaCost + 80;
      const ultNear = state.ultCharge >= 85;
      const weakBoss = state.bossATK <= 200;

      if (!(manaShort && ultNear && canSurviveHit && weakBoss)) {
        return {
          action: 'dodge',
          reason: isFree ? 'Free dodge skill attack' : `Paid dodge (${ognCost} OGN)`,
          manaCost,
          ognCost,
        };
      }
    }
  }

  // ─── PRIORITY 2: ROM BOC (emergency shield) ───
  if (
    state.vipLevel >= 5 &&
    !state.romBocActive &&
    !state.romBocOnCooldown
  ) {
    const hpPct = state.playerMaxHP > 0 ? state.playerHP / state.playerMaxHP : 1;

    let reason = '';
    if (hpPct < 0.40) {
      reason = `Emergency shield at ${Math.round(hpPct * 100)}% HP`;
    } else if (state.isDeVuong && state.deVuongPhase === 2) {
      reason = 'De Vuong phase 2 assassin defense';
    } else if (state.bossArchetype === 'assassin' && state.enrageMultiplier >= 1.3) {
      reason = 'Assassin enrage defense';
    } else if (hpPct < 0.55 && state.enrageMultiplier >= 1.5) {
      reason = 'Low HP + enrage defense';
    }

    if (reason) {
      return { action: 'romBoc', reason, manaCost: 0, ognCost: 0 };
    }
  }

  // ─── PRIORITY 3: SAM DONG (ULT) ───
  if (state.ultCharge >= 100 && state.vipLevel >= 3) {
    const manaCost = calcUltManaCost(state);

    if (state.currentMana >= manaCost) {
      const bossHpPct = state.bossMaxHP > 0 ? state.bossHP / state.bossMaxHP : 1;
      const bossShielded = state.activeBossBuffs.has('shield');

      // Don't fire: boss shielded (80% reduction), overkill, or save for De Vuong phase 4
      const dontFire =
        bossShielded ||
        bossHpPct < 0.03 ||
        (state.isDeVuong && state.deVuongPhase === 3 && bossHpPct > 0.26);

      if (!dontFire) {
        const reason =
          state.otHiemActive ? 'ULT + OtHiem combo burst'
          : state.isDeVuong && state.deVuongPhase === 4 ? 'De Vuong phase 4 rush ULT'
          : bossHpPct <= 0.15 ? 'ULT finishing blow'
          : state.bossDEF >= 200 && state.samDongLevel >= 5 ? 'ULT pierce high DEF'
          : manaCost === 0 ? 'Free ULT (SuperMana)'
          : 'ULT burst damage';
        return { action: 'samDong', reason, manaCost, ognCost: 0 };
      }
    }
  }

  // ─── PRIORITY 4: OT HIEM (DPS buff) ───
  if (
    state.vipLevel >= 5 &&
    !state.otHiemActive &&
    !state.otHiemOnCooldown
  ) {
    const bossHpPct = state.bossMaxHP > 0 ? state.bossHP / state.bossMaxHP : 1;

    if (bossHpPct > 0.10 && !state.activeBossBuffs.has('shield')) {
      const reason =
        state.isDeVuong && state.deVuongPhase === 4 ? 'De Vuong phase 4 rush buff'
        : state.ultCharge >= 70 ? 'Pre-ULT damage buff'
        : state.bossDEF >= 150 ? 'DEF bypass buff'
        : 'Damage buff window';
      return { action: 'otHiem', reason, manaCost: 0, ognCost: 0 };
    }
  }

  return null;
}

// ═══ shouldAutoDodge — quick check for controller ═══

export function shouldAutoDodge(state: SkillManagerState): boolean {
  if (!state.skillWarning || state.vipLevel < 3) return false;
  return state.currentMana >= calcDodgeManaCost(state.playerMANA_stat);
}

// ═══ getDodgeEconomy — dodge status for UI ═══

export function getDodgeEconomy(state: SkillManagerState) {
  const isFree = state.dodgesUsedThisBattle < state.dodgeFreeLimit;
  return {
    manaCost: calcDodgeManaCost(state.playerMANA_stat),
    ognCost: isFree ? 0 : 5,
    isFree,
    remainingFree: Math.max(0, state.dodgeFreeLimit - state.dodgesUsedThisBattle),
  };
}
