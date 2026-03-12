// ═══════════════════════════════════════════════════════════════
// Campaign Boss AI — auto-attack loop, skill selection, heal timer
// ═══════════════════════════════════════════════════════════════

import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type {
  BossState, BossAttackWarning, SkillWarning,
  ActiveDebuff, ActiveBossBuff, EggState, CombatStats,
} from '@/shared/match3/combat.types';
import {
  BOSS_SKILL_CHANCE, SKILL_DMG_MULT, SKILL_WARNING_MS,
  getBossSkillName, getEnrageMultiplier, getBossAttackInterval,
} from '@/shared/match3/combat.config';
import { ROWS, COLS } from '@/shared/match3/board.utils';
import { playSound } from '@/shared/audio';
import type { BossSkill } from '../data/bossSkills';
import i18n from '@/i18n';

const BOSS_HEAL_INTERVAL = 5000;
const MULTI_HIT_DELAY = 300;

// ═══ Boss attack loop deps ═══
export interface BossAttackLoopDeps {
  archetype: string;
  zoneNumber: number;
  isPausedRef: MutableRefObject<boolean>;
  fightStartTime: MutableRefObject<number>;
  totalPausedMsRef: MutableRefObject<number>;
  activeBossStats: MutableRefObject<{ atk: number; def: number; freq: number; healPercent: number }>;
  dodgedRef: MutableRefObject<boolean>;
  pendingHitsRef: MutableRefObject<ReturnType<typeof setTimeout>[]>;
  applyBossDamageRef: MutableRefObject<(dmg: number, label: string, emoji: string) => void>;
  setAttackWarning: (w: BossAttackWarning | null) => void;
  setSkillWarning: (w: SkillWarning | null) => void;
  setBossAttackMsg: (msg: { text: string; emoji: string } | null) => void;
}

export function setupCampaignBossAttackLoop(deps: BossAttackLoopDeps): () => void {
  const {
    archetype, zoneNumber, isPausedRef, fightStartTime, totalPausedMsRef,
    activeBossStats, dodgedRef, pendingHitsRef, applyBossDamageRef,
    setAttackWarning, setSkillWarning, setBossAttackMsg,
  } = deps;

  const attackMs = getBossAttackInterval(zoneNumber);
  const interval = setInterval(() => {
    if (isPausedRef.current) return;
    const enrageMult = getEnrageMultiplier(fightStartTime.current, totalPausedMsRef.current);
    const baseAtk = activeBossStats.current.atk * enrageMult;

    const isSkill = Math.random() < BOSS_SKILL_CHANCE;

    if (isSkill) {
      // ══ SKILL ATTACK: 1 hit x2.5, NOT multiplied by freq ══
      const skillNameKey = getBossSkillName(archetype);
      const skillName = i18n.t(skillNameKey);
      const skillDmg = Math.round(baseAtk * SKILL_DMG_MULT);

      playSound('boss_skill');
      dodgedRef.current = false;
      setAttackWarning({ skill: { name: skillName, emoji: '⚠️', dmgMult: SKILL_DMG_MULT }, rawDmg: skillDmg, phase: 'warning' });
      setSkillWarning({ name: skillName, damage: skillDmg, countdown: 1.5 });

      const skillTimeout = setTimeout(() => {
        pendingHitsRef.current = pendingHitsRef.current.filter(t => t !== skillTimeout);
        setAttackWarning(null);
        setSkillWarning(null);

        if (dodgedRef.current) {
          setBossAttackMsg({ text: i18n.t('campaign.ui.dodge_success', { defaultValue: 'NÉ THÀNH CÔNG! 🏃' }), emoji: '💨' });
          setTimeout(() => setBossAttackMsg(null), 1000);
          return;
        }

        applyBossDamageRef.current(skillDmg, `${skillName}`, '💀');
      }, SKILL_WARNING_MS);
      pendingHitsRef.current.push(skillTimeout);
    } else {
      // ══ NORMAL ATTACK: freq hits from activeBossStats, 300ms apart ══
      playSound('boss_attack');
      const freq = Math.max(1, activeBossStats.current.freq);
      for (let i = 0; i < freq; i++) {
        const hitTimeout = setTimeout(() => {
          pendingHitsRef.current = pendingHitsRef.current.filter(t => t !== hitTimeout);
          const normalDmg = Math.round(baseAtk + Math.floor(Math.random() * Math.round(baseAtk * 0.2)));
          const hitLabel = freq > 1 ? i18n.t('campaign.ui.multi_hit', { current: i + 1, total: freq, defaultValue: `Đòn ${i + 1}/${freq}!` }) : i18n.t('campaign.ui.boss_attacks', { defaultValue: 'Boss tấn công!' });
          applyBossDamageRef.current(normalDmg, hitLabel, '💥');
        }, i * MULTI_HIT_DELAY);
        pendingHitsRef.current.push(hitTimeout);
      }
    }
  }, attackMs);

  return () => {
    clearInterval(interval);
    pendingHitsRef.current.forEach(t => clearTimeout(t));
    pendingHitsRef.current = [];
  };
}

