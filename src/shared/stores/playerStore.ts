import { create } from 'zustand';

// ═══════════════════════════════════════════════════════════════
// LEVEL/XP CONFIG — MUST MATCH BACKEND EXACTLY
// ═════════════════════════════════════════════════════════════════
// Backend formula: reward.service.ts → floor(xp / 100) + 1
// This means: Level 1 = 0-99 XP, Level 2 = 100-199 XP, etc.

export const LEVEL_CONFIG = {
  MAX_LEVEL: 50,
  XP_PER_LEVEL: 100, // MUST match backend reward.service.ts

  // Get level from total XP (same as backend)
  getLevel: (xp: number): number => Math.min(Math.floor(xp / 100) + 1, 50),

  // Get XP in current level
  getXpInLevel: (xp: number): number => xp % 100,

  // Get XP needed for current level (always 100 for linear)
  getXpForLevel: (): number => 100,
} as const;

// Legacy aliases for backward compatibility
export function xpForLevel(level: number): number {
  // Return START XP for this level (e.g., Level 2 starts at 100 XP)
  return (level - 1) * LEVEL_CONFIG.XP_PER_LEVEL;
}

export function xpForNextLevel(level: number): number {
  // Return END XP for this level (e.g., Level 2 ends at 199 XP, next starts at 200)
  return level * LEVEL_CONFIG.XP_PER_LEVEL;
}

export function getLevelTitle(level: number): string {
  if (level >= 15) return 'Nông dân Kim Cương';
  if (level >= 10) return 'Nông dân Vàng';
  if (level >= 5) return 'Nông dân Bạc';
  if (level >= 3) return 'Nông dân Đồng';
  return 'Nông dân Tập sự';
}

// XP rewards for actions
export const XP_REWARDS = {
  harvest: 25,
  water: 5,
  plantSeed: 10,
  bossFight: 0, // set per boss via bossInfo.xpReward
  bugCatch: 8,
};

// NOTE: OGN, XP, Level are now managed by TanStack Query (usePlayerProfile)
// This store only provides utility functions for XP calculations
