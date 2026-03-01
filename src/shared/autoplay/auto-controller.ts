// ═══════════════════════════════════════════════════════════════
// Auto-play controller — main orchestrator hook
// Connects simulator, scorer, skill-manager into one system
// This is the ONLY file with side effects (reads refs, calls handlers)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Gem } from '../match3/board.utils';
import type { BossState, ActiveDebuff, ActiveBossBuff, EggState, SkillWarning } from '../match3/combat.types';
import type { ValidSwap } from './auto-simulator';
import type { BattleLog, BattleLogTurn } from '../types/gameplay.types';
import { simulateSwap, findAllValidSwaps, quickSimulate } from './auto-simulator';
import { scoreMove, scoreMoveQuick, selectSituation, type ScorerGameState } from './auto-scorer';
import { getSkillDecision, type SkillManagerState, type SkillDecision } from './auto-skill-manager';
import { mctsSearch } from './auto-mcts';
import strategy from './auto-strategy.json';

// ═══ VIP tier config ═══

interface VipTier {
  algorithm: string;
  tickMs: number;
  autoSkill: string | boolean;
  freeDodges: number;
}

const vipTiers: Record<number, VipTier> = {
  1: { algorithm: 'random',          tickMs: 2500, autoSkill: false,          freeDodges: 5 },
  2: { algorithm: 'greedy_weighted', tickMs: 2000, autoSkill: false,          freeDodges: 5 },
  3: { algorithm: 'greedy_cascade',  tickMs: 1500, autoSkill: 'dodge_only',   freeDodges: 5 },
  4: { algorithm: 'mcts',            tickMs: 1200, autoSkill: 'dodge_and_ult', freeDodges: 5 },
  5: { algorithm: 'mcts',            tickMs: 1000, autoSkill: 'full',          freeDodges: 7 },
};

const dodgeFreeDefault = (strategy.dodgeConfig as { freePerBattle: number }).freePerBattle;

// ═══ Props & Return types ═══

export interface UseAutoPlayControllerProps {
  // Grid
  gridRef: React.MutableRefObject<Gem[]>;
  lockedGemsRef?: React.MutableRefObject<Set<number>>;

  // Boss state (from BossState in combat.types)
  bossRef: React.MutableRefObject<BossState>;

  // Campaign-specific refs
  activeDebuffsRef?: React.MutableRefObject<ActiveDebuff[]>;
  activeBossBuffsRef?: React.MutableRefObject<ActiveBossBuff[]>;
  eggRef?: React.MutableRefObject<EggState | null>;
  skillWarningRef?: React.MutableRefObject<SkillWarning | null>;

  // Campaign boss stats (archetype, DEF, healPercent, freq)
  activeBossStatsRef?: React.MutableRefObject<{
    atk: number; def: number; freq: number; healPercent: number;
  }>;

  // Player combat stats for scoring
  playerStats: { atk: number; hp: number; def: number; mana: number };

  // Skill levels (campaign)
  skillLevels?: { sam_dong: number; ot_hiem: number; rom_boc: number };
  otHiemActiveRef?: React.MutableRefObject<boolean>;
  otHiemOnCooldownRef?: React.MutableRefObject<boolean>;
  romBocActiveRef?: React.MutableRefObject<boolean>;
  romBocOnCooldownRef?: React.MutableRefObject<boolean>;

  // Game mode
  mode: 'boss' | 'campaign';
  bossArchetype?: string;
  isDeVuong?: boolean;
  deVuongPhaseRef?: React.MutableRefObject<number>;
  enrageMultiplierRef?: React.MutableRefObject<number>;

  // Action handlers — must match existing patterns:
  // handleSwipe(idx, direction) from input-handlers.ts / match3-input.handlers.ts
  handleSwipe: (idx: number, direction: 'up' | 'down' | 'left' | 'right') => void;
  handleDodge: () => void;
  fireUltimate: () => void;
  onOtHiem?: () => void;
  onRomBoc?: () => void;

