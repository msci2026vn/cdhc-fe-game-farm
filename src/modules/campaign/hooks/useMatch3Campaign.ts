// ═══════════════════════════════════════════════════════════════
// useMatch3Campaign — Forked from useMatch3 for campaign bosses
// Adds: Boss DEF reduction, Boss Heal, Boss Freq (multi-hit)
// Adds: Multi-phase boss support (De Vuong boss #40)
// Weekly boss uses original useMatch3 — UNTOUCHED
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import {
  getActiveMilestones,
  atkGemDamage, starGemDamage, maxPlayerHp, startingShield,
  hpPerGem, shieldPerGem, actualBossDamage,
  ultDamage as calcUltDamage, manaRegenPerTurn,
  dodgeCost, ultCost,
} from '@/shared/utils/combat-formulas';
import type { BossPhase } from '../data/deVuongPhases';

// ═══ Campaign boss data interface (superset of BossInfo) ═══
export interface CampaignBossData {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  attack: number;
  reward: number;
  xpReward: number;
  description: string;
  difficulty: string;
  unlockLevel: number;
  archetype: string;
  def: number;          // Boss DEF (0-500)
  freq: number;         // Attack count per interval (1-3)
  healPercent: number;  // % maxHP healed per 5 seconds (0-2)
  turnLimit: number;    // Max turns (0 = unlimited)
  phases?: BossPhase[]; // Multi-phase boss data (only boss #40)
}

// ═══ Grid constants (same as useMatch3) ═══
const COLS = 6;
const ROWS = 6;
const GEM_TYPES = ['atk', 'hp', 'def', 'star'] as const;
export type GemType = (typeof GEM_TYPES)[number];

export interface Gem { type: GemType; id: number; }

const GEM_META: Record<GemType, { emoji: string; css: string }> = {
  atk: { emoji: '⚔️', css: 'gem-atk' },
  hp:  { emoji: '💚', css: 'gem-hp' },
  def: { emoji: '🛡️', css: 'gem-def' },
  star:{ emoji: '⭐', css: 'gem-star' },
};

let nextId = 0;
const randomGem = (): Gem => ({ type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)], id: nextId++ });

function createGrid(): Gem[] {
  const grid: Gem[] = [];
  for (let i = 0; i < ROWS * COLS; i++) {
    let gem = randomGem();
    const col = i % COLS; const row = Math.floor(i / COLS);
    while (
      (col >= 2 && grid[i - 1].type === gem.type && grid[i - 2].type === gem.type) ||
      (row >= 2 && grid[i - COLS].type === gem.type && grid[i - 2 * COLS].type === gem.type)
    ) { gem = randomGem(); }
    grid.push(gem);
  }
  return grid;
}

function findMatches(grid: Gem[]): Set<number> {
  const matched = new Set<number>();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 3; c++) {
      const idx = r * COLS + c; const t = grid[idx].type; let len = 1;
      while (c + len < COLS && grid[idx + len].type === t) len++;
      if (len >= 3) { for (let k = 0; k < len; k++) matched.add(idx + k); }
      if (len > 1) c += len - 2;
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 3; r++) {
      const idx = r * COLS + c; const t = grid[idx].type; let len = 1;
      while (r + len < ROWS && grid[idx + len * COLS].type === t) len++;
      if (len >= 3) { for (let k = 0; k < len; k++) matched.add(idx + k * COLS); }
      if (len > 1) r += len - 2;
    }
  }
  return matched;
}

function applyGravity(grid: Gem[]): Gem[] {
  const newGrid = [...grid];
  for (let c = 0; c < COLS; c++) {
    const col: Gem[] = [];
    for (let r = ROWS - 1; r >= 0; r--) { const g = newGrid[r * COLS + c]; if (g) col.push(g); }
    for (let r = ROWS - 1; r >= 0; r--) {
      const fromBottom = ROWS - 1 - r;
      newGrid[r * COLS + c] = fromBottom < col.length ? col[fromBottom] : randomGem();
    }
  }
  return newGrid;
}

function areAdjacent(a: number, b: number): boolean {
  const ar = Math.floor(a / COLS), ac = a % COLS;
  const br = Math.floor(b / COLS), bc = b % COLS;
  return (Math.abs(ar - br) + Math.abs(ac - bc)) === 1;
}

