// ═══════════════════════════════════════════════════════════════
// Boss damage handler — applies boss damage to player
// Fort immunity → DEF reduction → Shield → Immortal → Reflect
// ═══════════════════════════════════════════════════════════════

import type { Dispatch, SetStateAction } from 'react';
import { actualBossDamage } from '@/shared/utils/combat-formulas';
import type { ActiveMilestones } from '@/shared/utils/combat-formulas';
import type { BossState, CombatStats, CombatNotifType } from '@/shared/match3/combat.types';
import i18n from '@/i18n';

export interface BossDamageDeps {
  milestones: ActiveMilestones;
  playerDef: number;
  setBoss: Dispatch<SetStateAction<BossState>>;
  setBossAttackMsg: (msg: { text: string; emoji: string } | null) => void;
  setScreenShake: (v: boolean) => void;
  setTotalDmgDealt: Dispatch<SetStateAction<number>>;
  setCombatStatsTracker: Dispatch<SetStateAction<CombatStats>>;
  addPopup: (text: string, color: string) => void;
  addCombatNotif: (type: CombatNotifType, text: string, color: string) => void;
}

export function applyBossDamageImpl(
  deps: BossDamageDeps,
  dmgAmount: number,
  label: string,
  emoji: string,
): void {
  const {
    milestones, playerDef, setBoss, setBossAttackMsg, setScreenShake,
    setTotalDmgDealt, setCombatStatsTracker, addPopup, addCombatNotif,
  } = deps;

  setBoss(prev => {
    if (prev.bossHp <= 0 || prev.playerHp <= 0) return prev;

    // Fort milestone: immune every 10 turns
    if (milestones.hasFort && prev.turnCount > 0 && prev.turnCount % 10 === 0) {
      addPopup(i18n.t('immune_popup'), '#74b9ff');
      addCombatNotif('fort', i18n.t('immune_combat_notif'), '#74b9ff');
      setBossAttackMsg({ text: i18n.t('immune_attack_msg'), emoji: '🏰' });
      setTimeout(() => setBossAttackMsg(null), 1000);
      return prev;
    }

    // Apply DEF damage reduction
    const reducedDmg = actualBossDamage(dmgAmount, playerDef);

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
      addPopup(i18n.t('immortal_popup'), '#a29bfe');
      addCombatNotif('immortal', i18n.t('immortal_combat_notif'), '#a29bfe');
      return { ...prev, playerHp: newPlayerHp, shield: shieldLeft, immortalUsed: true };
    }

    // Reflect milestone: reflect damage back to boss
    let newBossHp = prev.bossHp;
    if (milestones.reflectPercent > 0 && reducedDmg > 0) {
      const reflectDmg = Math.floor(reducedDmg * milestones.reflectPercent);
      newBossHp = Math.max(0, prev.bossHp - reflectDmg);
      if (reflectDmg > 0) {
        setTotalDmgDealt(d => d + reflectDmg);
        setCombatStatsTracker(s => ({ ...s, reflectTotal: s.reflectTotal + reflectDmg }));
        addPopup(i18n.t('reflect_popup', { dmg: reflectDmg }), '#74b9ff');
        addCombatNotif('reflect', i18n.t('reflect_combat_notif', { dmg: reflectDmg }), '#74b9ff');
      }
    }

    return { ...prev, playerHp: newPlayerHp, shield: shieldLeft, bossHp: newBossHp };
  });

  const reducedDisplay = actualBossDamage(dmgAmount, playerDef);
  setBossAttackMsg({ text: `${label} -${reducedDisplay}`, emoji });
  setScreenShake(true);
  addPopup(`-${reducedDisplay}`, '#e74c3c');
  setTimeout(() => { setBossAttackMsg(null); setScreenShake(false); }, 1200);
}