  // UI feedback
  onHighlightGem?: (pos: number) => void;
  onClearHighlight?: () => void;

  // Animation state
  animatingRef: React.MutableRefObject<boolean>;
  isStunnedRef?: React.MutableRefObject<boolean>;
  isPausedRef?: React.MutableRefObject<boolean>;
  result: React.MutableRefObject<'fighting' | 'victory' | 'defeat'>;
}

export interface UseAutoPlayControllerReturn {
  isActive: boolean;
  toggle: () => void;
  setVipLevel: (level: number) => void;
  vipLevel: number;
  currentSituation: string;
  lastScore: number;
  dodgesUsed: number;
  dodgeFreeRemaining: number;
  tickCount: number;
  gemsUsed: { atk: number; hp: number; def: number; star: number };
  ultsUsed: number;
  // B4 — battle log data for completeBoss
  getBattleLog: () => BattleLog;
}

// ═══ Dominant gem type from quick sim ═══

function dominantGemType(counts: { atk: number; hp: number; def: number; star: number }): string | undefined {
  const { atk, hp, def, star } = counts;
  const max = Math.max(atk, hp, def, star);
  if (max === 0) return undefined;
  if (max === star) return 'star';
  if (max === atk) return 'atk';
  if (max === hp) return 'hp';
  return 'def';
}

// ═══ Direction from posA → posB ═══

function swapDirection(posA: number, posB: number): 'up' | 'down' | 'left' | 'right' {
  const diff = posB - posA;
  if (diff === 1) return 'right';
  if (diff === -1) return 'left';
  if (diff > 0) return 'down';
  return 'up';
}

// ═══ Main hook ═══

