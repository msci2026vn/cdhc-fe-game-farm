/**
 * playerStore.ts — Level/XP Config + Utility Functions
 *
 * FARMVERSE Economy v2 — Progressive Level Tier System
 * Updated: 2026-02-15
 *
 * MUST MATCH BACKEND reward.service.ts EXACTLY
 *
 * Changes from v1:
 * - Replace flat XP_PER_LEVEL=100 with 11-tier progressive system
 * - Add OGN fee per level-up (100 → 18,000)
 * - Max level: 50 → 100
 * - Level titles: 5 → 11 tiers
 */

// ═══════════════════════════════════════════════════════════════
// LEVEL TIER TABLE — MUST MATCH BACKEND reward.service.ts
// ═══════════════════════════════════════════════════════════════

interface LevelTier {
  minLevel: number;
  maxLevel: number;
  xpPerLevel: number;
  ognFee: number;
  title: string;
  icon: string;
}

const LEVEL_TIERS: LevelTier[] = [
  { minLevel: 1,  maxLevel: 5,   xpPerLevel: 50,   ognFee: 100,    title: 'Nông dân Tập sự',    icon: '🌱' },
  { minLevel: 6,  maxLevel: 10,  xpPerLevel: 80,   ognFee: 200,    title: 'Nông dân Đồng',      icon: '🥉' },
  { minLevel: 11, maxLevel: 20,  xpPerLevel: 120,  ognFee: 400,    title: 'Nông dân Bạc',       icon: '🥈' },
  { minLevel: 21, maxLevel: 30,  xpPerLevel: 200,  ognFee: 800,    title: 'Nông dân Vàng',      icon: '🥇' },
  { minLevel: 31, maxLevel: 40,  xpPerLevel: 300,  ognFee: 1500,   title: 'Nông dân Kim Cương', icon: '💎' },
  { minLevel: 41, maxLevel: 50,  xpPerLevel: 450,  ognFee: 2500,   title: 'Huyền Thoại',        icon: '🏆' },
  { minLevel: 51, maxLevel: 60,  xpPerLevel: 600,  ognFee: 4000,   title: 'Bậc Thầy',           icon: '👨‍🌾' },
  { minLevel: 61, maxLevel: 70,  xpPerLevel: 800,  ognFee: 6000,   title: 'Đại Sư',             icon: '🐉' },
  { minLevel: 71, maxLevel: 80,  xpPerLevel: 1000, ognFee: 8000,   title: 'Thần Nông',          icon: '⚡' },
  { minLevel: 81, maxLevel: 90,  xpPerLevel: 1300, ognFee: 12000,  title: 'Siêu Việt',          icon: '🔥' },
  { minLevel: 91, maxLevel: 100, xpPerLevel: 1800, ognFee: 18000,  title: 'Tối Thượng',         icon: '👑' },
];

const MAX_LEVEL = 100;

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS — Same logic as backend
// ═══════════════════════════════════════════════════════════════

function getTierForLevel(level: number): LevelTier {
  return LEVEL_TIERS.find(t => level >= t.minLevel && level <= t.maxLevel) ?? LEVEL_TIERS[0]!;
}

function getTotalXpForLevel(targetLevel: number): number {
  let totalXp = 0;
  for (let lv = 1; lv < targetLevel; lv++) {
    const tier = getTierForLevel(lv);
    totalXp += tier.xpPerLevel;
  }
  return totalXp;
}

function calculateLevel(totalXp: number): number {
  let level = 1;
  let xpUsed = 0;
  while (level < MAX_LEVEL) {
    const tier = getTierForLevel(level);
    if (xpUsed + tier.xpPerLevel > totalXp) break;
    xpUsed += tier.xpPerLevel;
    level++;
  }
  return level;
}

// ═══════════════════════════════════════════════════════════════
// LEVEL_CONFIG — Public API (used by FarmHeader, BossList, etc.)
// ═══════════════════════════════════════════════════════════════

export const LEVEL_CONFIG = {
  MAX_LEVEL,

  /** Calculate level from total XP (same formula as backend) */
  getLevel: (xp: number): number => calculateLevel(xp),

  /** Get XP progress within current level */
  getXpInLevel: (xp: number): number => {
    const level = calculateLevel(xp);
    const xpAtLevel = getTotalXpForLevel(level);
    return xp - xpAtLevel;
  },

  /** Get XP needed for current level (tier-dependent) */
  getXpForLevel: (xp: number): number => {
    const level = calculateLevel(xp);
    const tier = getTierForLevel(level);
    return tier.xpPerLevel;
  },

  /** Get OGN fee to level up from current level */
  getLevelUpFee: (level: number): number => {
    if (level >= MAX_LEVEL) return 0;
    const tier = getTierForLevel(level);
    return tier.ognFee;
  },

  /** Get tier info for a level */
  getTier: (level: number) => getTierForLevel(level),

  /** Get all tiers (for UI display) */
  getAllTiers: () => LEVEL_TIERS,
} as const;

// ═══════════════════════════════════════════════════════════════
// LEGACY EXPORTS — For backward compatibility
// ═══════════════════════════════════════════════════════════════

export function xpForLevel(level: number): number {
  return getTotalXpForLevel(level);
}

export function xpForNextLevel(level: number): number {
  return getTotalXpForLevel(level + 1);
}

export function getLevelTitle(level: number): string {
  const tier = getTierForLevel(level);
  return tier.title;
}

export function getLevelIcon(level: number): string {
  const tier = getTierForLevel(level);
  return tier.icon;
}

// ═══════════════════════════════════════════════════════════════
// XP REWARDS — Must match backend values
// ═══════════════════════════════════════════════════════════════

export const XP_REWARDS = {
  harvest: 5,      // wheat base (varies by plant: 5/15/30/50)
  water: 2,        // backend WATER_XP_REWARD = 2 (direct API, NOT sync)
  plantSeed: 0,    // no XP for planting
  bossFight: 0,    // set per boss via bossInfo.xpReward
  bugCatch: 2,     // nerfed: sync.config bug_catch xp = 2 (was 8)
  xpPickup: 3,     // nerfed: sync.config xp_pickup xp = 3 (was 5)
  dailyCheck: 20,  // buffed: sync.config daily_check xp = 20 (was 5)
};

// NOTE: OGN, XP, Level are managed by TanStack Query (usePlayerProfile)
// This store only provides utility functions for XP calculations
