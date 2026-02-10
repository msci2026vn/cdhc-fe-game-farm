import { FarmPlot } from '../types/farm.types';
import { calculateGrowthPercent, calculateStage } from '../utils/growth';

interface GrowthBarProps {
  plot: FarmPlot;
}

const STAGE_LABELS: Record<string, string> = {
  seed: 'Hạt giống',
  sprout: 'Nảy mầm',
  seedling: 'Cây con',
  mature: 'Trưởng thành',
  dead: 'Đã chết',
};

export default function GrowthBar({ plot }: GrowthBarProps) {
  const pct = calculateGrowthPercent(plot);
  const stage = calculateStage(plot);

  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-semibold">
        <span>📈 {STAGE_LABELS[stage]}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
