// ═══════════════════════════════════════════════════════════════
// Combat config — shared constants and pure functions
// ═══════════════════════════════════════════════════════════════

export const COMBO_TIERS = [
  { min: 0,  mult: 1.0, label: '',          color: '',        shake: false, emoji: '' },
  { min: 3,  mult: 1.0, label: 'NICE',      color: '#22c55e', shake: false, emoji: '👍' },
  { min: 5,  mult: 1.1, label: 'GREAT',     color: '#3b82f6', shake: false, emoji: '🔥' },
  { min: 8,  mult: 1.2, label: 'EXCELLENT', color: '#a855f7', shake: false, emoji: '⚡' },
  { min: 12, mult: 1.3, label: 'AMAZING',   color: '#f59e0b', shake: true,  emoji: '💥' },
  { min: 20, mult: 1.5, label: 'EPIC',      color: '#ef4444', shake: true,  emoji: '🌟' },
  { min: 30, mult: 1.8, label: 'LEGENDARY', color: '#fbbf24', shake: true,  emoji: '👑' },
  { min: 50, mult: 2.0, label: 'MYTHIC',    color: '#ff00ff', shake: true,  emoji: '🏆' },
] as const;

export type ComboTier = (typeof COMBO_TIERS)[number];

export function getComboTier(combo: number): ComboTier {
  for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
    if (combo >= COMBO_TIERS[i].min) return COMBO_TIERS[i];
  }
  return COMBO_TIERS[0];
}

/** Backward compat alias */
export function getComboInfo(combo: number) {
  return getComboTier(combo);
}

// Combo VFX config (used by ComboDisplay + combo particle effects)
export const COMBO_VFX: Record<string, { emoji: string; particles: string[]; size: string }> = {
  'NICE':      { emoji: '👍', particles: ['✨', '💫'], size: 'text-sm' },
  'GREAT':     { emoji: '🔥', particles: ['⚡', '💛', '✨'], size: 'text-base' },
  'EXCELLENT': { emoji: '⚡', particles: ['💥', '⚡', '💢'], size: 'text-lg' },
  'AMAZING':   { emoji: '💥', particles: ['💎', '💠', '🌀', '✨'], size: 'text-xl' },
  'EPIC':      { emoji: '🌟', particles: ['🌈', '💎', '⭐', '🌟'], size: 'text-2xl' },
  'LEGENDARY': { emoji: '👑', particles: ['👑', '💎', '⭐', '🌈', '✨'], size: 'text-2xl' },
  'MYTHIC':    { emoji: '🏆', particles: ['🔥', '💀', '⚡', '💥', '☄️', '🏆'], size: 'text-3xl' },
};

// Boss attack timing — zone-scaled intervals
export const BOSS_ATK_INTERVAL = 4000; // fallback default
export const BOSS_ATTACK_INTERVALS: Record<number, number> = {
  1: 5000,  2: 5000,  3: 5000,   // Zone 1-3: 5s — newbie friendly
  4: 4000,  5: 4000,  6: 4000,   // Zone 4-6: 4s — moderate pressure
  7: 3500,  8: 3500,             // Zone 7-8: 3.5s — fast reflexes
  9: 3000,  10: 3000,            // Zone 9-10: 3s — hardcore
};
export function getBossAttackInterval(zone: number): number {
  return BOSS_ATTACK_INTERVALS[zone] ?? BOSS_ATK_INTERVAL;
}
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

// Animation timing — centralised constants for match3 cascade loop
export const ANIM_TIMING = {
  MATCH_RESOLVE_MS: 350,    // time to show matched cells before removing
  CASCADE_BASE_MS: 300,     // base delay between cascade steps
  CASCADE_DECAY: 0.90,      // each step 10% faster
  CASCADE_MIN_MS: 150,      // floor delay
  MAX_CASCADE: 50,          // safety cap to prevent infinite loops
  SPAWN_ANIM_MS: 400,       // spawn animation duration for special gems
  SHAKE_BOMB_MS: 350,       // screen shake duration for bomb trigger
  SHAKE_RAINBOW_MS: 500,    // screen shake duration for rainbow trigger
} as const;
