import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { BossInfo } from '../data/bosses';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import {
  getActiveMilestones,
  atkGemDamage, starGemDamage, maxPlayerHp, startingShield,
  hpPerGem, shieldPerGem, manaRegenPerTurn,
  dodgeCost, ultCost,
} from '@/shared/utils/combat-formulas';
import { playSound } from '@/shared/audio';

// Shared match3
import type { Gem } from '@/shared/match3/board.utils';
import { createGrid } from '@/shared/match3/board.utils';
import { GEM_META, getComboInfo, getEnrageMultiplier } from '@/shared/match3';
import type {
  BossState, DamagePopup, FightResult, SkillWarning, BossAttackWarning,
  CombatStats, CombatNotif, CombatNotifType,
} from '@/shared/match3/combat.types';

// Re-export for backward compatibility
export type { GemType, Gem } from '@/shared/match3/board.utils';
export type {
  BossState, DamagePopup, FightResult, BossAttackWarning, SkillWarning,
  CombatStats, CombatNotifType, CombatNotif,
} from '@/shared/match3/combat.types';

// Local sub-modules
import { applyBossDamageImpl } from './boss-damage.handler';
import { processMatchesImpl } from './match-processor.engine';
import { setupBossAttackLoop } from './boss-attack.loop';
import { handleTapImpl, handleSwipeImpl } from './input-handlers';
import { handleDodgeImpl, fireUltimateImpl } from './combat-effects';

// Stars by time (boss-weekly specific formula)
function calculateTimeStars(duration: number, bossLevel: number): number {
  const baseTime = 45 + bossLevel * 0.5;
  if (duration <= baseTime) return 3;
  if (duration <= baseTime * 1.5) return 2;
  return 1;
}

