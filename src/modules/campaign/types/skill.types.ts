// ═══════════════════════════════════════════════════════════════
// Skill types — player skill definitions and combat state
// ═══════════════════════════════════════════════════════════════

export type SkillId = 'sam_dong' | 'ot_hiem' | 'rom_boc';

export interface SkillEffect {
  label: string;
  value: string;
}

export interface PlayerSkill {
  skillId: SkillId;
  name: string;
  emoji: string;
  level: number; // 0 = locked, 1-5
  description: string;
  effects: SkillEffect[];
  nextLevelEffects?: SkillEffect[];
  upgradeCost: { ogn: number; fragments: number } | null; // null if max
  unlockCondition: string | null; // e.g. "Thắng Boss #4"
  isUnlocked: boolean;
}

export interface PlayerSkillLevels {
  sam_dong: number;
  ot_hiem: number;
  rom_boc: number;
}

export interface UpgradeSkillResult {
  success: boolean;
  newLevel: number;
  skillId: SkillId;
}

/** Combat-time skill state for a single active skill */
export interface ActiveSkillState {
  active: boolean;
  cooldownRemaining: number; // seconds
  durationRemaining: number; // seconds
}
