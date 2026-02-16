// ═══════════════════════════════════════════════════════════════
// Boss Special Skills — 40 campaign bosses skill mapping
// Phase 1: stun, burn, heal_block, armor_break (executed in hook)
// Phase 2: egg, shield, reflect, gem_lock (data only, execution TBD)
// ═══════════════════════════════════════════════════════════════

export type BossSkillType =
  | 'egg'         // 🥚 Đẻ Trứng (Phase 2)
  | 'stun'        // 💫 Choáng
  | 'heal_block'  // 🚫 Khóa Hồi
  | 'armor_break' // 💔 Phá Giáp
  | 'shield'      // 🛡️ Chắn Dame (Phase 2)
  | 'reflect'     // 🔄 Phản Dame (Phase 2)
  | 'burn'        // 🔥 Đốt
  | 'gem_lock';   // 🔒 Khóa Gem (Phase 2)

export interface BossSkill {
  type: BossSkillType;
  cooldown: number;         // Seconds between uses
  duration: number;         // Seconds of effect
  value: number;            // % or count depending on skill
  triggerHpPercent?: number; // Only activate when boss HP < X%
  label: string;            // Vietnamese label
  icon: string;             // Emoji icon
}

export const BOSS_SKILLS: Record<number, BossSkill[]> = {
  // ═══ Zone 1: Ruộng Lúa — No skills (tutorial) ═══
  1: [], 2: [], 3: [], 4: [],

  // ═══ Zone 2: Vườn Cà Chua — Boss chúa #8 has stun ═══
  5: [], 6: [], 7: [],
  8: [
    { type: 'stun', cooldown: 20, duration: 1, value: 0, label: 'Choáng!', icon: '💫' },
  ],

  // ═══ Zone 3: Cánh Đồng Hoa — Boss chúa #12 has shield (Phase 2) ═══
  9: [], 10: [], 11: [],
  12: [
    { type: 'shield', cooldown: 25, duration: 3, value: 0, label: 'Bất tử!', icon: '🛡️' },
  ],

  // ═══ Zone 4: Thảo Nguyên — Elite #15 stun, Boss chúa #16 stun + gem_lock ═══
  13: [], 14: [],
  15: [
    { type: 'stun', cooldown: 25, duration: 1, value: 0, label: 'Choáng!', icon: '💫' },
  ],
  16: [
    { type: 'stun', cooldown: 20, duration: 1.5, value: 0, label: 'Choáng!', icon: '💫' },
    { type: 'gem_lock', cooldown: 20, duration: 5, value: 3, label: 'Khóa gem!', icon: '🔒' },
  ],

  // ═══ Zone 5: Rừng Tre — Elite #19 burn, Boss chúa #20 egg + burn ═══
  17: [], 18: [],
  19: [
    { type: 'burn', cooldown: 25, duration: 5, value: 2, label: 'Đốt!', icon: '🔥' },
  ],
  20: [
    { type: 'egg', cooldown: 15, duration: 8, value: 15, label: 'Đẻ trứng!', icon: '🥚' },
    { type: 'burn', cooldown: 25, duration: 5, value: 2, label: 'Đốt!', icon: '🔥' },
  ],

  // ═══ Zone 6: Đầm Lầy — Elite #23 heal_block, Boss chúa #24 heal_block + gem_lock ═══
  21: [], 22: [],
  23: [
    { type: 'heal_block', cooldown: 30, duration: 6, value: 0, label: 'Khóa hồi!', icon: '🚫' },
  ],
  24: [
    { type: 'heal_block', cooldown: 25, duration: 8, value: 0, label: 'Khóa hồi!', icon: '🚫' },
    { type: 'gem_lock', cooldown: 20, duration: 5, value: 3, label: 'Khóa gem!', icon: '🔒' },
  ],

  // ═══ Zone 7: Rừng Mưa — Elite #27 armor_break, Boss chúa #28 armor_break + burn ═══
  25: [], 26: [],
  27: [
    { type: 'armor_break', cooldown: 35, duration: 8, value: 0, label: 'Phá giáp!', icon: '💔' },
  ],
  28: [
    { type: 'armor_break', cooldown: 30, duration: 10, value: 0, label: 'Phá giáp!', icon: '💔' },
    { type: 'burn', cooldown: 20, duration: 5, value: 2, label: 'Đốt!', icon: '🔥' },
  ],

  // ═══ Zone 8: Cao Nguyên — Elite #31 shield, Boss chúa #32 shield + reflect (Phase 2) ═══
  29: [], 30: [],
  31: [
    { type: 'shield', cooldown: 25, duration: 3, value: 0, label: 'Bất tử!', icon: '🛡️' },
  ],
  32: [
    { type: 'shield', cooldown: 25, duration: 3, value: 0, label: 'Bất tử!', icon: '🛡️' },
    { type: 'reflect', cooldown: 20, duration: 5, value: 30, label: 'Phản dame!', icon: '🔄' },
  ],

  // ═══ Zone 9: Núi Lửa — Elite #35 burn+heal_block, Boss chúa #36 3 skills ═══
  33: [], 34: [],
  35: [
    { type: 'burn', cooldown: 20, duration: 5, value: 2, label: 'Đốt!', icon: '🔥' },
    { type: 'heal_block', cooldown: 30, duration: 8, value: 0, label: 'Khóa hồi!', icon: '🚫' },
  ],
  36: [
    { type: 'heal_block', cooldown: 25, duration: 8, value: 0, label: 'Khóa hồi!', icon: '🚫' },
    { type: 'armor_break', cooldown: 30, duration: 10, value: 0, label: 'Phá giáp!', icon: '💔' },
    { type: 'burn', cooldown: 20, duration: 5, value: 2, label: 'Đốt!', icon: '🔥' },
  ],

  // ═══ Zone 10: Đế Vương — Per-boss skills (phase system handles #40) ═══
  37: [
    { type: 'stun', cooldown: 20, duration: 1.5, value: 0, label: 'Choáng!', icon: '💫' },
  ],
  38: [
    { type: 'gem_lock', cooldown: 15, duration: 5, value: 4, label: 'Khóa gem!', icon: '🔒' },
  ],
  39: [
    { type: 'shield', cooldown: 20, duration: 3, value: 0, label: 'Bất tử!', icon: '🛡️' },
    { type: 'reflect', cooldown: 25, duration: 5, value: 30, label: 'Phản dame!', icon: '🔄' },
  ],
  40: [], // Đế Vương uses phase system
};

/** Get skill description in Vietnamese for BossDetailSheet */
export function getSkillDescVi(skill: BossSkill): string {
  switch (skill.type) {
    case 'stun':        return `Khóa grid ${skill.duration}s`;
    case 'burn':        return `${skill.value}% maxHP/giây × ${skill.duration}s`;
    case 'heal_block':  return `Khóa hồi HP ${skill.duration}s`;
    case 'armor_break': return `DEF = 0 trong ${skill.duration}s`;
    case 'shield':      return `Miễn nhiễm damage ${skill.duration}s`;
    case 'reflect':     return `Phản ${skill.value}% dame ${skill.duration}s`;
    case 'egg':         return `Trứng nở ${skill.duration}s → hồi ${skill.value}% HP`;
    case 'gem_lock':    return `Khóa ${skill.value} gem × ${skill.duration}s`;
    default:            return '';
  }
}