// ═══ Boss State ═══
export interface BossState {
  bossHp: number; bossMaxHp: number;
  playerHp: number; playerMaxHp: number;
  shield: number; ultCharge: number;
  mana: number; maxMana: number;
  turnCount: number;
  immortalUsed: boolean;
  lastCrit: boolean;
  ultCooldown: number;
}

export interface DamagePopup { id: number; text: string; color: string; x: number; y: number; }

// ═══ Combo tiers ═══
const COMBO_TIERS = [
  { min: 2, mult: 1.5, label: 'COMBO', color: '#a29bfe' },
  { min: 3, mult: 2.0, label: 'SUPER', color: '#fdcb6e' },
  { min: 4, mult: 2.5, label: 'MEGA', color: '#ff6b6b' },
  { min: 5, mult: 3.0, label: 'ULTRA', color: '#fd79a8' },
  { min: 6, mult: 4.0, label: 'LEGENDARY', color: '#e056fd' },
  { min: 8, mult: 5.0, label: '🔥 GODLIKE', color: '#f0932b' },
];

function getComboInfo(combo: number) {
  let tier = { mult: 1, label: '', color: '#fff' };
  for (const t of COMBO_TIERS) { if (combo >= t.min) tier = t; }
  return tier;
}

// ═══ Boss attack config ═══
const BOSS_ATK_INTERVAL = 4000;
const BOSS_SKILL_CHANCE = 0.25;
const SKILL_DMG_MULT = 2.5;
const SKILL_WARNING_MS = 1500;
const BOSS_HEAL_INTERVAL = 5000;
const MULTI_HIT_DELAY = 300;
const SELF_DESTRUCT_INTERVAL = 5000;
const SELF_DESTRUCT_HP_PERCENT = 0.02; // 2% maxHP per tick

// ═══ Archetype-based skill names ═══
const ARCHETYPE_SKILLS: Record<string, string[]> = {
  glass_cannon: ['Đòn chí mạng!', 'Song kiếm!', 'Cuồng nộ!'],
  tank:         ['Lao đầu!', 'Đập đất!', 'Giáp gai!'],
  healer:       ['Hồi máu!', 'Bào tử hồi!', 'Hút máu!'],
  assassin:     ['Đa đòn!', 'Tấn công tốc!', 'Ám sát!'],
  controller:   ['Xáo trộn!', 'Hút mana!', 'Choáng!'],
  hybrid:       ['Hỗn hợp!', 'Toàn diện!', 'Tổng lực!'],
  all:          ['Đế Vương giáng!', 'Thiên phạt!'],
  none:         ['Tấn công mạnh!', 'Lửa Địa Ngục!', 'Sấm Sét!', 'Đòn Cuồng Phong!'],
};

