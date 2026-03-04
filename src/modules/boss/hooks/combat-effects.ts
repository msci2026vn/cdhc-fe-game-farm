// ═══════════════════════════════════════════════════════════════
// Combat effects — handleDodge, fireUltimate
// ═══════════════════════════════════════════════════════════════

import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type { PlayerCombatStats, ActiveMilestones } from '@/shared/utils/combat-formulas';
import { ultDamage as calcUltDamage } from '@/shared/utils/combat-formulas';
import type { BossState, CombatStats, CombatNotifType, SkillWarning, BossAttackWarning } from '@/shared/match3/combat.types';
import { playSound } from '@/shared/audio';

export interface DodgeDeps {
  skillWarning: SkillWarning | null;
  attackWarning: BossAttackWarning | null;
  manaDodgeCost: number;
  setBoss: Dispatch<SetStateAction<BossState>>;
  dodgedRef: MutableRefObject<boolean>;
  setAttackWarning: (w: BossAttackWarning | null) => void;
  setSkillWarning: (w: SkillWarning | null) => void;
  setCombatStatsTracker: Dispatch<SetStateAction<CombatStats>>;
  addPopup: (text: string, color: string) => void;
  addCombatNotif: (type: CombatNotifType, text: string, color: string) => void;
}

export function handleDodgeImpl(deps: DodgeDeps): void {
  const {
    skillWarning, attackWarning, manaDodgeCost,
    setBoss, dodgedRef, setAttackWarning, setSkillWarning,
    setCombatStatsTracker, addPopup, addCombatNotif,
  } = deps;

  // Can only dodge when there's an active skill warning
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
    playSound('dodge_success');
    return { ...prev, mana: prev.mana - manaDodgeCost };
  });
}

export interface UltimateDeps {
  ultCharge: number;
  result: string;
  milestones: ActiveMilestones;
  manaUltCost: number;
  playerStats: PlayerCombatStats;
  setBoss: Dispatch<SetStateAction<BossState>>;
  setUltActive: (v: boolean) => void;
  setTotalDmgDealt: Dispatch<SetStateAction<number>>;
  setCombatStatsTracker: Dispatch<SetStateAction<CombatStats>>;
  setScreenShake: (v: boolean) => void;
  addPopup: (text: string, color: string) => void;
}

export function fireUltimateImpl(deps: UltimateDeps): void {
  const {
    ultCharge, result, milestones, manaUltCost, playerStats,
    setBoss, setUltActive, setTotalDmgDealt, setCombatStatsTracker,
    setScreenShake, addPopup,
  } = deps;

  if (ultCharge < 100 || result !== 'fighting') return;

  setBoss(prev => {
    // SuperMana: free ULT with cooldown
    if (milestones.hasSuperMana) {
      if (prev.ultCooldown > 0) {
        addPopup(`ULT CD: ${prev.ultCooldown} turn`, '#e74c3c');
        return prev;
      }
    } else {
      // Normal: check mana cost
      if (prev.mana < manaUltCost) {
        addPopup(`Thiếu mana! (${manaUltCost})`, '#e74c3c');
        return prev;
      }
    }

    setUltActive(true);
    playSound('ult_fire');
    const ultDmg = calcUltDamage(playerStats.atk, playerStats.mana);
    setTotalDmgDealt(d => d + ultDmg);
    setCombatStatsTracker(s => ({ ...s, ultCount: s.ultCount + 1 }));
    addPopup(`⚡ ULTIMATE -${ultDmg}`, '#e056fd');
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
}
