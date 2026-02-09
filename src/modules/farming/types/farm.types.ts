export const PLANT_STAGES = ['seed', 'sprout', 'seedling', 'mature', 'dead'] as const;
export type PlantStage = typeof PLANT_STAGES[number];
export type PlantMood = 'happy' | 'sad' | 'unknown';

export interface PlantType {
  id: string;
  name: string;
  emoji: string;
  growthDurationMs: number; // total ms to mature (demo: short for testing)
  rewardOGN: number;
  shopPrice: number;
}

export interface FarmPlot {
  id: string;
  slotIndex: number;
  plantType: PlantType;
  plantedAt: number; // timestamp ms
  happiness: number; // 0-100
  lastWateredAt: number;
  isDead: boolean;
  mood: PlantMood;
}

export interface WaterResponse {
  success: boolean;
  cooldownRemaining: number;
  happinessGain: number;
}
