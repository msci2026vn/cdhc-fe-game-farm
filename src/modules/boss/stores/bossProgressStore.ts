import { create } from 'zustand';

interface BossProgress {
  killedBosses: Record<string, number>;
  totalDmgDealt: number;
  addKill: (bossId: string) => void;
  addDmg: (amount: number) => void;
  getKills: (bossId: string) => number;
}

export const useBossProgressStore = create<BossProgress>((set, get) => ({
  killedBosses: {},
  totalDmgDealt: 0,

  addKill: (bossId) => set(s => ({
    killedBosses: { ...s.killedBosses, [bossId]: (s.killedBosses[bossId] || 0) + 1 },
  })),

  addDmg: (amount) => set(s => ({ totalDmgDealt: s.totalDmgDealt + amount })),

  getKills: (bossId) => get().killedBosses[bossId] || 0,
}));
