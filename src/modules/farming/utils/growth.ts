import { PlantStage, FarmPlot } from '../types/farm.types';

const STAGE_THRESHOLDS: { max: number; stage: PlantStage }[] = [
  { max: 15, stage: 'seed' },
  { max: 40, stage: 'sprout' },
  { max: 75, stage: 'seedling' },
  { max: 100, stage: 'mature' },
];

export function calculateGrowthPercent(plot: FarmPlot): number {
  if (plot.isDead) return 0;
  const elapsed = Date.now() - plot.plantedAt;
  const pct = Math.min(100, (elapsed / plot.plantType.growthDurationMs) * 100);
  return Math.round(pct);
}

export function calculateStage(plot: FarmPlot): PlantStage {
  if (plot.isDead) return 'dead';
  const pct = calculateGrowthPercent(plot);
  for (const t of STAGE_THRESHOLDS) {
    if (pct <= t.max) return t.stage;
  }
  return 'mature';
}

export function isHarvestReady(plot: FarmPlot): boolean {
  return !plot.isDead && calculateGrowthPercent(plot) >= 100;
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
