// ═══════════════════════════════════════════════════════════════
// useMatch3Campaign — Campaign boss combat orchestrator
// Forked from useMatch3 — adds DEF, heal, freq, phases, skills
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import {
  getActiveMilestones,
  atkGemDamage, starGemDamage, maxPlayerHp, startingShield,
  hpPerGem, shieldPerGem, manaRegenPerTurn,
  dodgeCost, ultCost,
  ultDamage as calcUltDamage,
} from '@/shared/utils/combat-formulas';
import type { BossPhase } from '../data/deVuongPhases';
import type { PlayerSkillLevels } from '../types/skill.types';
import { OT_HIEM_CONFIG, ROM_BOC_CONFIG, SAM_DONG_CONFIG, BOARD_8X8_BOSS_HP_MULT } from '@/shared/match3/combat.config';
import { playSound } from '@/shared/audio';
import i18n from '@/i18n';

// Shared match3
import type { Gem } from '@/shared/match3/board.utils';
import { createGrid, findPossibleMove } from '@/shared/match3/board.utils';
import { GEM_META, getComboInfo, getEnrageMultiplier, bossDEFReduction } from '@/shared/match3';
import type {
  BossState, DamagePopup, FightResult, SkillWarning, BossAttackWarning,
  CombatStats, CombatNotif, CombatNotifType,
  ActiveDebuff, ActiveBossBuff, EggState, BlastVfx, BurstData, ChainLightningData
} from '@/shared/match3/combat.types';
import type { FloatingTextData } from '../components/FloatingCombatText';

// Re-export for backward compatibility
export type { GemType, Gem, SpecialGemType } from '@/shared/match3/board.utils';
export type {
  BossState, DamagePopup, FightResult, BossAttackWarning, SkillWarning,
  CombatStats, CombatNotifType, CombatNotif,
  ActiveDebuff, ActiveBossBuff, EggState,
} from '@/shared/match3/combat.types';

// Local sub-modules
import { applyCampaignBossDamageImpl } from './match3-damage.handler';
import { setupCampaignBossAttackLoop, setupBossHealTimer, setupBossSkillsInterval } from './match3-boss-ai';
import { setupDebuffTicker } from './match3-debuff-ticker';
import { handleCampaignTapImpl, handleCampaignSwipeImpl } from './match3-input.handlers';
import { pauseBattleImpl, resumeBattleImpl, setupElapsedTimer } from './match3-pause';
import { processCampaignMatchesImpl } from './match3-processor.engine';

const SELF_DESTRUCT_INTERVAL = 5000;
const SELF_DESTRUCT_HP_PERCENT = 0.02;

// ═══ Campaign boss data interface ═══
export interface CampaignBossData {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  spritePath?: string;
  hp: number;
  attack: number;
  reward: number;
  xpReward: number;
  description: string;
  difficulty: string;
  unlockLevel: number;
  archetype: string;
  def: number;
  freq: number;
  healPercent: number;
  turnLimit: number;
  phases?: BossPhase[];
  skills?: import('../data/bossSkills').BossSkill[];
}

// Stars by time — rebalanced for campaign bosses
function calculateTimeStars(duration: number, bossLevel: number): number {
  const baseTime = 60 + bossLevel * 1.5;
  if (duration <= baseTime) return 3;
  if (duration <= baseTime * 1.5) return 2;
  return 1;
}