// ═══ Boss heal timer deps ═══
export interface BossHealTimerDeps {
  isPausedRef: MutableRefObject<boolean>;
  activeBossStats: MutableRefObject<{ atk: number; def: number; freq: number; healPercent: number }>;
  setBoss: Dispatch<SetStateAction<BossState>>;
  addPopup: (text: string, color: string) => void;
}

export function setupBossHealTimer(deps: BossHealTimerDeps): () => void {
  const { isPausedRef, activeBossStats, setBoss, addPopup } = deps;

  const hp = activeBossStats.current.healPercent;
  if (hp <= 0) return () => { };

  const healTimer = setInterval(() => {
    if (isPausedRef.current) return;
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
}

// ═══ Boss special skills deps ═══
export interface BossSkillsDeps {
  bossName: string;
  bossMaxHp: number;
  skills: BossSkill[] | undefined;
  isPausedRef: MutableRefObject<boolean>;
  bossHpRef: MutableRefObject<number>;
  skillCooldownsRef: MutableRefObject<Record<string, number>>;
  skillTimersRef: MutableRefObject<ReturnType<typeof setTimeout>[]>;
  activeDebuffsRef: MutableRefObject<ActiveDebuff[]>;
  activeBossBuffsRef: MutableRefObject<ActiveBossBuff[]>;
  eggRef: MutableRefObject<EggState | null>;
  lockedGemsRef: MutableRefObject<Set<number>>;
  isStunnedRef: MutableRefObject<boolean>;
  setActiveDebuffs: Dispatch<SetStateAction<ActiveDebuff[]>>;
  setActiveBossBuffs: Dispatch<SetStateAction<ActiveBossBuff[]>>;
  setEgg: Dispatch<SetStateAction<EggState | null>>;
  setLockedGems: Dispatch<SetStateAction<Set<number>>>;
  setIsStunned: (v: boolean) => void;
  setSkillAlert: (alert: { icon: string; text: string } | null) => void;
}

/**
 * Setup skill interval cho boss (campaign + world boss).
 *
 * ⚠️  CONTRACT ĐƠN VỊ — ĐỌC KỸ TRƯỚC KHI SỬA:
 *   - skill.cooldown : số GIÂY  (ví dụ: 25 → 25 giây)
 *   - skill.duration : số GIÂY  (ví dụ: 1.5 → 1.5 giây)
 *   - Hàm này nhân * 1000 bên trong để convert sang ms cho setTimeout/setInterval.
 *
 * Nếu thêm nguồn skill mới (API, config...) → đảm bảo output là GIÂY trước khi truyền vào.
 * Xem: bossSkills.ts (campaign) và skill-mapper.ts (world boss) làm ví dụ.
 */
export function setupBossSkillsInterval(deps: BossSkillsDeps): () => void {
  const {
    bossName, bossMaxHp, skills,
    isPausedRef, bossHpRef, skillCooldownsRef, skillTimersRef,
    activeDebuffsRef, activeBossBuffsRef, eggRef, lockedGemsRef, isStunnedRef,
    setActiveDebuffs, setActiveBossBuffs, setEgg, setLockedGems,
    setIsStunned, setSkillAlert,
  } = deps;

  if (!skills?.length) return () => { };

  const interval = setInterval(() => {
    if (isPausedRef.current) return;

    const readySkills = skills!
      .filter(s => {
        const lastUsed = skillCooldownsRef.current[s.type] || 0;
        return (Date.now() - lastUsed) >= s.cooldown * 1000;
      })
      .filter(s => {
        if (s.triggerHpPercent) {
          const hpPct = (bossHpRef.current / bossMaxHp) * 100;
          return hpPct <= s.triggerHpPercent;
        }
        return true;
      });

    if (readySkills.length === 0) return;

    const skill = readySkills[Math.floor(Math.random() * readySkills.length)];
    skillCooldownsRef.current[skill.type] = Date.now();

    // Show alert
    setSkillAlert({ icon: skill.icon, text: `${bossName} ${i18n.t(`campaign.boss_skills.${skill.type}.label`, { defaultValue: skill.label })}` });
    const alertTimeout = setTimeout(() => {
      skillTimersRef.current = skillTimersRef.current.filter(t => t !== alertTimeout);
      setSkillAlert(null);
    }, 2500);
    skillTimersRef.current.push(alertTimeout);

    switch (skill.type) {
      case 'stun': {
        isStunnedRef.current = true;
        setIsStunned(true);
        const stunTimeout = setTimeout(() => {
          skillTimersRef.current = skillTimersRef.current.filter(t => t !== stunTimeout);
          isStunnedRef.current = false;
          setIsStunned(false);
        }, skill.duration * 1000);
        skillTimersRef.current.push(stunTimeout);
        break;
      }
      case 'burn': {
        activeDebuffsRef.current = activeDebuffsRef.current.filter(d => d.type !== 'burn');
        activeDebuffsRef.current.push({
          type: 'burn', remainingSec: skill.duration,
          icon: skill.icon, label: skill.label, value: skill.value,
        });
        setActiveDebuffs([...activeDebuffsRef.current]);
        break;
      }
      case 'heal_block': {
        activeDebuffsRef.current = activeDebuffsRef.current.filter(d => d.type !== 'heal_block');
        activeDebuffsRef.current.push({
          type: 'heal_block', remainingSec: skill.duration,
          icon: skill.icon, label: skill.label, value: 0,
        });
        setActiveDebuffs([...activeDebuffsRef.current]);
        break;
      }
      case 'armor_break': {
        activeDebuffsRef.current = activeDebuffsRef.current.filter(d => d.type !== 'armor_break');
        activeDebuffsRef.current.push({
          type: 'armor_break', remainingSec: skill.duration,
          icon: skill.icon, label: skill.label, value: 0,
        });
        setActiveDebuffs([...activeDebuffsRef.current]);
        break;
      }
      case 'shield': {
        activeBossBuffsRef.current = activeBossBuffsRef.current.filter(b => b.type !== 'shield');
        activeBossBuffsRef.current.push({
          type: 'shield', remainingSec: skill.duration,
          icon: skill.icon, label: skill.label,
        });
        setActiveBossBuffs([...activeBossBuffsRef.current]);
        break;
      }
      case 'reflect': {
        activeBossBuffsRef.current = activeBossBuffsRef.current.filter(b => b.type !== 'reflect');
        activeBossBuffsRef.current.push({
          type: 'reflect', remainingSec: skill.duration,
          icon: skill.icon, label: skill.label,
        });
        setActiveBossBuffs([...activeBossBuffsRef.current]);
        break;
      }
      case 'egg': {
        // Only 1 egg at a time
        if (!eggRef.current) {
          const eggHp = Math.round(bossMaxHp * 0.1); // 10% of boss max HP
          const newEgg: EggState = {
            hp: eggHp, maxHp: eggHp,
            countdown: skill.duration,
            healPercent: skill.value,
          };
          eggRef.current = newEgg;
          setEgg(newEgg);
        }
        break;
      }
      case 'gem_lock': {
        const available: number[] = [];
        for (let gi = 0; gi < ROWS * COLS; gi++) {
          if (!lockedGemsRef.current.has(gi)) available.push(gi);
        }
        const count = Math.min(skill.value, available.length);
        const shuffled = available.sort(() => Math.random() - 0.5).slice(0, count);
        const newLocked = new Set(lockedGemsRef.current);
        shuffled.forEach(gi => newLocked.add(gi));
        lockedGemsRef.current = newLocked;
        setLockedGems(new Set(newLocked));
        // Auto-unlock after duration
        const unlockTimeout = setTimeout(() => {
          skillTimersRef.current = skillTimersRef.current.filter(t => t !== unlockTimeout);
          shuffled.forEach(gi => lockedGemsRef.current.delete(gi));
          setLockedGems(new Set(lockedGemsRef.current));
        }, skill.duration * 1000);
        skillTimersRef.current.push(unlockTimeout);
        break;
      }
    }
  }, 3000);

  return () => clearInterval(interval);
}
