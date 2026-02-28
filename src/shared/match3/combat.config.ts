// ═══════════════════════════════════════════════════════════════
// Combat config — shared constants and pure functions
// ═══════════════════════════════════════════════════════════════

export const COMBO_TIERS = [
  { min: 2, mult: 1.5, label: 'COMBO', color: '#a29bfe' },
  { min: 3, mult: 2.0, label: 'SUPER', color: '#fdcb6e' },
  { min: 4, mult: 2.5, label: 'MEGA', color: '#ff6b6b' },
  { min: 5, mult: 3.0, label: 'ULTRA', color: '#fd79a8' },
  { min: 6, mult: 4.0, label: 'LEGENDARY', color: '#e056fd' },
  { min: 8, mult: 5.0, label: '🔥 GODLIKE', color: '#f0932b' },
];

export function getComboInfo(combo: number) {
  let tier = { mult: 1, label: '', color: '#fff' };
  for (const t of COMBO_TIERS) { if (combo >= t.min) tier = t; }
  return tier;
}

// Combo VFX config (used by ComboDisplay + combo particle effects)
export const COMBO_VFX: Record<string, { emoji: string; particles: string[]; size: string }> = {
  'COMBO': { emoji: '💥', particles: ['✨', '💫'], size: 'text-base' },
  'SUPER': { emoji: '🌟', particles: ['⚡', '💛', '✨'], size: 'text-lg' },
  'MEGA': { emoji: '🔥', particles: ['💥', '🔥', '💢'], size: 'text-xl' },
  'ULTRA': { emoji: '💜', particles: ['💎', '💠', '🌀', '✨'], size: 'text-2xl' },
  'LEGENDARY': { emoji: '👑', particles: ['🌈', '💎', '⭐', '👑'], size: 'text-2xl' },
  '🔥 GODLIKE': { emoji: '☄️', particles: ['🔥', '💀', '⚡', '💥', '☄️'], size: 'text-3xl' },
};

// Boss attack timing
export const BOSS_ATK_INTERVAL = 4000;
export const BOSS_SKILL_CHANCE = 0.25;
export const SKILL_DMG_MULT = 2.0;
export const SKILL_WARNING_MS = 1500;

// Archetype-based skill names
export const ARCHETYPE_SKILLS: Record<string, string[]> = {
  glass_cannon: ['Đòn chí mạng!', 'Song kiếm!', 'Cuồng nộ!'],
  tank: ['Lao đầu!', 'Đập đất!', 'Giáp gai!'],
  healer: ['Hồi máu!', 'Bào tử hồi!', 'Hút máu!'],
  assassin: ['Đa đòn!', 'Tấn công tốc!', 'Ám sát!'],
  controller: ['Xáo trộn!', 'Hút mana!', 'Choáng!'],
  hybrid: ['Hỗn hợp!', 'Toàn diện!', 'Tổng lực!'],
  all: ['Đế Vương giáng!', 'Thiên phạt!'],
  none: ['Tấn công mạnh!', 'Lửa Địa Ngục!', 'Sấm Sét!', 'Đòn Cuồng Phong!'],
};

export function getBossSkillName(archetype: string): string {
  const pool = ARCHETYPE_SKILLS[archetype] || ARCHETYPE_SKILLS.none;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Enrage: boss gets stronger over time (+10% ATK every 30s, cap ×2.0)
export const ENRAGE_CAP = 2.0;
export function getEnrageMultiplier(startTime: number, pausedMs: number = 0): number {
  const elapsed = (Date.now() - startTime - pausedMs) / 1000;
  return Math.min(1 + Math.floor(elapsed / 30) * 0.10, ENRAGE_CAP);
}

// Boss DEF reduction (diminishing returns)
// DEF/(DEF+500): 0→0%, 100→17%, 250→33%, 450→47%, 500→50%
export function bossDEFReduction(rawDamage: number, bossDef: number): number {
  if (bossDef <= 0) return rawDamage;
  const reduction = bossDef / (bossDef + 500);
  return Math.max(1, Math.round(rawDamage * (1 - reduction)));
}

// ═══════════════════════════════════════════════════════════════
// Player skill configs — 3 skills × 5 levels
// ═══════════════════════════════════════════════════════════════

/** Ớt Hiểm — damage boost active skill */
export const OT_HIEM_CONFIG = {
  duration:     [6, 7, 8, 9, 10],              // seconds
  damageBonus:  [0.20, 0.30, 0.40, 0.50, 0.60], // +20-60%
  cooldown:     20,                              // seconds (all levels)
  critBonus:    [0, 0, 0, 0.15, 0.20],           // Lv4+ crit chance
  defBypass:    [0, 0, 0, 0, 0.50],              // Lv5 bypass 50% DEF
  cleanse:      [false, false, true, true, true], // Lv3+ remove debuffs
};

/** Rơm Bọc — shield + damage reduction active skill */
export const ROM_BOC_CONFIG = {
  duration:         [4, 5, 5, 6, 7],              // seconds
  shieldPercent:    [0.10, 0.15, 0.20, 0.25, 0.30], // % maxHP shield
  damageReduction:  [0.15, 0.20, 0.25, 0.30, 0.35], // incoming damage reduction
  cooldown:         25,                              // seconds
  healOverTime:     [0, 0, 0.02, 0.02, 0.03],       // Lv3+ % maxHP/sec
  reflect:          [0, 0, 0, 0.05, 0.08],           // Lv4+ reflect damage
  debuffImmune:     [false, false, false, false, true], // Lv5
};

/** Sấm Đồng — ULT level scaling */
export const SAM_DONG_CONFIG = {
  damageMultiplier: [3.0, 3.5, 4.0, 4.5, 5.0],
  stun:             [0, 0, 0, 1.5, 2.0],            // Lv4+ stun seconds
  pierceShield:     [false, false, false, false, true], // Lv5
};
