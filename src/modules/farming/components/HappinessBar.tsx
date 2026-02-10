import { FarmPlot } from '../types/farm.types';
import { getHappinessColor } from '../utils/growth';

interface HappinessBarProps {
  plot: FarmPlot;
}

export default function HappinessBar({ plot }: HappinessBarProps) {
  const emoji = plot.happiness >= 70 ? '😊' : plot.happiness >= 40 ? '😐' : '😢';
  const colorClass = getHappinessColor(plot.happiness);

  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-semibold">
        <span>{emoji} Hạnh phúc</span>
        <span>{plot.happiness}%</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${plot.happiness}%` }}
        />
      </div>
    </div>
  );
}
