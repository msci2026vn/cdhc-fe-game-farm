import { create } from 'zustand';
import { FarmPlot, PlantType } from '../types/farm.types';
import { useWeatherStore } from './weatherStore';
import { getWeatherHappinessModifier } from '../utils/growth';
import { usePlayerStore } from '@/shared/stores/playerStore';

// Demo plant types
export const PLANT_TYPES: PlantType[] = [
  { id: 'tomato', name: 'Cà Chua', emoji: '🍅', growthDurationMs: 120_000, rewardOGN: 100, shopPrice: 200 },
  { id: 'lettuce', name: 'Rau Muống', emoji: '🥬', growthDurationMs: 90_000, rewardOGN: 60, shopPrice: 150 },
  { id: 'cucumber', name: 'Dưa Leo', emoji: '🥒', growthDurationMs: 180_000, rewardOGN: 150, shopPrice: 350 },
  { id: 'carrot', name: 'Cà Rốt', emoji: '🥕', growthDurationMs: 150_000, rewardOGN: 120, shopPrice: 280 },
  { id: 'chili', name: 'Ớt', emoji: '🌶️', growthDurationMs: 200_000, rewardOGN: 180, shopPrice: 400 },
];

const WATER_COOLDOWN_MS = 15_000; // 15s for demo (real: 1 hour)
const HAPPINESS_GAIN = 15;
const HAPPINESS_DECAY_INTERVAL = 10_000; // lose 2 every 10s for demo

interface FarmState {
  plots: FarmPlot[];
  ogn: number;
  waterCooldowns: Record<string, number>; // plotId → cooldown end timestamp
  
  // Actions
  plantSeed: (plantType: PlantType, slotIndex: number) => void;
  waterPlot: (plotId: string) => boolean;
  harvestPlot: (plotId: string) => number; // returns OGN earned
  addOgn: (amount: number) => void;
  tickHappiness: () => void;
  getWaterCooldownRemaining: (plotId: string) => number;
}

export const useFarmStore = create<FarmState>((set, get) => ({
  plots: [
    {
      id: 'plot-1',
      slotIndex: 0,
      plantType: PLANT_TYPES[0], // Cà Chua
      plantedAt: Date.now() - 40_000, // started 40s ago
      happiness: 75,
      lastWateredAt: Date.now() - 20_000,
      isDead: false,
      mood: 'happy',
    },
  ],
  ogn: 1250,
  waterCooldowns: {},

  plantSeed: (plantType, slotIndex) => {
    const newPlot: FarmPlot = {
      id: `plot-${Date.now()}`,
      slotIndex,
      plantType,
      plantedAt: Date.now(),
      happiness: 80,
      lastWateredAt: Date.now(),
      isDead: false,
      mood: 'happy',
    };
    set((s) => ({ plots: [...s.plots, newPlot] }));
    usePlayerStore.getState().addXp(10);
  },

  waterPlot: (plotId) => {
    const state = get();
    const cooldownEnd = state.waterCooldowns[plotId] || 0;
    if (Date.now() < cooldownEnd) return false;

    set((s) => ({
      plots: s.plots.map((p) =>
        p.id === plotId
          ? {
              ...p,
              happiness: Math.min(100, p.happiness + HAPPINESS_GAIN),
              lastWateredAt: Date.now(),
              mood: 'happy' as const,
            }
          : p
      ),
      waterCooldowns: {
        ...s.waterCooldowns,
        [plotId]: Date.now() + WATER_COOLDOWN_MS,
      },
    }));
    usePlayerStore.getState().addXp(5);
    return true;
  },

  harvestPlot: (plotId) => {
    const plot = get().plots.find((p) => p.id === plotId);
    if (!plot) return 0;
    const reward = plot.plantType.rewardOGN;
    set((s) => ({
      plots: s.plots.filter((p) => p.id !== plotId),
      ogn: s.ogn + reward,
    }));
    usePlayerStore.getState().addXp(25);
    return reward;
  },

  addOgn: (amount) => set((s) => ({ ogn: s.ogn + amount })),

  tickHappiness: () => {
    const weather = useWeatherStore.getState().weather;
    const modifier = getWeatherHappinessModifier(weather);
    const decay = Math.round(2 * modifier);
    set((s) => ({
      plots: s.plots.map((p) => {
        if (p.isDead) return p;
        const newHappiness = Math.max(0, p.happiness - decay);
        const isDead = newHappiness <= 0;
        const mood = newHappiness >= 50 ? 'happy' : 'sad';
        return { ...p, happiness: newHappiness, isDead, mood: isDead ? 'sad' : mood } as FarmPlot;
      }),
    }));
  },

  getWaterCooldownRemaining: (plotId) => {
    const end = get().waterCooldowns[plotId] || 0;
    return Math.max(0, Math.ceil((end - Date.now()) / 1000));
  },
}));

// Auto-decay happiness
let decayInterval: ReturnType<typeof setInterval> | null = null;
export function startHappinessDecay() {
  if (decayInterval) return;
  decayInterval = setInterval(() => {
    useFarmStore.getState().tickHappiness();
  }, HAPPINESS_DECAY_INTERVAL);
}
