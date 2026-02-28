// ═══════════════════════════════════════════════════════════════
// Campaign damage handler — applies boss damage to player
// Fort → armor_break check → DEF → Shield → Immortal → Reflect
// ═══════════════════════════════════════════════════════════════

import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import { actualBossDamage } from '@/shared/utils/combat-formulas';
import type { ActiveMilestones } from '@/shared/utils/combat-formulas';
import type { BossState, CombatStats, CombatNotifType, ActiveDebuff } from '@/shared/match3/combat.types';
import { ROM_BOC_CONFIG } from '@/shared/match3/combat.config';
import type { PlayerSkillLevels } from '../types/skill.types';

export interface CampaignDamageDeps {
  milestones: ActiveMilestones;
  playerDef: number;
  activeDebuffsRef: MutableRefObject<ActiveDebuff[]>;
  setBoss: Dispatch<SetStateAction<BossState>>;
  setBossAttackMsg: (msg: { text: string; emoji: string } | null) => void;
  setScreenShake: (v: boolean) => void;
  setLastPlayerDamage: (v: number) => void;
  setTotalDmgDealt: Dispatch<SetStateAction<number>>;
  setCombatStatsTracker: Dispatch<SetStateAction<CombatStats>>;
  addPopup: (text: string, color: string) => void;
  addCombatNotif: (type: CombatNotifType, text: string, color: string) => void;
  // Player skill refs
  romBocActiveRef: MutableRefObject<boolean>;
  skillLevelsRef: MutableRefObject<PlayerSkillLevels>;
}

export function applyCampaignBossDamageImpl(
  deps: CampaignDamageDeps,
  dmgAmount: number,
  label: string,
  emoji: string,
): void {
  const {
    milestones, playerDef, activeDebuffsRef,
    setBoss, setBossAttackMsg, setScreenShake, setLastPlayerDamage,
    setTotalDmgDealt, setCombatStatsTracker, addPopup, addCombatNotif,
    romBocActiveRef, skillLevelsRef,
  } = deps;

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

    // Apply player DEF damage reduction (armor_break → DEF 0)
    const isArmorBroken = activeDebuffsRef.current.some(d => d.type === 'armor_break');
    let reducedDmg = actualBossDamage(dmgAmount, isArmorBroken ? 0 : playerDef);

    // Rơm Bọc: damage reduction + Lv5 debuff immunity
    if (romBocActiveRef.current) {
      const rbLv = skillLevelsRef.current.rom_boc;
      if (rbLv >= 1) {
        const dr = ROM_BOC_CONFIG.damageReduction[rbLv - 1];
        reducedDmg = Math.floor(reducedDmg * (1 - dr));
        // Lv4+ reflect damage back to boss
        const reflectPct = ROM_BOC_CONFIG.reflect[rbLv - 1];
        if (reflectPct > 0) {
          const reflectCap = Math.floor(prev.playerMaxHp * 0.10);
          const reflectDmg = Math.min(Math.floor(dmgAmount * reflectPct), reflectCap);
          if (reflectDmg > 0) {
            setTotalDmgDealt(d => d + reflectDmg);
            addPopup(`🪹🔄 -${reflectDmg}`, '#55efc4');
          }
          // Apply reflect damage to boss in the same setBoss call below
        }
      }
    }

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

    // Rơm Bọc reflect: Lv4+ reflect damage to boss
    let newBossHp = prev.bossHp;
    if (romBocActiveRef.current) {
      const rbLv = skillLevelsRef.current.rom_boc;
      if (rbLv >= 1) {
        const reflectPct = ROM_BOC_CONFIG.reflect[rbLv - 1];
        if (reflectPct > 0) {
          const reflectCap = Math.floor(prev.playerMaxHp * 0.10);
          const reflectDmg = Math.min(Math.floor(dmgAmount * reflectPct), reflectCap);
          if (reflectDmg > 0) {
            newBossHp = Math.max(0, newBossHp - reflectDmg);
          }
        }
      }
    }

    // Reflect milestone
    if (milestones.reflectPercent > 0 && reducedDmg > 0) {
      const reflectDmg = Math.floor(reducedDmg * milestones.reflectPercent);
      newBossHp = Math.max(0, newBossHp - reflectDmg);
      if (reflectDmg > 0) {
        setTotalDmgDealt(d => d + reflectDmg);
        setCombatStatsTracker(s => ({ ...s, reflectTotal: s.reflectTotal + reflectDmg }));
        addPopup(`🛡️ Phan -${reflectDmg}`, '#74b9ff');
        addCombatNotif('reflect', `🛡️ Phan xa ${reflectDmg} DMG!`, '#74b9ff');
      }
    }

    return { ...prev, playerHp: newPlayerHp, shield: shieldLeft, bossHp: newBossHp };
  });

  const isArmorBrokenDisplay = activeDebuffsRef.current.some(d => d.type === 'armor_break');
  const reducedDisplay = actualBossDamage(dmgAmount, isArmorBrokenDisplay ? 0 : playerDef);
  setBossAttackMsg({ text: `${label} -${reducedDisplay}`, emoji });
  setScreenShake(true);
  setLastPlayerDamage(reducedDisplay);
  addPopup(`-${reducedDisplay}`, '#e74c3c');
  setTimeout(() => { setBossAttackMsg(null); setScreenShake(false); setLastPlayerDamage(0); }, 1200);
}
