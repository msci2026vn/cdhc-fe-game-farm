import { PlantStage, FarmPlot } from '../types/farm.types';
import { useWeatherStore, WeatherType } from '../stores/weatherStore';

const STAGE_THRESHOLDS: { max: number; stage: PlantStage }[] = [
  { max: 15, stage: 'seed' },
  { max: 40, stage: 'sprout' },
  { max: 75, stage: 'seedling' },
  { max: 100, stage: 'mature' },
];

/** Weather multiplier for growth speed (>1 = faster, <1 = slower) */
export function getWeatherGrowthMultiplier(weather: WeatherType): number {
  switch (weather) {
    case 'rain': return 1.5;      // Mưa: +50% tốc độ
    case 'storm': return 1.2;     // Bão: +20% (mưa nhiều nhưng gió mạnh)
    case 'sunny': return 1.0;     // Nắng: bình thường
    case 'cloudy': return 0.9;    // Mây: -10%
    case 'hot': return 0.7;       // Nóng: -30%
    case 'cold': return 0.6;      // Lạnh: -40%
    case 'snow': return 0.5;      // Tuyết: -50%
    case 'wind': return 0.85;     // Gió: -15%
    default: return 1.0;
  }
}

/** Weather modifier for happiness decay (>1 = faster decay, <1 = slower) */
export function getWeatherHappinessModifier(weather: WeatherType): number {
  switch (weather) {
    case 'hot': return 2.0;       // Nóng: x2 giảm hạnh phúc
    case 'storm': return 1.8;     // Bão: x1.8
    case 'cold': return 1.5;      // Lạnh: x1.5
    case 'snow': return 1.3;      // Tuyết: x1.3
    case 'wind': return 1.2;      // Gió: x1.2
    case 'rain': return 0.5;      // Mưa: x0.5 (cây thích mưa)
    case 'cloudy': return 0.8;    // Mây: x0.8
    case 'sunny': return 1.0;     // Nắng: bình thường
    default: return 1.0;
  }
}

/**
 * Calculate BASE growth percent (without weather multiplier).
 * This matches BE logic exactly — used for harvest readiness check.
 * BE formula: (elapsed / growthDurationMs) * 100, cap at 100
 */
export function calculateBaseGrowthPercent(plot: FarmPlot): number {
  if (plot.isDead) return 0;
  const elapsed = Date.now() - plot.plantedAt;
  const pct = Math.min(100, (elapsed / plot.plantType.growthDurationMs) * 100);
  return Math.round(pct);
}

/**
 * Calculate DISPLAY growth percent (WITH weather multiplier).
 * Used for UI animation/visual only. Shows faster/slower growth based on weather.
 * Formula: base_growth * weather_multiplier
 */
export function calculateGrowthPercent(plot: FarmPlot): number {
  if (plot.isDead) return 0;
  const weather = useWeatherStore.getState().weather;
  const multiplier = getWeatherGrowthMultiplier(weather);
  const baseGrowth = calculateBaseGrowthPercent(plot);
  const displayGrowth = Math.min(100, baseGrowth * multiplier);
  return Math.round(displayGrowth);
}

export function calculateStage(plot: FarmPlot): PlantStage {
  if (plot.isDead) return 'dead';
  const pct = calculateGrowthPercent(plot);
  for (const t of STAGE_THRESHOLDS) {
    if (pct <= t.max) return t.stage;
  }
  return 'mature';
}

/**
 * Check if plot is ready for harvest.
 * IMPORTANT: Uses BASE growth (no weather) to match BE logic.
 * FE may show 100% early due to weather bonus, but harvest only works when base time is met.
 */
export function isHarvestReady(plot: FarmPlot): boolean {
  return !plot.isDead && calculateBaseGrowthPercent(plot) >= 100;
}

// Sprite mapping: stage → emoji
export function getPlantSprite(plot: FarmPlot): string {
  const stage = calculateStage(plot);
  const sprites: Record<PlantStage, string> = {
    seed: '🫘',
    sprout: '🌱',
    seedling: '🌿',
    mature: plot.plantType.emoji,
    dead: '🥀',
  };
  return sprites[stage];
}

export function getMoodEmoji(mood: FarmPlot['mood']): string {
  return mood === 'happy' ? '😊' : mood === 'sad' ? '😢' : '😐';
}

export function getHappinessColor(happiness: number): string {
  if (happiness >= 70) return 'from-secondary to-secondary-light';
  if (happiness >= 40) return 'from-farm-gold to-secondary-light';
  return 'from-farm-red to-secondary';
}

export function getStatusTag(plot: FarmPlot): { text: string; className: string } {
  if (plot.isDead) return { text: 'Đã chết 💀', className: 'bg-destructive/10 text-destructive' };
  if (isHarvestReady(plot)) return { text: 'Sẵn sàng thu hoạch 🌾', className: 'bg-secondary/20 text-secondary-foreground' };
  if (plot.happiness < 30) return { text: 'Cần tưới 💧', className: 'bg-farm-blue/10 text-farm-blue' };
  return { text: 'Khỏe mạnh 💚', className: 'bg-primary-pale text-primary' };
}
