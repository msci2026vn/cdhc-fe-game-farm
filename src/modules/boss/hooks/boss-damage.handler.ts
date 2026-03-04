// ═══════════════════════════════════════════════════════════════
// Boss damage handler — applies boss damage to player
// Fort immunity → DEF reduction → Shield → Immortal → Reflect
// ═══════════════════════════════════════════════════════════════

import type { Dispatch, SetStateAction } from 'react';
import { actualBossDamage } from '@/shared/utils/combat-formulas';
import type { ActiveMilestones } from '@/shared/utils/combat-formulas';
import type { BossState, CombatStats, CombatNotifType } from '@/shared/match3/combat.types';

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
      addPopup('🏰 Miễn nhiễm!', '#74b9ff');
      addCombatNotif('fort', '🏰 Thành Trì bất!', '#74b9ff');
      setBossAttackMsg({ text: 'Thành Trì bất!', emoji: '🏰' });
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
      addPopup('👼 Bất Tử!', '#a29bfe');
      addCombatNotif('immortal', '👼 Bất Tử kích hoạt!', '#a29bfe');
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
        addPopup(`🛡️ Phản -${reflectDmg}`, '#74b9ff');
        addCombatNotif('reflect', `🛡️ Phản xạ ${reflectDmg} DMG!`, '#74b9ff');
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
