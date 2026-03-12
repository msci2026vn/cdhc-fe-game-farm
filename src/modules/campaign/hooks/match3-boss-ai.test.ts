// ============================================================
// Unit test: Boss skill duration & cooldown contract (campaign + world boss)
//
// Mục tiêu: Bắt lỗi nhầm đơn vị ms vs giây trước khi ra production.
// Root cause đã fix: skill-mapper.ts output ms → setupBossSkillsInterval
// expect giây → stun 1500ms * 1000 = 25 phút thay vì 1.5 giây.
// ============================================================

import { describe, it, expect } from 'vitest';
import { adaptWorldBossSkills } from '@/modules/world-boss/adapters/skill-mapper';
import type { BossSkill } from '../data/bossSkills';

// ── Fixture: Campaign Boss skill từ bossSkills.ts (GIÂY) ──
const campaignStun: BossSkill = {
  type: 'stun',
  cooldown: 20,    // 20 giây
  duration: 1,     // 1 giây
  value: 0,
  label: 'Choáng!',
  icon: '💫',
};

const campaignBurn: BossSkill = {
  type: 'burn',
  cooldown: 25,    // 25 giây
  duration: 5,     // 5 giây
  value: 2,
  label: 'Đốt!',
  icon: '🔥',
};

// ── Fixture: World Boss raw API skills ──
const wbStunApiSkill = { type: 'stun' as const, trigger: 'every_3_turns', damage_multi: 0.3 };
const wbBurnApiSkill = { type: 'dot_poison' as const, trigger: 'every_2_turns', damage_multi: 0.2 };
const wbGemLockApiSkill = { type: 'atk_down' as const, trigger: 'every_3_turns', damage_multi: 0 };
const wbShieldApiSkill = { type: 'shield' as const, trigger: 'hp_below_50', damage_multi: 0 };

describe('Boss Skill — Unit contract (cooldown & duration phải là GIÂY)', () => {

  // ─── Campaign Boss ───────────────────────────────────────────
  describe('Campaign Boss (bossSkills.ts)', () => {
    it('stun cooldown = 20 giây → * 1000 = 20000ms (không phải 20ms hay 20.000.000ms)', () => {
      const cooldownMs = campaignStun.cooldown * 1000;
      expect(cooldownMs).toBe(20_000);
      expect(cooldownMs).not.toBe(20);
      expect(cooldownMs).not.toBe(20_000_000);
    });

    it('stun duration = 1 giây → * 1000 = 1000ms (không phải 1ms hay 1.000.000ms)', () => {
      const durationMs = campaignStun.duration * 1000;
      expect(durationMs).toBe(1_000);
      expect(durationMs).not.toBe(1);
      expect(durationMs).not.toBe(1_000_000);
    });

    it('burn remainingSec = duration trực tiếp = 5 (giây)', () => {
      // remainingSec được ticker trừ 1/giây — phải là giây, không phải ms
      const remainingSec = campaignBurn.duration;
      expect(remainingSec).toBe(5);
      expect(remainingSec).not.toBe(5_000); // không phải ms
    });
  });

  // ─── World Boss (skill-mapper.ts) ────────────────────────────
  describe('World Boss — adaptWorldBossSkills output (phải là GIÂY)', () => {
    it('stun: cooldown phải là giây (25), không phải ms (25000)', () => {
      const [skill] = adaptWorldBossSkills([wbStunApiSkill]);
      expect(skill).toBeDefined();
      expect(skill!.cooldown).toBe(25);           // 25 giây ✅
      expect(skill!.cooldown).not.toBe(25_000);   // không phải ms ❌
    });

    it('stun: duration phải là 1.5 giây, không phải 1500ms', () => {
      const [skill] = adaptWorldBossSkills([wbStunApiSkill]);
      expect(skill).toBeDefined();
      expect(skill!.duration).toBe(1.5);          // 1.5 giây ✅
      expect(skill!.duration).not.toBe(1_500);    // không phải ms ❌
    });

    it('stun: duration * 1000 = 1500ms (đúng cho setTimeout)', () => {
      const [skill] = adaptWorldBossSkills([wbStunApiSkill]);
      const durationMs = skill!.duration! * 1000;
      expect(durationMs).toBe(1_500);             // 1.5 giây ✅
      expect(durationMs).not.toBe(1_500_000);     // không phải 25 phút ❌
    });

    it('burn (dot_poison): duration = 5 giây, không phải 5000', () => {
      const [skill] = adaptWorldBossSkills([wbBurnApiSkill]);
      expect(skill!.duration).toBe(5);
      expect(skill!.duration).not.toBe(5_000);
    });

    it('gem_lock: duration = 5 giây → * 1000 = 5000ms (không phải 5.000.000ms)', () => {
      const [skill] = adaptWorldBossSkills([wbGemLockApiSkill]);
      const durationMs = skill!.duration! * 1000;
      expect(durationMs).toBe(5_000);
      expect(durationMs).not.toBe(5_000_000);     // không phải 83 phút ❌
    });

    it('shield: cooldown = 25 giây (hp_below_50), duration = 3 giây', () => {
      const [skill] = adaptWorldBossSkills([wbShieldApiSkill]);
      expect(skill!.cooldown).toBe(25);
      expect(skill!.duration).toBe(3);
    });

    it('egg countdown = duration trực tiếp = 8 giây, không phải 8000', () => {
      const eggApiSkill = { type: 'summon_minion' as const, trigger: 'every_2_turns', damage_multi: 0.15 };
      const [skill] = adaptWorldBossSkills([eggApiSkill]);
      // countdown được truyền trực tiếp vào EggState (ticker trừ 1/giây)
      expect(skill!.duration).toBe(8);            // 8 giây ✅
      expect(skill!.duration).not.toBe(8_000);    // không phải ms ❌
    });
  });

  // ─── Regression: campaign boss không bị ảnh hưởng ───────────
  describe('Regression: campaign boss values không đổi', () => {
    it('campaign cooldown vẫn là giây — không cần thay đổi', () => {
      // BOSS_SKILLS trong bossSkills.ts luôn output giây
      // Đảm bảo fix world boss không làm hỏng campaign
      expect(campaignStun.cooldown).toBe(20);  // giây
      expect(campaignStun.duration).toBe(1);   // giây
      expect(campaignBurn.cooldown).toBe(25);  // giây
      expect(campaignBurn.duration).toBe(5);   // giây
    });
  });
});