function getBossSkillName(archetype: string): string {
  const pool = ARCHETYPE_SKILLS[archetype] || ARCHETYPE_SKILLS.none;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ═══ Enrage: boss gets stronger over time ═══
function getEnrageMultiplier(startTime: number): number {
  const elapsed = (Date.now() - startTime) / 1000;
  return 1 + Math.floor(elapsed / 30) * 0.10;
}

// ═══ Stars by time — rebalanced for ×15 HP bosses ═══
function calculateTimeStars(duration: number, bossLevel: number): number {
  const baseTime = 60 + bossLevel * 1.5;
  if (duration <= baseTime) return 3;
  if (duration <= baseTime * 1.5) return 2;
  return 1;
}

// ═══ NEW: Boss DEF reduction (diminishing returns) ═══
// DEF/(DEF+500): 0→0%, 100→17%, 250→33%, 450→47%, 500→50%
function bossDEFReduction(rawDamage: number, bossDef: number): number {
  if (bossDef <= 0) return rawDamage;
  const reduction = bossDef / (bossDef + 500);
  return Math.max(1, Math.round(rawDamage * (1 - reduction)));
}

// ═══ Types ═══
interface BossAttackInfo { name: string; emoji: string; dmgMult: number; }

export type FightResult = 'fighting' | 'victory' | 'defeat';

export interface BossAttackWarning {
  skill: BossAttackInfo | null;
  rawDmg: number;
  phase: 'warning' | 'dodge_window' | 'hit';
}

export interface SkillWarning {
  name: string;
  damage: number;
  countdown: number;
}

export interface CombatStats {
  critCount: number;
  reflectTotal: number;
  dodgeCount: number;
  ultCount: number;
  totalHealed: number;
  totalShieldGained: number;
  turnsPlayed: number;
}

export type CombatNotifType = 'crit' | 'reflect' | 'regen' | 'fort' | 'immortal' | 'dodge';
export interface CombatNotif {
  id: number;
  type: CombatNotifType;
  text: string;
  color: string;
}

// ═══════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════

export function useMatch3Campaign(bossData: CampaignBossData, playerStats: PlayerCombatStats) {
  const turnLimit = bossData.turnLimit || 0;

  // ═══ Phase support ═══
  const phases = bossData.phases;
  const isMultiPhase = !!phases && phases.length > 1;

  // Active boss stats — ref to avoid re-render on phase change
  // For non-phase bosses: stays at initial values forever
  // For phase bosses: updated by checkPhaseTransition()
  const activeBossStats = useRef({
    atk: isMultiPhase ? phases![0].atk : bossData.attack,
    def: isMultiPhase ? phases![0].def : (bossData.def || 0),
    freq: isMultiPhase ? phases![0].freq : (bossData.freq || 1),
    healPercent: isMultiPhase ? phases![0].healPercent : (bossData.healPercent || 0),
  });

  const [currentPhase, setCurrentPhase] = useState(1);
  const currentPhaseRef = useRef(1);
  const [showPhaseTransition, setShowPhaseTransition] = useState<BossPhase | null>(null);
  const selfDestructTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute stat-based values
  const milestones = useMemo(() => getActiveMilestones(playerStats), [playerStats]);
  const dmgPerGem = useMemo(() => ({
    atk: atkGemDamage(playerStats.atk),
    hp: 0,
    def: 0,
    star: starGemDamage(playerStats.atk),
  }), [playerStats.atk]);
  const hpHealPerGem = useMemo(() => hpPerGem(playerStats.hp), [playerStats.hp]);
  const shieldGainPerGem = useMemo(() => shieldPerGem(playerStats.def), [playerStats.def]);
  const manaRegen = useMemo(() => manaRegenPerTurn(playerStats.mana), [playerStats.mana]);
  const manaDodgeCost = useMemo(() => dodgeCost(milestones.dodgeCostReduced), [milestones.dodgeCostReduced]);
  const manaUltCost = useMemo(() => ultCost(milestones.ultCostReduced), [milestones.ultCostReduced]);

  const [grid, setGrid] = useState<Gem[]>(createGrid);
  const [selected, setSelected] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [matchedCells, setMatchedCells] = useState<Set<number>>(new Set());
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const comboRef = useRef(0);
  const [boss, setBoss] = useState<BossState>({
    bossHp: bossData.hp, bossMaxHp: bossData.hp,
    playerHp: maxPlayerHp(playerStats.hp),
    playerMaxHp: maxPlayerHp(playerStats.hp),
    shield: startingShield(playerStats.def),
    ultCharge: 0,
    mana: playerStats.mana,
    maxMana: playerStats.mana,
    turnCount: 0,
    immortalUsed: false,
    lastCrit: false,
    ultCooldown: 0,
  });
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const popupId = useRef(0);
  const [bossAttackMsg, setBossAttackMsg] = useState<{ text: string; emoji: string } | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [result, setResult] = useState<FightResult>('fighting');
  const [totalDmgDealt, setTotalDmgDealt] = useState(0);
  const [combatStatsTracker, setCombatStatsTracker] = useState<CombatStats>({
    critCount: 0, reflectTotal: 0, dodgeCount: 0, ultCount: 0,
    totalHealed: 0, totalShieldGained: 0, turnsPlayed: 0,
  });
  const [combatNotifs, setCombatNotifs] = useState<CombatNotif[]>([]);
  const notifIdRef = useRef(0);

  const addCombatNotif = useCallback((type: CombatNotifType, text: string, color: string) => {
    const id = notifIdRef.current++;
    setCombatNotifs(prev => [...prev, { id, type, text, color }]);
    setTimeout(() => setCombatNotifs(prev => prev.filter(n => n.id !== id)), 2000);
  }, []);

  // Fight start time
  const fightStartTime = useRef(Date.now());
  const maxComboRef = useRef(0);
  const [stars, setStars] = useState(0);
  const [skillWarning, setSkillWarning] = useState<SkillWarning | null>(null);
  const [attackWarning, setAttackWarning] = useState<BossAttackWarning | null>(null);
  const dodgedRef = useRef(false);
  const [ultActive, setUltActive] = useState(false);

  // Track pending multi-hit timeouts for cleanup
  const pendingHitsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const addPopup = useCallback((text: string, color: string) => {
    const id = popupId.current++;
    const x = 20 + Math.random() * 60;
    const y = 15 + Math.random() * 40;
    setPopups(prev => [...prev, { id, text, color, x, y }]);
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1400);
  }, []);

  // ═══ Self-destruct: Phase 4 boss loses 2% maxHP every 5s ═══
  const startSelfDestruct = useCallback(() => {
    if (selfDestructTimerRef.current) return; // already running
    selfDestructTimerRef.current = setInterval(() => {
      setBoss(prev => {
        if (prev.bossHp <= 0) return prev;
        const loss = Math.round(prev.bossMaxHp * SELF_DESTRUCT_HP_PERCENT);
        const newHp = Math.max(0, prev.bossHp - loss);
        addPopup(`-${loss} 💀`, '#e74c3c');
        return { ...prev, bossHp: newHp };
      });
    }, SELF_DESTRUCT_INTERVAL);
  }, [addPopup]);

  // ═══ Phase transition check ═══
  const checkPhaseTransition = useCallback((currentHpPercent: number) => {
    if (!isMultiPhase || !phases) return;

    // Find the most advanced phase matching current HP%
    // phases: hpThreshold 100, 75, 50, 25
    // Filter: all phases where HP% <= threshold, then take lowest threshold
    const matchedPhase = phases
      .filter(p => currentHpPercent <= p.hpThreshold)
      .sort((a, b) => a.hpThreshold - b.hpThreshold)[0];

    if (!matchedPhase || matchedPhase.phaseNumber === currentPhaseRef.current) return;

    // PHASE TRANSITION!
    currentPhaseRef.current = matchedPhase.phaseNumber;
    setCurrentPhase(matchedPhase.phaseNumber);

    // Update active boss stats
    activeBossStats.current = {
      atk: matchedPhase.atk,
      def: matchedPhase.def,
      freq: matchedPhase.freq,
      healPercent: matchedPhase.healPercent,
    };

    // Show transition animation (2s)
    setShowPhaseTransition(matchedPhase);
    setTimeout(() => setShowPhaseTransition(null), 2000);

    // Phase 4 Glass Cannon: self-destruct
    if (matchedPhase.phaseNumber === 4) {
      startSelfDestruct();
    }
  }, [isMultiPhase, phases, startSelfDestruct]);

  // ═══ Phase transition trigger — watches boss HP ═══
  useEffect(() => {
    if (!isMultiPhase || result !== 'fighting' || boss.bossHp <= 0) return;
    const hpPercent = (boss.bossHp / boss.bossMaxHp) * 100;
    checkPhaseTransition(hpPercent);
  }, [boss.bossHp, boss.bossMaxHp, isMultiPhase, result, checkPhaseTransition]);

  // Check victory/defeat — compute stars on victory
  useEffect(() => {
    if (boss.bossHp <= 0 && result === 'fighting') {
      const finalDuration = Math.floor((Date.now() - fightStartTime.current) / 1000);
      const bossLevel = bossData.unlockLevel || 1;
      setStars(calculateTimeStars(finalDuration, bossLevel));
      setResult('victory');
      // Cleanup self-destruct timer on victory
      if (selfDestructTimerRef.current) {
        clearInterval(selfDestructTimerRef.current);
        selfDestructTimerRef.current = null;
      }
    }
    if (boss.playerHp <= 0 && result === 'fighting') {
      setResult('defeat');
      if (selfDestructTimerRef.current) {
        clearInterval(selfDestructTimerRef.current);
        selfDestructTimerRef.current = null;
      }
    }
    if (turnLimit > 0 && boss.turnCount >= turnLimit && result === 'fighting' && boss.bossHp > 0) {
      setResult('defeat');
      if (selfDestructTimerRef.current) {
        clearInterval(selfDestructTimerRef.current);
        selfDestructTimerRef.current = null;
      }
    }
  }, [boss.bossHp, boss.playerHp, boss.turnCount, turnLimit, result, bossData.unlockLevel]);

  // Cleanup self-destruct timer on unmount
  useEffect(() => {
    return () => {
      if (selfDestructTimerRef.current) {
        clearInterval(selfDestructTimerRef.current);
        selfDestructTimerRef.current = null;
      }
    };
  }, []);

  // ═══ Helper: apply boss damage to player (shared by normal + skill attacks) ═══
  const applyBossDamageToPlayer = useCallback((dmgAmount: number, label: string, emoji: string) => {
    setBoss(prev => {
      if (prev.bossHp <= 0 || prev.playerHp <= 0) return prev;

      // Fort milestone: immune every 10 turns
      if (milestones.hasFort && prev.turnCount > 0 && prev.turnCount % 10 === 0) {
        addPopup('🏰 Mien nhiem!', '#74b9ff');
        addCombatNotif('fort', '🏰 Thanh Tri bat!', '#74b9ff');
        setBossAttackMsg({ text: 'Thanh Tri bat!', emoji: '🏰' });
        setTimeout(() => setBossAttackMsg(null), 1000);
        return prev;
      }

      // Apply player DEF damage reduction
      const reducedDmg = actualBossDamage(dmgAmount, playerStats.def);

      let shieldLeft = prev.shield;
      let hpDmg = reducedDmg;
      if (shieldLeft > 0) {
        const absorbed = Math.min(shieldLeft, reducedDmg);
        shieldLeft -= absorbed;
        hpDmg -= absorbed;
      }
      let newPlayerHp = Math.max(0, prev.playerHp - hpDmg);

      // Immortal milestone: revive once
      if (newPlayerHp <= 0 && !prev.immortalUsed && milestones.hasImmortal) {
        newPlayerHp = Math.floor(prev.playerMaxHp * 0.2);
        addPopup('👼 Bat Tu!', '#a29bfe');
        addCombatNotif('immortal', '👼 Bat Tu kich hoat!', '#a29bfe');
        return { ...prev, playerHp: newPlayerHp, shield: shieldLeft, immortalUsed: true };
      }

      // Reflect milestone
      let newBossHp = prev.bossHp;
      if (milestones.reflectPercent > 0 && reducedDmg > 0) {
        const reflectDmg = Math.floor(reducedDmg * milestones.reflectPercent);
        newBossHp = Math.max(0, prev.bossHp - reflectDmg);
        if (reflectDmg > 0) {
          setTotalDmgDealt(d => d + reflectDmg);
          setCombatStatsTracker(s => ({ ...s, reflectTotal: s.reflectTotal + reflectDmg }));
          addPopup(`🛡️ Phan -${reflectDmg}`, '#74b9ff');
          addCombatNotif('reflect', `🛡️ Phan xa ${reflectDmg} DMG!`, '#74b9ff');
        }
      }

      return { ...prev, playerHp: newPlayerHp, shield: shieldLeft, bossHp: newBossHp };
    });

    const reducedDisplay = actualBossDamage(dmgAmount, playerStats.def);
    setBossAttackMsg({ text: `${label} -${reducedDisplay}`, emoji });
    setScreenShake(true);
    addPopup(`-${reducedDisplay}`, '#e74c3c');
    setTimeout(() => { setBossAttackMsg(null); setScreenShake(false); }, 1200);
  }, [milestones, playerStats.def, addPopup, addCombatNotif]);

  // ═══ Boss auto-attack: reads activeBossStats ref for phase support ═══
  useEffect(() => {
    if (result !== 'fighting') return;

    const interval = setInterval(() => {
      const enrageMult = getEnrageMultiplier(fightStartTime.current);
      const baseAtk = activeBossStats.current.atk * enrageMult;

      const isSkill = Math.random() < BOSS_SKILL_CHANCE;

      if (isSkill) {
        // ══ SKILL ATTACK: 1 hit x2.5, NOT multiplied by freq ══
        const skillName = getBossSkillName(bossData.archetype || 'none');
        const skillDmg = Math.round(baseAtk * SKILL_DMG_MULT);

        dodgedRef.current = false;
        setAttackWarning({ skill: { name: skillName, emoji: '⚠️', dmgMult: SKILL_DMG_MULT }, rawDmg: skillDmg, phase: 'warning' });
        setSkillWarning({ name: skillName, damage: skillDmg, countdown: 1.5 });

        const skillTimeout = setTimeout(() => {
          setAttackWarning(null);
          setSkillWarning(null);

          if (dodgedRef.current) {
            setBossAttackMsg({ text: 'NÉ THÀNH CÔNG! 🏃', emoji: '💨' });
            setTimeout(() => setBossAttackMsg(null), 1000);
            return;
          }

          applyBossDamageToPlayer(skillDmg, `${skillName}`, '💀');
        }, SKILL_WARNING_MS);
        pendingHitsRef.current.push(skillTimeout);
      } else {
        // ══ NORMAL ATTACK: freq hits from activeBossStats, 300ms apart ══
        const freq = Math.max(1, activeBossStats.current.freq);
        for (let i = 0; i < freq; i++) {
          const hitTimeout = setTimeout(() => {
            const normalDmg = Math.round(baseAtk + Math.floor(Math.random() * Math.round(baseAtk * 0.3)));
            const hitLabel = freq > 1 ? `Đòn ${i + 1}/${freq}!` : 'Boss tấn công!';
            applyBossDamageToPlayer(normalDmg, hitLabel, '💥');
          }, i * MULTI_HIT_DELAY);
          pendingHitsRef.current.push(hitTimeout);
        }
      }
    }, BOSS_ATK_INTERVAL);

    return () => {
      clearInterval(interval);
      pendingHitsRef.current.forEach(t => clearTimeout(t));
      pendingHitsRef.current = [];
    };
  }, [bossData.archetype, result, applyBossDamageToPlayer]);

  // ═══ Boss Heal Timer — reads activeBossStats for dynamic healPercent ═══
  // Re-runs when currentPhase changes (for phase bosses) to pick up new healPercent
  useEffect(() => {
    if (result !== 'fighting') return;
    // Read current heal percent from ref (changes with phase)
    const hp = activeBossStats.current.healPercent;
    if (hp <= 0) return;

    const healTimer = setInterval(() => {
      // Re-read in case phase changed mid-interval
      const currentHealPct = activeBossStats.current.healPercent;
      if (currentHealPct <= 0) return;

      setBoss(prev => {
        if (prev.bossHp <= 0 || prev.bossHp >= prev.bossMaxHp) return prev;
        const healAmount = Math.round(prev.bossMaxHp * currentHealPct / 100);
        const newHp = Math.min(prev.bossMaxHp, prev.bossHp + healAmount);
        addPopup(`+${healAmount} 💚`, '#27ae60');
        return { ...prev, bossHp: newHp };
      });
    }, BOSS_HEAL_INTERVAL);

    return () => clearInterval(healTimer);
  }, [currentPhase, result, addPopup]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dodge handler — only works during skill warning, costs mana
  const handleDodge = useCallback(() => {
    if (!skillWarning && attackWarning?.phase !== 'dodge_window' && attackWarning?.phase !== 'warning') return;
    setBoss(prev => {
      if (prev.mana < manaDodgeCost) {
        addPopup(`Thiếu mana! (${manaDodgeCost})`, '#e74c3c');
        return prev;
      }
      dodgedRef.current = true;
      setAttackWarning(null);
      setSkillWarning(null);
      setCombatStatsTracker(s => ({ ...s, dodgeCount: s.dodgeCount + 1 }));
      addCombatNotif('dodge', '🏃 Né thành công!', '#55efc4');
      return { ...prev, mana: prev.mana - manaDodgeCost };
    });
  }, [skillWarning, attackWarning, manaDodgeCost, addPopup, addCombatNotif]);

  // Ultimate — uses activeBossStats.current.def for DEF reduction
  const fireUltimate = useCallback(() => {
    if (boss.ultCharge < 100 || result !== 'fighting') return;

    setBoss(prev => {
      if (milestones.hasSuperMana) {
        if (prev.ultCooldown > 0) {
          addPopup(`ULT CD: ${prev.ultCooldown} turn`, '#e74c3c');
          return prev;
        }
      } else {
        if (prev.mana < manaUltCost) {
          addPopup(`Thieu mana! (${manaUltCost})`, '#e74c3c');
          return prev;
        }
      }

      setUltActive(true);
      // ULT damage is ALSO reduced by boss DEF (from active phase stats)
      const currentDef = activeBossStats.current.def;
      const rawUltDmg = calcUltDamage(playerStats.atk, playerStats.mana);
      const ultDmg = bossDEFReduction(rawUltDmg, currentDef);
      setTotalDmgDealt(d => d + ultDmg);
      setCombatStatsTracker(s => ({ ...s, ultCount: s.ultCount + 1 }));
      if (currentDef > 0) {
        addPopup(`⚡ ULT -${ultDmg} 🛡️`, '#e056fd');
      } else {
        addPopup(`⚡ ULTIMATE -${ultDmg}`, '#e056fd');
      }
      setScreenShake(true);
      setTimeout(() => { setUltActive(false); setScreenShake(false); }, 1500);

      return {
        ...prev,
        bossHp: Math.max(0, prev.bossHp - ultDmg),
        ultCharge: 0,
        mana: milestones.hasSuperMana ? prev.mana : prev.mana - manaUltCost,
        ultCooldown: milestones.hasSuperMana ? 8 : 0,
      };
    });
  }, [boss.ultCharge, result, addPopup, milestones, manaUltCost, playerStats]);

  // ═══ Process matches — uses activeBossStats.current.def for DEF reduction ═══
  const processMatches = useCallback((currentGrid: Gem[], currentCombo: number) => {
    const matched = findMatches(currentGrid);
    if (matched.size === 0) {
      if (currentCombo > 1) setTimeout(() => setShowCombo(false), 1500);
      else setShowCombo(false);
      comboRef.current = 0;
      setAnimating(false);
      return;
    }
    const newCombo = currentCombo + 1;
    comboRef.current = newCombo;
    if (newCombo > maxComboRef.current) maxComboRef.current = newCombo;
    setCombo(newCombo);
    if (newCombo >= 2) setShowCombo(true);
    const comboInfo = getComboInfo(newCombo);

    const tally: Partial<Record<GemType, number>> = {};
    matched.forEach(idx => { const t = currentGrid[idx].type; tally[t] = (tally[t] || 0) + 1; });
    setMatchedCells(new Set(matched));

    setTimeout(() => {
      setBoss(prev => {
        let { bossHp, playerHp, shield, ultCharge, mana, turnCount, ultCooldown } = prev;
        const atkCount = tally.atk || 0;
        const hpCount = tally.hp || 0;
        const defCount = tally.def || 0;
        const starCount = tally.star || 0;

        turnCount++;
        if (ultCooldown > 0) ultCooldown--;

        // Raw damage calculation
        const baseDmg = atkCount * dmgPerGem.atk + starCount * dmgPerGem.star;
        let totalDmg = Math.round(baseDmg * comboInfo.mult);

        // Crit check
        let isCrit = false;
        if (milestones.critChance > 0 && totalDmg > 0 && Math.random() < milestones.critChance) {
          totalDmg = Math.round(totalDmg * milestones.critMultiplier);
          isCrit = true;
          setCombatStatsTracker(s => ({ ...s, critCount: s.critCount + 1 }));
          addCombatNotif('crit', `CRIT! x${milestones.critMultiplier}`, '#ff6b6b');
        }

        // ═══ BOSS DEF REDUCTION (reads from activeBossStats ref) ═══
        const currentDef = activeBossStats.current.def;
        const actualDmg = bossDEFReduction(totalDmg, currentDef);
        bossHp = Math.max(0, bossHp - actualDmg);

        // Stat-based heal & shield
        const healAmt = Math.round(hpCount * hpHealPerGem * comboInfo.mult);
        playerHp = Math.min(prev.playerMaxHp, playerHp + healAmt);
        const shieldAmt = Math.round(defCount * shieldGainPerGem * comboInfo.mult);
        shield = shield + shieldAmt;

        if (healAmt > 0) setCombatStatsTracker(s => ({ ...s, totalHealed: s.totalHealed + healAmt }));
        if (shieldAmt > 0) setCombatStatsTracker(s => ({ ...s, totalShieldGained: s.totalShieldGained + shieldAmt }));

        // Mana regen per turn
        mana = Math.min(prev.maxMana, mana + manaRegen);

        // ULT charge
        ultCharge = Math.min(100, ultCharge + starCount * 8 + atkCount * 3 + (newCombo >= 2 ? 5 : 0));

        // HP regen milestone
        if (milestones.regenPercent > 0 && turnCount % milestones.regenInterval === 0) {
          const regenHp = Math.floor(prev.playerMaxHp * milestones.regenPercent);
          playerHp = Math.min(prev.playerMaxHp, playerHp + regenHp);
          addPopup(`💚 Hoi +${regenHp} HP`, '#55efc4');
          addCombatNotif('regen', `💚 Hoi phuc +${regenHp} HP`, '#55efc4');
          setCombatStatsTracker(s => ({ ...s, totalHealed: s.totalHealed + regenHp }));
        }

        setCombatStatsTracker(s => ({ ...s, turnsPlayed: turnCount }));

        if (actualDmg > 0) {
          setTotalDmgDealt(d => d + actualDmg);
          const critLabel = isCrit ? ' CRIT!' : '';
          const defLabel = currentDef > 0 ? ' 🛡️' : '';
          const label = newCombo >= 2
            ? `-${actualDmg} (x${comboInfo.mult})${critLabel}${defLabel}`
            : `-${actualDmg}${critLabel}${defLabel}`;
          addPopup(label, isCrit ? '#ff6b6b' : comboInfo.color);
        }
        if (hpCount > 0) addPopup(`+${healAmt} HP`, '#55efc4');
        if (defCount > 0) addPopup(`+${shieldAmt} 🛡️`, '#74b9ff');

        return { ...prev, bossHp, playerHp, shield, ultCharge, mana, turnCount, ultCooldown, lastCrit: isCrit };
      });

      const cleared = currentGrid.map((g, i) => matched.has(i) ? null : g) as (Gem | null)[];
      const fallen = applyGravity(cleared as Gem[]);
      setGrid(fallen);
      setMatchedCells(new Set());
      setTimeout(() => processMatches(fallen, newCombo), 300);
    }, 350);
  }, [addPopup, dmgPerGem, hpHealPerGem, shieldGainPerGem, manaRegen, milestones, addCombatNotif]);

  const handleTap = useCallback((idx: number) => {
    if (animating || result !== 'fighting') return;
    if (selected === null) { setSelected(idx); return; }
    if (selected === idx) { setSelected(null); return; }
    if (!areAdjacent(selected, idx)) { setSelected(idx); return; }

    setAnimating(true);
    setSelected(null);
    const newGrid = [...grid];
    [newGrid[selected], newGrid[idx]] = [newGrid[idx], newGrid[selected]];

    const matched = findMatches(newGrid);
    if (matched.size === 0) {
      setGrid(newGrid);
      setTimeout(() => {
        const reverted = [...newGrid];
        [reverted[selected], reverted[idx]] = [reverted[idx], reverted[selected]];
        setGrid(reverted);
        setAnimating(false);
      }, 300);
      return;
    }

    setGrid(newGrid);
    setTimeout(() => processMatches(newGrid, 0), 200);
  }, [grid, selected, animating, processMatches, result]);

  // Duration tracking
  const durationSeconds = Math.floor((Date.now() - fightStartTime.current) / 1000);
  const enrageMultiplier = getEnrageMultiplier(fightStartTime.current);

  return {
    grid, selected, animating, matchedCells, combo, showCombo, boss, popups,
    handleTap, GEM_META, getComboInfo, bossAttackMsg, screenShake,
    result, totalDmgDealt, attackWarning, handleDodge, fireUltimate, ultActive,
    durationSeconds, fightStartTime: fightStartTime.current,
    milestones, manaDodgeCost, manaUltCost,
    combatStatsTracker, combatNotifs,
    skillWarning,
    enrageMultiplier,
    stars,
    maxCombo: maxComboRef.current,
    // Phase support
    currentPhase,
    totalPhases: isMultiPhase ? phases!.length : 1,
    showPhaseTransition,
    activeBossStats: activeBossStats.current,
  };
}