export function useAutoPlayController(props: UseAutoPlayControllerProps): UseAutoPlayControllerReturn {
  // ═══ STATE ═══
  const [isActive, setIsActive] = useState(false);
  const [vipLevel, setVipLevelState] = useState(1);
  const [dodgesUsed, setDodgesUsed] = useState(0);
  const [tickCount, setTickCount] = useState(0);
  const [currentSituation, setCurrentSituation] = useState('normal');
  const [lastScore, setLastScore] = useState(0);

  const gemsUsedRef = useRef({ atk: 0, hp: 0, def: 0, star: 0 });
  const ultsUsedRef = useRef(0);

  // B4 — battle log refs
  const turnLogRef = useRef<BattleLogTurn[]>([]);
  const situationsRef = useRef<Set<string>>(new Set());

  // Refs to avoid stale closures in setInterval
  const isActiveRef = useRef(false);
  const vipLevelRef = useRef(1);
  const dodgesUsedRef = useRef(0);

  // Stable refs for action callbacks
  const handleSwipeRef = useRef(props.handleSwipe);
  const handleDodgeRef = useRef(props.handleDodge);
  const fireUltimateRef = useRef(props.fireUltimate);
  const onOtHiemRef = useRef(props.onOtHiem);
  const onRomBocRef = useRef(props.onRomBoc);
  const onHighlightRef = useRef(props.onHighlightGem);
  const onClearHighlightRef = useRef(props.onClearHighlight);

  useEffect(() => { handleSwipeRef.current = props.handleSwipe; }, [props.handleSwipe]);
  useEffect(() => { handleDodgeRef.current = props.handleDodge; }, [props.handleDodge]);
  useEffect(() => { fireUltimateRef.current = props.fireUltimate; }, [props.fireUltimate]);
  useEffect(() => { onOtHiemRef.current = props.onOtHiem; }, [props.onOtHiem]);
  useEffect(() => { onRomBocRef.current = props.onRomBoc; }, [props.onRomBoc]);
  useEffect(() => { onHighlightRef.current = props.onHighlightGem; }, [props.onHighlightGem]);
  useEffect(() => { onClearHighlightRef.current = props.onClearHighlight; }, [props.onClearHighlight]);

  // ═══ TOGGLE ═══
  const toggle = useCallback(() => {
    const next = !isActiveRef.current;
    isActiveRef.current = next;
    setIsActive(next);
    if (next) {
      // Reset counters on activation
      dodgesUsedRef.current = 0;
      setDodgesUsed(0);
      setTickCount(0);
      setCurrentSituation('normal');
      setLastScore(0);
      gemsUsedRef.current = { atk: 0, hp: 0, def: 0, star: 0 };
      ultsUsedRef.current = 0;
      turnLogRef.current = [];
      situationsRef.current = new Set();
    }
  }, []);

  const setVipLevel = useCallback((lv: number) => {
    const clamped = Math.max(1, Math.min(5, lv));
    vipLevelRef.current = clamped;
    setVipLevelState(clamped);
  }, []);

  // ═══ STOP on battle end ═══
  useEffect(() => {
    if (props.result.current !== 'fighting') {
      isActiveRef.current = false;
      setIsActive(false);
    }
  });

  // ═══ BUILD SCORER STATE ═══
  function buildScorerState(): ScorerGameState {
    const boss = props.bossRef.current;
    const bossStats = props.activeBossStatsRef?.current;
    const debuffs = props.activeDebuffsRef?.current ?? [];
    const bossBuffs = props.activeBossBuffsRef?.current ?? [];
    const debuffSet = new Set(debuffs.map(d => d.type));
    const buffSet = new Set(bossBuffs.map(b => b.type));

    return {
      playerHP: boss.playerHp,
      playerMaxHP: boss.playerMaxHp,
      playerATK: props.playerStats.atk,
      playerHP_stat: props.playerStats.hp,
      playerDEF_stat: props.playerStats.def,
      playerMANA: props.playerStats.mana,
      bossHP: boss.bossHp,
      bossMaxHP: boss.bossMaxHp,
      bossDEF: bossStats?.def ?? 0,
      bossArchetype: props.bossArchetype ?? 'none',
      bossHealPercent: bossStats?.healPercent ?? 0,
      enrageMultiplier: props.enrageMultiplierRef?.current ?? 1.0,
      ultCharge: boss.ultCharge,
      activeDebuffs: debuffSet,
      activeBossBuffs: buffSet,
      eggActive: props.eggRef?.current != null,
      otHiemActive: props.otHiemActiveRef?.current ?? false,
      isDeVuong: props.isDeVuong ?? false,
      deVuongPhase: props.deVuongPhaseRef?.current ?? 1,
      isWeeklyBoss: props.mode === 'boss',
      vipLevel: vipLevelRef.current,
    };
  }

  // ═══ BUILD SKILL MANAGER STATE ═══
  function buildSkillState(): SkillManagerState {
    const boss = props.bossRef.current;
    const bossStats = props.activeBossStatsRef?.current;
    const bossBuffs = props.activeBossBuffsRef?.current ?? [];
    const buffSet = new Set(bossBuffs.map(b => b.type));
    const tier = vipTiers[vipLevelRef.current];

    return {
      playerHP: boss.playerHp,
      playerMaxHP: boss.playerMaxHp,
      playerMANA_stat: props.playerStats.mana,
      currentMana: boss.mana,
      ultCharge: boss.ultCharge,
      skillWarning: props.skillWarningRef?.current != null,
      otHiemActive: props.otHiemActiveRef?.current ?? false,
      otHiemOnCooldown: props.otHiemOnCooldownRef?.current ?? false,
      romBocActive: props.romBocActiveRef?.current ?? false,
      romBocOnCooldown: props.romBocOnCooldownRef?.current ?? false,
      samDongLevel: props.skillLevels?.sam_dong ?? 1,
      otHiemLevel: props.skillLevels?.ot_hiem ?? 1,
      romBocLevel: props.skillLevels?.rom_boc ?? 1,
      bossHP: boss.bossHp,
      bossMaxHP: boss.bossMaxHp,
      bossDEF: bossStats?.def ?? 0,
      bossATK: bossStats?.atk ?? 0,
      bossArchetype: props.bossArchetype ?? 'none',
      activeBossBuffs: buffSet,
      isDeVuong: props.isDeVuong ?? false,
      deVuongPhase: props.deVuongPhaseRef?.current ?? 1,
      dodgesUsedThisBattle: dodgesUsedRef.current,
      dodgeFreeLimit: tier.freeDodges,
      vipLevel: vipLevelRef.current,
      turnsSinceUlt: boss.ultCooldown,
      enrageMultiplier: props.enrageMultiplierRef?.current ?? 1.0,
    };
  }

  // ═══ SKILL EXECUTOR ═══
  function executeSkill(decision: SkillDecision): void {
    switch (decision.action) {
      case 'dodge':
        handleDodgeRef.current();
        dodgesUsedRef.current += 1;
        setDodgesUsed(dodgesUsedRef.current);
        break;
      case 'samDong':
        fireUltimateRef.current();
        ultsUsedRef.current += 1;
        break;
      case 'otHiem':
        onOtHiemRef.current?.();
        break;
      case 'romBoc':
        onRomBocRef.current?.();
        break;
    }
  }

  // ═══ FIND BEST SWAP by algorithm ═══
  function findBestSwap(algorithm: string, scorerState: ScorerGameState): { swap: ValidSwap | null; score: number } {
    const grid = props.gridRef.current;
    const locked = props.lockedGemsRef?.current;
    const swaps = findAllValidSwaps(grid, locked);
    if (swaps.length === 0) return { swap: null, score: 0 };

    if (algorithm === 'random') {
      return { swap: swaps[Math.floor(Math.random() * swaps.length)], score: 0 };
    }

    if (algorithm === 'greedy_weighted') {
      let bestSwap: ValidSwap | null = null;
      let bestScore = -1;
      for (const swap of swaps) {
        const result = quickSimulate(grid, swap.posA, swap.posB);
        const score = scoreMoveQuick(result, scorerState);
        if (score > bestScore) { bestScore = score; bestSwap = swap; }
      }
      return { swap: bestSwap, score: bestScore };
    }

    // greedy_cascade — full cascade simulation (Lv3)
    if (algorithm === 'greedy_cascade') {
      let bestSwap: ValidSwap | null = null;
      let bestScore = -1;
      for (const swap of swaps) {
        const simResult = simulateSwap(grid, swap.posA, swap.posB);
        const score = scoreMove(simResult, scorerState);
        if (score > bestScore) { bestScore = score; bestSwap = swap; }
      }
      return { swap: bestSwap, score: bestScore };
    }

    // mcts — Monte Carlo Tree Search (Lv4-5)
    const simCount = vipLevelRef.current >= 5 ? 80 : 30;
    const mctsResult = mctsSearch(grid, scorerState, simCount, locked);
    if (mctsResult) {
      return { swap: mctsResult.bestSwap, score: mctsResult.avgScore };
    }

    // Fallback: greedy cascade if MCTS returns null
    let bestSwap: ValidSwap | null = null;
    let bestScore = -1;
    for (const swap of swaps) {
      const simResult = simulateSwap(grid, swap.posA, swap.posB);
      const score = scoreMove(simResult, scorerState);
      if (score > bestScore) { bestScore = score; bestSwap = swap; }
    }
    return { swap: bestSwap, score: bestScore };
  }

  // ═══ MAIN TICK INTERVAL ═══
  useEffect(() => {
    if (!isActive) return;

    const tier = vipTiers[vipLevelRef.current];
    const intervalId = setInterval(() => {
      // --- STEP 1: GUARDS ---
      if (!isActiveRef.current) return;
      if (props.result.current !== 'fighting') {
        isActiveRef.current = false;
        setIsActive(false);
        return;
      }
      if (props.animatingRef.current) return;
      if (props.isPausedRef?.current) return;
      if (props.isStunnedRef?.current) return;

      const boss = props.bossRef.current;
      if (boss.bossHp <= 0 || boss.playerHp <= 0) {
        isActiveRef.current = false;
        setIsActive(false);
        return;
      }

      // --- STEP 2: BUILD STATE ---
      const scorerState = buildScorerState();
      const situation = selectSituation(scorerState);
      setCurrentSituation(situation);

      // --- STEP 3: SKILL CHECK (before gem swap) ---
      const skillState = buildSkillState();
      const decision = getSkillDecision(skillState);

      // Track situation always (for situationsEncountered)
      situationsRef.current.add(situation);

      if (decision !== null) {
        // Log skill action (Lv4-5 only)
        if (vipLevelRef.current >= 4) {
          const actionMap: Record<string, BattleLogTurn['action']> = {
            dodge: 'dodge', samDong: 'ult', otHiem: 'skill', romBoc: 'skill',
          };
          turnLogRef.current.push({
            turn: tickCount,
            situation,
            scoreBefore: lastScore,
            action: actionMap[decision.action] ?? 'skill',
          });
        }
        executeSkill(decision);
        setTickCount(prev => prev + 1);
        return; // Don't swap gems this tick
      }

      // --- STEP 4: MOVE SELECTION ---
      const algorithm = vipTiers[vipLevelRef.current].algorithm;
      const { swap: bestSwap, score } = findBestSwap(algorithm, scorerState);
      if (score > 0) setLastScore(score);

      // --- STEP 5: HIGHLIGHT + EXECUTE + TRACK ---
      if (bestSwap) {
        // Track gemsUsed from quick simulation
        const quickSim = quickSimulate(props.gridRef.current, bestSwap.posA, bestSwap.posB);
        if (quickSim.isValid) {
          const g = gemsUsedRef.current;
          g.atk += quickSim.gemCounts.atk;
          g.hp += quickSim.gemCounts.hp;
          g.def += quickSim.gemCounts.def;
          g.star += quickSim.gemCounts.star;

          // Log swap turn (Lv4-5 only — valuable ML data)
          if (vipLevelRef.current >= 4) {
            turnLogRef.current.push({
              turn: tickCount,
              situation,
              scoreBefore: lastScore,
              action: 'swap',
              gemType: dominantGemType(quickSim.gemCounts),
            });
          }
        }

        onHighlightRef.current?.(bestSwap.posA);

        const dir = swapDirection(bestSwap.posA, bestSwap.posB);
        setTimeout(() => {
          handleSwipeRef.current(bestSwap.posA, dir);
          onClearHighlightRef.current?.();
          setTickCount(prev => prev + 1);
        }, 250);
      }
    }, tier.tickMs);

    return () => clearInterval(intervalId);
  }, [isActive, vipLevel]);

  // ═══ getBattleLog — call on battle end to collect ML data ═══
  const getBattleLog = useCallback((): BattleLog => ({
    gemsUsed: { ...gemsUsedRef.current },
    situationsEncountered: Array.from(situationsRef.current),
    turns: vipLevelRef.current >= 4 ? [...turnLogRef.current] : undefined,
  }), []);

  // ═══ RETURN ═══
  const freeDodges = vipTiers[vipLevelRef.current]?.freeDodges ?? dodgeFreeDefault;

  return {
    isActive,
    toggle,
    setVipLevel,
    vipLevel,
    currentSituation,
    lastScore,
    dodgesUsed,
    dodgeFreeRemaining: Math.max(0, freeDodges - dodgesUsed),
    tickCount,
    gemsUsed: gemsUsedRef.current,
    ultsUsed: ultsUsedRef.current,
    getBattleLog,
  };
}
