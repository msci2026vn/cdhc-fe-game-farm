// ═══════════════════════════════════════════════════════════════
// Boss attack loop — auto-attack interval, skill vs normal
// ═══════════════════════════════════════════════════════════════

import type { MutableRefObject } from 'react';
import type { BossAttackWarning, SkillWarning } from '@/shared/match3/combat.types';
import {
  BOSS_ATK_INTERVAL, BOSS_SKILL_CHANCE, SKILL_DMG_MULT, SKILL_WARNING_MS,
  getBossSkillName, getEnrageMultiplier,
} from '@/shared/match3/combat.config';
import { playSound } from '@/shared/audio';

export interface BossAttackLoopDeps {
  bossAttack: number;
  archetype: string;
  fightStartTime: MutableRefObject<number>;
  dodgedRef: MutableRefObject<boolean>;
  setAttackWarning: (w: BossAttackWarning | null) => void;
  setSkillWarning: (w: SkillWarning | null) => void;
  setBossAttackMsg: (msg: { text: string; emoji: string } | null) => void;
  applyBossDamageToPlayer: (dmg: number, label: string, emoji: string) => void;
}

export function setupBossAttackLoop(deps: BossAttackLoopDeps): () => void {
  const {
    bossAttack, archetype, fightStartTime, dodgedRef,
    setAttackWarning, setSkillWarning, setBossAttackMsg,
    applyBossDamageToPlayer,
  } = deps;

  let skillTimeout: ReturnType<typeof setTimeout>;

  const interval = setInterval(() => {
    // Enrage: +10% ATK every 30 seconds
    const enrageMult = getEnrageMultiplier(fightStartTime.current);
    const baseAtk = bossAttack * enrageMult;

    const isSkill = Math.random() < BOSS_SKILL_CHANCE;

    if (isSkill) {
      // ══ SKILL ATTACK: 1.5s warning, player can dodge ══
      const skillName = getBossSkillName(archetype);
      const skillDmg = Math.round(baseAtk * SKILL_DMG_MULT);

      playSound('boss_skill');
      dodgedRef.current = false;
      setAttackWarning({ skill: { name: skillName, emoji: '⚠️', dmgMult: SKILL_DMG_MULT }, rawDmg: skillDmg, phase: 'warning' });
      setSkillWarning({ name: skillName, damage: skillDmg, countdown: 1.5 });

      // After 1.5s: resolve
      skillTimeout = setTimeout(() => {
        setAttackWarning(null);
        setSkillWarning(null);

        if (dodgedRef.current) {
          setBossAttackMsg({ text: 'NÉ THÀNH CÔNG! 🏃', emoji: '💨' });
          setTimeout(() => setBossAttackMsg(null), 1000);
          return;
        }

        // Not dodged → full skill damage
        applyBossDamageToPlayer(skillDmg, `${skillName}`, '💀');
      }, SKILL_WARNING_MS);
    } else {
      // ══ NORMAL ATTACK: instant, no warning, no dodge ══
      playSound('boss_attack');
      const normalDmg = Math.round(baseAtk + Math.floor(Math.random() * Math.round(baseAtk * 0.2)));
      applyBossDamageToPlayer(normalDmg, 'Boss tấn công!', '💥');
    }
  }, BOSS_ATK_INTERVAL);

  return () => {
    clearInterval(interval);
    clearTimeout(skillTimeout);
  };
}