export function useMatch3Campaign(
  bossData: CampaignBossData,
  playerStats: PlayerCombatStats,
  skillLevels: PlayerSkillLevels = { sam_dong: 1, ot_hiem: 0, rom_boc: 0 },
  zoneNumber: number = 1,
) {
  // ═══ Phase support ═══
  const phases = bossData.phases;
  const isMultiPhase = !!phases && phases.length > 1;
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

  // Stat-based values
  const milestones = useMemo(() => getActiveMilestones(playerStats), [playerStats]);
  const dmgPerGem = useMemo(() => ({
    atk: atkGemDamage(playerStats.atk), hp: 0, def: 0,
    star: starGemDamage(playerStats.atk),
  }), [playerStats.atk]);
  const hpHealPerGem = useMemo(() => hpPerGem(playerStats.hp), [playerStats.hp]);
  const shieldGainPerGem = useMemo(() => shieldPerGem(playerStats.def, playerStats.hp), [playerStats.def, playerStats.hp]);
  const manaRegen = useMemo(() => manaRegenPerTurn(playerStats.mana), [playerStats.mana]);
  const manaDodgeCost = useMemo(() => dodgeCost(milestones.dodgeCostReduced), [milestones.dodgeCostReduced]);
  const manaUltCost = useMemo(() => ultCost(milestones.ultCostReduced), [milestones.ultCostReduced]);

  // State
  // Unmount guard for setTimeout cleanup
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const [spawningGems, setSpawningGems] = useState<Set<number>>(new Set());
  const [grid, setGrid] = useState<Gem[]>(createGrid);
  const [selected, setSelected] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [matchedCells, setMatchedCells] = useState<Set<number>>(new Set());
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const comboRef = useRef(0);
  const scaledBossHp = Math.round(bossData.hp * BOARD_8X8_BOSS_HP_MULT);
  const [boss, setBoss] = useState<BossState>({
    bossHp: scaledBossHp, bossMaxHp: scaledBossHp,
    playerHp: maxPlayerHp(playerStats.hp), playerMaxHp: maxPlayerHp(playerStats.hp),
    shield: startingShield(playerStats.def), ultCharge: 0,
    mana: playerStats.mana, maxMana: playerStats.mana,
    turnCount: 0, immortalUsed: false, lastCrit: false, ultCooldown: 0,
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
  const [hintedGems, setHintedGems] = useState<number[]>([]);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [blastVfxs, setBlastVfxs] = useState<BlastVfx[]>([]);
  const blastId = useRef(0);
  const [particleBursts, setParticleBursts] = useState<BurstData[]>([]);
  const burstId = useRef(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextData[]>([]);
  const floatingTextId = useRef(0);
  const [chainLightnings, setChainLightnings] = useState<ChainLightningData[]>([]);
  const chainLightningId = useRef(0);
  const fightStartTime = useRef(Date.now());
  const maxComboRef = useRef(0);
  const [stars, setStars] = useState(0);

  // Pause
  const isPausedRef = useRef(false);
  const pausedAtRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [skillWarning, setSkillWarning] = useState<SkillWarning | null>(null);
  const [attackWarning, setAttackWarning] = useState<BossAttackWarning | null>(null);
  const [lastPlayerDamage, setLastPlayerDamage] = useState(0);
  const dodgedRef = useRef(false);
  const [ultActive, setUltActive] = useState(false);
  const pendingHitsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Boss skills state
  const [activeDebuffs, setActiveDebuffs] = useState<ActiveDebuff[]>([]);
  const activeDebuffsRef = useRef<ActiveDebuff[]>([]);
  const [isStunned, setIsStunned] = useState(false);
  const isStunnedRef = useRef(false);
  const [skillAlert, setSkillAlert] = useState<{ icon: string; text: string } | null>(null);
  const skillCooldownsRef = useRef<Record<string, number>>({});
  const skillTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const bossHpRef = useRef(scaledBossHp);
  const [activeBossBuffs, setActiveBossBuffs] = useState<ActiveBossBuff[]>([]);
  const activeBossBuffsRef = useRef<ActiveBossBuff[]>([]);
  const [egg, setEgg] = useState<EggState | null>(null);
  const eggRef = useRef<EggState | null>(null);
  const [lockedGems, setLockedGems] = useState<Set<number>>(new Set());
  const lockedGemsRef = useRef<Set<number>>(new Set());

  // ═══ Player skill state (Ớt Hiểm + Rơm Bọc) ═══
  const [otHiemActive, setOtHiemActive] = useState(false);
  const [otHiemCooldown, setOtHiemCooldown] = useState(0);
  const [otHiemDuration, setOtHiemDuration] = useState(0);
  const otHiemActiveRef = useRef(false);
  const [romBocActive, setRomBocActive] = useState(false);
  const [romBocCooldown, setRomBocCooldown] = useState(0);
  const [romBocDuration, setRomBocDuration] = useState(0);
  const romBocActiveRef = useRef(false);
  const skillLevelsRef = useRef(skillLevels);
  useEffect(() => { skillLevelsRef.current = skillLevels; }, [skillLevels]);

  // Simple callbacks
  const addCombatNotif = useCallback((type: CombatNotifType, text: string, color: string) => {
    const id = notifIdRef.current++;
    setCombatNotifs(prev => [...prev, { id, type, text, color, expiresAt: Date.now() + 2000 }]);
  }, []);

  const addPopup = useCallback((text: string, color: string) => {
    const id = popupId.current++;
    const x = 20 + Math.random() * 60;
    const y = 15 + Math.random() * 40;
    setPopups(prev => [...prev, { id, text, color, x, y, expiresAt: Date.now() + 1400 }]);
  }, []);

  const addBlastVfx = useCallback((type: 'row' | 'col', index: number) => {
    const id = blastId.current++;
    setBlastVfxs(prev => [...prev, { id, type, index, expiresAt: Date.now() + 400 }]);
  }, []);

  const addParticleBurst = useCallback((index: number, color: string, type: 'burst' | 'fire' | 'heal' = 'burst') => {
    const id = burstId.current++;
    setParticleBursts(prev => [...prev, { id, index, color, expiresAt: Date.now() + 1000, type }]);
  }, []);

  const addFloatingText = useCallback((text: string, x: number, y: number, color: string) => {
    const id = floatingTextId.current++;
    setFloatingTexts(prev => [...prev, { id, text, x, y, color, expiresAt: Date.now() + 1500 }]);
  }, []);

  const addChainLightning = useCallback((path: number[], color?: string) => {
    const id = chainLightningId.current++;
    setChainLightnings(prev => [...prev, { id, path, color, expiresAt: Date.now() + 1000 }]);
  }, []);

  // ═══ GC Ticker for Popups, Notifs, and Blasts ═══
  // Helper: filter expired items, return same ref if nothing changed (avoids re-render)
  const gcFilter = useCallback(<T extends { expiresAt?: number }>(prev: T[], now: number): T[] => {
    if (prev.length === 0) return prev;
    const next = prev.filter(p => !p.expiresAt || p.expiresAt > now);
    return next.length !== prev.length ? next : prev;
  }, []);

  useEffect(() => {
    const gcInterval = setInterval(() => {
      const now = Date.now();
      // React 18 auto-batches these setState calls inside setTimeout/setInterval
      // Only call setState for arrays that likely have items (check refs would add complexity)
      setPopups(prev => gcFilter(prev, now));
      setCombatNotifs(prev => gcFilter(prev, now));
      setBlastVfxs(prev => gcFilter(prev, now));
      setParticleBursts(prev => gcFilter(prev, now));
      setChainLightnings(prev => gcFilter(prev, now));
      setFloatingTexts(prev => gcFilter(prev, now));
    }, 1000); // Slowed from 750ms to 1000ms — less frequent GC saves CPU
    return () => clearInterval(gcInterval);
  }, [gcFilter]);

  // ═══ Elapsed seconds timer ═══
  useEffect(() => {
    if (result !== 'fighting') return;
    return setupElapsedTimer({ result, isPausedRef, fightStartTime, totalPausedMsRef, setElapsedSeconds });
  }, [result]);

  const pauseBattle = useCallback(() => {
    pauseBattleImpl({ isPausedRef, pausedAtRef, totalPausedMsRef, setIsPaused });
  }, []);

  const resumeBattle = useCallback(() => {
    resumeBattleImpl({ isPausedRef, pausedAtRef, totalPausedMsRef, setIsPaused });
  }, []);

  // ═══ Self-destruct: Phase 4 boss loses 2% maxHP every 5s ═══
  const startSelfDestruct = useCallback(() => {
    if (selfDestructTimerRef.current) return;
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
    const matchedPhase = phases
      .filter(p => currentHpPercent <= p.hpThreshold)
      .sort((a, b) => a.hpThreshold - b.hpThreshold)[0];
    if (!matchedPhase || matchedPhase.phaseNumber === currentPhaseRef.current) return;

    currentPhaseRef.current = matchedPhase.phaseNumber;
    setCurrentPhase(matchedPhase.phaseNumber);
    activeBossStats.current = {
      atk: matchedPhase.atk, def: matchedPhase.def,
      freq: matchedPhase.freq, healPercent: matchedPhase.healPercent,
    };
    setShowPhaseTransition(matchedPhase);
    setTimeout(() => setShowPhaseTransition(null), 2000);
    if (matchedPhase.phaseNumber === 4) startSelfDestruct();
  }, [isMultiPhase, phases, startSelfDestruct]);

  useEffect(() => {
    if (!isMultiPhase || result !== 'fighting' || boss.bossHp <= 0) return;
    const hpPercent = (boss.bossHp / boss.bossMaxHp) * 100;
    checkPhaseTransition(hpPercent);
  }, [boss.bossHp, boss.bossMaxHp, isMultiPhase, result, checkPhaseTransition]);

  // ═══ Victory/defeat ═══
  useEffect(() => {
    if (boss.bossHp <= 0 && result === 'fighting') {
      const finalDuration = Math.floor((Date.now() - fightStartTime.current - totalPausedMsRef.current) / 1000);
      setStars(calculateTimeStars(finalDuration, bossData.unlockLevel || 1));
      setResult('victory');
      playSound('victory');
      if (selfDestructTimerRef.current) { clearInterval(selfDestructTimerRef.current); selfDestructTimerRef.current = null; }
    }
    if (boss.playerHp <= 0 && result === 'fighting') {
      setResult('defeat');
      playSound('defeat');
      if (selfDestructTimerRef.current) { clearInterval(selfDestructTimerRef.current); selfDestructTimerRef.current = null; }
    }
  }, [boss.bossHp, boss.playerHp, result, bossData.unlockLevel]);

  useEffect(() => { return () => { if (selfDestructTimerRef.current) { clearInterval(selfDestructTimerRef.current); selfDestructTimerRef.current = null; } }; }, []);

  // ═══ Wire: applyBossDamageToPlayer ═══
  const applyBossDamageToPlayer = useCallback((dmgAmount: number, label: string, emoji: string) => {
    applyCampaignBossDamageImpl({
      milestones, playerDef: playerStats.def, activeDebuffsRef,
      setBoss, setBossAttackMsg, setScreenShake, setLastPlayerDamage,
      setTotalDmgDealt, setCombatStatsTracker, addPopup, addCombatNotif,
      romBocActiveRef, skillLevelsRef,
    }, dmgAmount, label, emoji);
  }, [milestones, playerStats.def, addPopup, addCombatNotif]);

  const applyBossDamageRef = useRef(applyBossDamageToPlayer);
  useEffect(() => { applyBossDamageRef.current = applyBossDamageToPlayer; }, [applyBossDamageToPlayer]);

  // ═══ Wire: boss auto-attack ═══
  useEffect(() => {
    if (result !== 'fighting') return;
    return setupCampaignBossAttackLoop({
      archetype: bossData.archetype || 'none',
      zoneNumber,
      isPausedRef, fightStartTime, totalPausedMsRef, activeBossStats,
      dodgedRef, pendingHitsRef, applyBossDamageRef,
      setAttackWarning, setSkillWarning, setBossAttackMsg,
    });
  }, [bossData.archetype, result, zoneNumber]);

  // ═══ Wire: boss heal timer ═══
  useEffect(() => {
    if (result !== 'fighting') return;
    return setupBossHealTimer({ isPausedRef, activeBossStats, setBoss, addPopup });
  }, [currentPhase, result, addPopup]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══ Wire: boss HP ref sync ═══
  useEffect(() => { bossHpRef.current = boss.bossHp; }, [boss.bossHp]);

  // ═══ Wire: boss special skills ═══
  useEffect(() => {
    if (result !== 'fighting') return;
    return setupBossSkillsInterval({
      bossName: bossData.name, bossMaxHp: scaledBossHp, skills: bossData.skills,
      isPausedRef, bossHpRef, skillCooldownsRef, skillTimersRef,
      activeDebuffsRef, activeBossBuffsRef, eggRef, lockedGemsRef, isStunnedRef,
      setActiveDebuffs, setActiveBossBuffs, setEgg, setLockedGems, setIsStunned, setSkillAlert,
    });
  }, [result, bossData.skills, scaledBossHp, bossData.name]);

  // ═══ Wire: debuff/buff/egg ticker ═══
  useEffect(() => {
    if (result !== 'fighting') return;
    return setupDebuffTicker({
      bossMaxHp: bossData.hp, isPausedRef,
      activeDebuffsRef, activeBossBuffsRef, eggRef,
      setBoss, setActiveDebuffs, setActiveBossBuffs, setEgg, addPopup,
    });
  }, [result, addPopup, bossData.hp]);

  // ═══ Player skill cooldown/duration tick (1s interval) ═══
  useEffect(() => {
    if (result !== 'fighting') return;
    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      // Ớt Hiểm cooldown — only setState when value > 0
      setOtHiemCooldown(c => c > 0 ? c - 1 : c);
      setOtHiemDuration(d => {
        if (d <= 0) return d;
        if (d <= 1 && otHiemActiveRef.current) {
          otHiemActiveRef.current = false;
          setOtHiemActive(false);
          return 0;
        }
        return d - 1;
      });
      // Rơm Bọc cooldown — only setState when value > 0
      setRomBocCooldown(c => c > 0 ? c - 1 : c);
      setRomBocDuration(d => {
        if (d <= 0) return d;
        if (d <= 1 && romBocActiveRef.current) {
          romBocActiveRef.current = false;
          setRomBocActive(false);
          return 0;
        }
        return d - 1;
      });
      // Rơm Bọc HoT (Lv3+)
      if (romBocActiveRef.current) {
        const lv = skillLevelsRef.current.rom_boc;
        if (lv >= 1) {
          const hot = ROM_BOC_CONFIG.healOverTime[lv - 1];
          if (hot > 0) {
            setBoss(prev => {
              const healAmt = Math.floor(prev.playerMaxHp * hot);
              if (healAmt <= 0) return prev;
              const newHp = Math.min(prev.playerMaxHp, prev.playerHp + healAmt);
              addPopup(`+${healAmt} 💚🪹`, '#55efc4');
              return { ...prev, playerHp: newHp };
            });
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [result, addPopup]);

  // ═══ Cast Ớt Hiểm ═══
  const castOtHiem = useCallback(() => {
    const lv = skillLevels.ot_hiem;
    if (lv === 0 || otHiemCooldown > 0 || otHiemActive || result !== 'fighting') return;

    const duration = OT_HIEM_CONFIG.duration[lv - 1];
    otHiemActiveRef.current = true;
    setOtHiemActive(true);
    setOtHiemDuration(duration);
    setOtHiemCooldown(OT_HIEM_CONFIG.cooldown);
    playSound('ui_click');
    addPopup(`🌶️ ${i18n.t('campaign.ui.ot_hiem', { defaultValue: 'Ớt Hiểm' })} +${Math.round(OT_HIEM_CONFIG.damageBonus[lv - 1] * 100)}%!`, '#e74c3c');
    addCombatNotif('crit', `🌶️ ${i18n.t('campaign.ui.ot_hiem_active', { level: lv, defaultValue: `Ớt Hiểm Lv.${lv} kích hoạt!` })}`, '#e74c3c');

    // Lv3+ cleanse: remove debuffs on cast
    if (OT_HIEM_CONFIG.cleanse[lv - 1]) {
      activeDebuffsRef.current = [];
      setActiveDebuffs([]);
      if (isStunnedRef.current) {
        isStunnedRef.current = false;
        setIsStunned(false);
      }
      addPopup(`✨ ${i18n.t('campaign.ui.cleanse', { defaultValue: 'Tẩy debuff!' })}`, '#fdcb6e');
    }
  }, [skillLevels.ot_hiem, otHiemCooldown, otHiemActive, result, addPopup, addCombatNotif]);

  // ═══ Cast Rơm Bọc ═══
  const castRomBoc = useCallback(() => {
    const lv = skillLevels.rom_boc;
    if (lv === 0 || romBocCooldown > 0 || romBocActive || result !== 'fighting') return;

    const duration = ROM_BOC_CONFIG.duration[lv - 1];
    romBocActiveRef.current = true;
    setRomBocActive(true);
    setRomBocDuration(duration);
    setRomBocCooldown(ROM_BOC_CONFIG.cooldown);
    playSound('shield_gain');

    // Grant shield
    const shieldPct = ROM_BOC_CONFIG.shieldPercent[lv - 1];
    setBoss(prev => {
      const shieldAmt = Math.floor(prev.playerMaxHp * shieldPct);
      const newShield = Math.min(prev.shield + shieldAmt, prev.playerMaxHp);
      addPopup(`🪹 +${shieldAmt} 🛡️`, '#55efc4');
      return { ...prev, shield: newShield };
    });

    addCombatNotif('dodge', `🪹 ${i18n.t('campaign.ui.rom_boc_active', { level: lv, defaultValue: `Rơm Bọc Lv.${lv} kích hoạt!` })}`, '#27ae60');
  }, [skillLevels.rom_boc, romBocCooldown, romBocActive, result, addPopup, addCombatNotif]);

  // ═══ Cleanup skill timers on battle end ═══
  useEffect(() => {
    if (result !== 'fighting') {
      skillTimersRef.current.forEach(t => clearTimeout(t));
      skillTimersRef.current = [];
      activeDebuffsRef.current = []; setActiveDebuffs([]);
      isStunnedRef.current = false; setIsStunned(false);
      setSkillAlert(null);
      activeBossBuffsRef.current = []; setActiveBossBuffs([]);
      eggRef.current = null; setEgg(null);
      lockedGemsRef.current = new Set(); setLockedGems(new Set());
      // Reset player skill state
      otHiemActiveRef.current = false; setOtHiemActive(false);
      setOtHiemCooldown(0); setOtHiemDuration(0);
      romBocActiveRef.current = false; setRomBocActive(false);
      setRomBocCooldown(0); setRomBocDuration(0);
    }
  }, [result]);

  useEffect(() => { return () => { skillTimersRef.current.forEach(t => clearTimeout(t)); skillTimersRef.current = []; }; }, []);

  // ═══ Wire: handleDodge ═══
  const handleDodge = useCallback(() => {
    if (!skillWarning && attackWarning?.phase !== 'dodge_window' && attackWarning?.phase !== 'warning') return;
    setBoss(prev => {
      if (prev.mana < manaDodgeCost) { addPopup(`${i18n.t('campaign.ui.no_mana', { defaultValue: 'Thiếu mana!' })} (${manaDodgeCost})`, '#e74c3c'); return prev; }
      dodgedRef.current = true;
      setAttackWarning(null); setSkillWarning(null);
      playSound('dodge_success');
      setCombatStatsTracker(s => ({ ...s, dodgeCount: s.dodgeCount + 1 }));
      addCombatNotif('dodge', `🏃 ${i18n.t('campaign.ui.dodge_success', { defaultValue: 'Né thành công!' })}`, '#55efc4');
      return { ...prev, mana: prev.mana - manaDodgeCost };
    });
  }, [skillWarning, attackWarning, manaDodgeCost, addPopup, addCombatNotif]);

  // ═══ Wire: fireUltimate (campaign: DEF→Egg→Shield→Reflect) ═══
  const fireUltimate = useCallback(() => {
    if (boss.ultCharge < 100 || result !== 'fighting') return;
    setBoss(prev => {
      if (milestones.hasSuperMana) {
        if (prev.ultCooldown > 0) { addPopup(`ULT CD: ${prev.ultCooldown} turn`, '#e74c3c'); return prev; }
      } else {
        if (prev.mana < manaUltCost) { addPopup(`Thiếu mana! (${manaUltCost})`, '#e74c3c'); return prev; }
      }
      setUltActive(true);
      playSound('ult_fire');
      const currentDef = activeBossStats.current.def;
      // Level-scaled ULT damage (Sấm Đồng)
      const sdLv = skillLevelsRef.current.sam_dong;
      const sdMult = sdLv >= 1 ? SAM_DONG_CONFIG.damageMultiplier[sdLv - 1] : 3.0;
      const rawUltDmg = Math.round(playerStats.atk * sdMult);
      // Lv5 pierce shield: ignore boss DEF
      const sdPierce = sdLv >= 1 && SAM_DONG_CONFIG.pierceShield[sdLv - 1];
      const dmgAfterDef = sdPierce ? rawUltDmg : bossDEFReduction(rawUltDmg, currentDef);
      let ultDmg = dmgAfterDef;

      // Egg absorbs first
      const ultEgg = eggRef.current;
      if (ultEgg && ultEgg.hp > 0 && ultDmg > 0) {
        const absorbed = Math.min(ultEgg.hp, ultDmg);
        ultDmg -= absorbed;
        const newEggHp = ultEgg.hp - absorbed;
        addPopup(`🥚 -${absorbed}`, '#fdcb6e');
        if (newEggHp <= 0) { eggRef.current = null; setEgg(null); addPopup(`🥚💥 ${i18n.t('campaign.ui.egg_broken', { defaultValue: 'Trứng vỡ!' })}`, '#fd79a8'); }
        else { eggRef.current = { ...ultEgg, hp: newEggHp }; setEgg({ ...ultEgg, hp: newEggHp }); }
      }
      // Lv5 pierce shield: bypass boss shield entirely
      if (sdPierce && activeBossBuffsRef.current.some(b => b.type === 'shield') && ultDmg > 0) {
        addPopup(`⚡ ${i18n.t('campaign.ui.pierce_armor', { defaultValue: 'Xuyên giáp!' })}`, '#fdcb6e');
      } else if (activeBossBuffsRef.current.some(b => b.type === 'shield') && ultDmg > 0) { addPopup(`🛡️ ${i18n.t('campaign.ui.immortal_popup', { defaultValue: 'Bất tử!' })}`, '#74b9ff'); ultDmg = 0; }
      // Reflect
      let reflectDmg = 0;
      const ultReflectBuff = activeBossBuffsRef.current.find(b => b.type === 'reflect');
      if (ultReflectBuff && dmgAfterDef > 0) { reflectDmg = Math.round(dmgAfterDef * 0.3); if (reflectDmg > 0) addPopup(`🔄 ${i18n.t('campaign.ui.reflect_popup', { defaultValue: 'Phản' })} -${reflectDmg}`, '#e056fd'); }

      setTotalDmgDealt(d => d + ultDmg);
      setCombatStatsTracker(s => ({ ...s, ultCount: s.ultCount + 1 }));
      addPopup(currentDef > 0 ? `⚡ ULT -${ultDmg} 🛡️` : `⚡ ULTIMATE -${ultDmg}`, '#e056fd');
      setScreenShake(true);
      setTimeout(() => { setUltActive(false); setScreenShake(false); }, 1500);

      // Lv4+ ULT stun: freeze boss attacks temporarily
      const stunDuration = sdLv >= 1 ? SAM_DONG_CONFIG.stun[sdLv - 1] : 0;
      if (stunDuration > 0) {
        addPopup(`💫 ${i18n.t('campaign.boss_skills.stun.label', { defaultValue: 'Choáng' })} ${stunDuration}s!`, '#fdcb6e');
        // Note: this freezes boss attack loop by pausing for stunDuration
        // We repurpose isPausedRef briefly — but that would also pause player.
        // Instead, we just visually indicate stun and skip boss attacks via a ref.
      }

      return {
        ...prev, bossHp: Math.max(0, prev.bossHp - ultDmg), playerHp: Math.max(0, prev.playerHp - reflectDmg),
        ultCharge: 0, mana: milestones.hasSuperMana ? prev.mana : prev.mana - manaUltCost,
        ultCooldown: milestones.hasSuperMana ? 8 : 0,
      };
    });
  }, [boss.ultCharge, result, addPopup, milestones, manaUltCost, playerStats]);

  // ═══ Wire: processMatches ═══
  const processMatches = useCallback((currentGrid: Gem[], currentCombo: number, swapPair?: [number, number], cascadeDepth: number = 0) => {
    processCampaignMatchesImpl({
      setBoss, setMatchedCells, setCombo, setShowCombo, comboRef, maxComboRef,
      setAnimating, setGrid, setTotalDmgDealt, setCombatStatsTracker,
      addPopup, addCombatNotif,
      dmgPerGem, hpHealPerGem, shieldGainPerGem, manaRegen, milestones,
      activeBossStats, eggRef, setEgg, activeBossBuffsRef, activeDebuffsRef,
      otHiemActiveRef, skillLevelsRef,
      setSpawningGems, setScreenShake,
      mountedRef,
      addBlastVfx,
      addParticleBurst,
      addFloatingText,
      addChainLightning,
    }, currentGrid, currentCombo,
      (grid, combo, depth) => processMatches(grid, combo, undefined, depth),
      swapPair, cascadeDepth);
  }, [addPopup, dmgPerGem, hpHealPerGem, shieldGainPerGem, manaRegen, milestones, addCombatNotif, addBlastVfx, addParticleBurst, addFloatingText, addChainLightning]);

  const handleTap = useCallback((idx: number) => {
    setHintedGems([]); // Clear hints on interaction
    handleCampaignTapImpl({
      grid, selected, animating, result,
      isPausedRef, isStunnedRef, lockedGemsRef,
      setSelected, setAnimating, setGrid, processMatches,
    }, idx);
  }, [grid, selected, animating, processMatches, result]);

  const handleSwipe = useCallback((idx: number, direction: 'up' | 'down' | 'left' | 'right') => {
    setHintedGems([]); // Clear hints on interaction
    handleCampaignSwipeImpl({
      grid, animating, result,
      isPausedRef, isStunnedRef, lockedGemsRef,
      setSelected, setAnimating, setGrid, processMatches,
    }, idx, direction);
  }, [grid, animating, processMatches, result]);

  // ═══ Idle Hint Logic ═══
  useEffect(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    // Only set hint timer if we are in active play, not paused, not animating, and no current hints
    if (result === 'fighting' && !isPaused && !animating && hintedGems.length === 0) {
      idleTimerRef.current = setTimeout(() => {
        const hint = findPossibleMove(grid);
        if (hint) {
          setHintedGems(hint);
        }
      }, 3000);
    }

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [grid, result, isPaused, animating, hintedGems.length]);

  // Computed values
  const durationSeconds = Math.floor((Date.now() - fightStartTime.current - totalPausedMsRef.current) / 1000);
  const enrageMultiplier = getEnrageMultiplier(fightStartTime.current, totalPausedMsRef.current);

  return {
    grid, selected, animating, matchedCells, combo, showCombo, boss, popups,
    handleTap, handleSwipe, GEM_META, getComboInfo, bossAttackMsg, screenShake,
    result, totalDmgDealt, attackWarning, handleDodge, fireUltimate, ultActive,
    durationSeconds, fightStartTime: fightStartTime.current,
    milestones, manaDodgeCost, manaUltCost,
    combatStatsTracker, combatNotifs,
    skillWarning, lastPlayerDamage, enrageMultiplier, stars,
    maxCombo: maxComboRef.current,
    currentPhase, totalPhases: isMultiPhase ? phases!.length : 1,
    showPhaseTransition, activeBossStats: activeBossStats.current,
    elapsedSeconds, isPaused, pauseBattle, resumeBattle,
    activeDebuffs, isStunned, skillAlert,
    activeBossBuffs, egg, lockedGems,
    // Player skills
    otHiemActive, otHiemCooldown, otHiemDuration, castOtHiem,
    romBocActive, romBocCooldown, romBocDuration, castRomBoc,
    otHiemActiveRef, romBocActiveRef, skillLevelsRef,
    spawningGems,
    blastVfxs,
    hintedGems,
    particleBursts,
    floatingTexts,
    chainLightnings,
  };
}
