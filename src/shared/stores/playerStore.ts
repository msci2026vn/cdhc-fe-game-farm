import { create } from 'zustand';

// XP required per level (cumulative)
const XP_TABLE = [0, 0, 50, 120, 220, 360, 550, 800, 1100, 1500, 2000, 2600, 3400, 4400, 5600, 7000, 9000, 11500, 14500, 18000, 22000];

export function xpForLevel(level: number): number {
  return XP_TABLE[Math.min(level, XP_TABLE.length - 1)] || 0;
}

export function xpForNextLevel(level: number): number {
  return xpForLevel(level + 1);
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

interface PlayerState {
  xp: number;
  level: number;
  addXp: (amount: number) => { leveledUp: boolean; newLevel: number };
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  xp: 0,
  level: 1,

  addXp: (amount) => {
    const state = get();
    let newXp = state.xp + amount;
    let newLevel = state.level;
    while (newLevel < XP_TABLE.length - 1 && newXp >= xpForNextLevel(newLevel)) {
      newLevel++;
    }
    const leveledUp = newLevel > state.level;
    set({ xp: newXp, level: newLevel });
    return { leveledUp, newLevel };
  },
}));