export function useMatch3(bossInfo: BossInfo, playerStats: PlayerCombatStats, turnLimit = 0) {
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

  // State
  const [grid, setGrid] = useState<Gem[]>(createGrid);
  const [selected, setSelected] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [matchedCells, setMatchedCells] = useState<Set<number>>(new Set());
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const comboRef = useRef(0);
  const [boss, setBoss] = useState<BossState>({
    bossHp: bossInfo.hp, bossMaxHp: bossInfo.hp,
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
  const fightStartTime = useRef(Date.now());
  const maxComboRef = useRef(0);
  const [stars, setStars] = useState(0);
  const [skillWarning, setSkillWarning] = useState<SkillWarning | null>(null);
  const [attackWarning, setAttackWarning] = useState<BossAttackWarning | null>(null);
  const dodgedRef = useRef(false);
  const [ultActive, setUltActive] = useState(false);

  // Simple callbacks
  const addCombatNotif = useCallback((type: CombatNotifType, text: string, color: string) => {
    const id = notifIdRef.current++;
    setCombatNotifs(prev => [...prev, { id, type, text, color }]);
    setTimeout(() => setCombatNotifs(prev => prev.filter(n => n.id !== id)), 2000);
  }, []);

  const addPopup = useCallback((text: string, color: string) => {
    const id = popupId.current++;
    const x = 20 + Math.random() * 60;
    const y = 15 + Math.random() * 40;
    setPopups(prev => [...prev, { id, text, color, x, y }]);
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1400);
  }, []);

  // Check victory/defeat — compute stars on victory
  useEffect(() => {
    if (boss.bossHp <= 0 && result === 'fighting') {
      const finalDuration = Math.floor((Date.now() - fightStartTime.current) / 1000);
      const bossLevel = bossInfo.unlockLevel || 1;
      setStars(calculateTimeStars(finalDuration, bossLevel));
      setResult('victory');
      playSound('victory');
    }
    if (boss.playerHp <= 0 && result === 'fighting') { setResult('defeat'); playSound('defeat'); }
    if (turnLimit > 0 && boss.turnCount >= turnLimit && result === 'fighting' && boss.bossHp > 0) { setResult('defeat'); playSound('defeat'); }
  }, [boss.bossHp, boss.playerHp, boss.turnCount, turnLimit, result, bossInfo.unlockLevel]);

  // Wire: applyBossDamageToPlayer
  const applyBossDamageToPlayer = useCallback((dmgAmount: number, label: string, emoji: string) => {
    applyBossDamageImpl({
      milestones, playerDef: playerStats.def,
      setBoss, setBossAttackMsg, setScreenShake,
      setTotalDmgDealt, setCombatStatsTracker,
      addPopup, addCombatNotif,
    }, dmgAmount, label, emoji);
  }, [milestones, playerStats.def, addPopup, addCombatNotif]);

  // Wire: boss auto-attack
  useEffect(() => {
    if (result !== 'fighting') return;
    return setupBossAttackLoop({
      bossAttack: bossInfo.attack, archetype: bossInfo.archetype || 'none',
      fightStartTime, dodgedRef,
      setAttackWarning, setSkillWarning, setBossAttackMsg,
      applyBossDamageToPlayer,
    });
  }, [bossInfo.attack, bossInfo.archetype, result, applyBossDamageToPlayer]);

  // Wire: processMatches
  const processMatches = useCallback((currentGrid: Gem[], currentCombo: number) => {
    processMatchesImpl({
      setBoss, setMatchedCells, setCombo, setShowCombo, comboRef, maxComboRef,
      setAnimating, setGrid, setTotalDmgDealt, setCombatStatsTracker,
      addPopup, addCombatNotif,
      dmgPerGem, hpHealPerGem, shieldGainPerGem, manaRegen, milestones,
    }, currentGrid, currentCombo, processMatches);
  }, [addPopup, dmgPerGem, hpHealPerGem, shieldGainPerGem, manaRegen, milestones, addCombatNotif]);

  // Wire: handleDodge
  const handleDodge = useCallback(() => {
    handleDodgeImpl({
      skillWarning, attackWarning, manaDodgeCost,
      setBoss, dodgedRef, setAttackWarning, setSkillWarning,
      setCombatStatsTracker, addPopup, addCombatNotif,
    });
  }, [skillWarning, attackWarning, manaDodgeCost, addPopup, addCombatNotif]);

  // Wire: fireUltimate
  const fireUltimate = useCallback(() => {
    fireUltimateImpl({
      ultCharge: boss.ultCharge, result, milestones, manaUltCost, playerStats,
      setBoss, setUltActive, setTotalDmgDealt, setCombatStatsTracker,
      setScreenShake, addPopup,
    });
  }, [boss.ultCharge, result, addPopup, milestones, manaUltCost, playerStats]);

  // Wire: handleTap
  const handleTap = useCallback((idx: number) => {
    handleTapImpl({
      grid, selected, animating, result,
      setSelected, setAnimating, setGrid, processMatches,
    }, idx);
  }, [grid, selected, animating, processMatches, result]);

  // Wire: handleSwipe
  const handleSwipe = useCallback((idx: number, direction: 'up' | 'down' | 'left' | 'right') => {
    handleSwipeImpl({
      grid, animating, result,
      setSelected, setAnimating, setGrid, processMatches,
    }, idx, direction);
  }, [grid, animating, processMatches, result]);

  // Computed values
  const durationSeconds = Math.floor((Date.now() - fightStartTime.current) / 1000);
  const enrageMultiplier = getEnrageMultiplier(fightStartTime.current);

  return {
    grid, selected, animating, matchedCells, combo, showCombo, boss, popups,
    handleTap, handleSwipe, GEM_META, getComboInfo, bossAttackMsg, screenShake,
    result, totalDmgDealt, attackWarning, handleDodge, fireUltimate, ultActive,
    durationSeconds, fightStartTime: fightStartTime.current,
    milestones, manaDodgeCost, manaUltCost,
    combatStatsTracker, combatNotifs,
    skillWarning,
    enrageMultiplier,
    stars,
    maxCombo: maxComboRef.current,
  };
}
