import { create } from 'zustand';

// XP required per level (cumulative)
const XP_TABLE = [0, 0, 50, 120, 220, 360, 550, 800, 1100, 1500, 2000, 2600, 3400, 4400, 5600, 7000, 9000, 11500, 14500, 18000, 22000];

export function xpForLevel(level: number): number {
  return XP_TABLE[Math.min(level, XP_TABLE.length - 1)] || 0;
}

export function xpForNextLevel(level: number): number {
  return xpForLevel(level + 1);
}

interface BossProgress {
  killedBosses: Record<string, number>;
  totalDmgDealt: number;
  xp: number;
  level: number;
  addKill: (bossId: string) => void;
  addDmg: (amount: number) => void;
  addXp: (amount: number) => void;
  getKills: (bossId: string) => number;
}

export const useBossProgressStore = create<BossProgress>((set, get) => ({
  killedBosses: {},
  totalDmgDealt: 0,
  xp: 0,
  level: 1,

  addKill: (bossId) => set(s => ({
    killedBosses: { ...s.killedBosses, [bossId]: (s.killedBosses[bossId] || 0) + 1 },
  })),

  addDmg: (amount) => set(s => ({ totalDmgDealt: s.totalDmgDealt + amount })),

  addXp: (amount) => set(s => {
    let newXp = s.xp + amount;
    let newLevel = s.level;
    // Level up loop
    while (newLevel < XP_TABLE.length - 1 && newXp >= xpForNextLevel(newLevel)) {
      newLevel++;
    }
    return { xp: newXp, level: newLevel };
  }),

  getKills: (bossId) => get().killedBosses[bossId] || 0,
}));
