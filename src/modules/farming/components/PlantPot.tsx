import { FarmPlot } from '../types/farm.types';

interface PlantPotProps {
  plot: FarmPlot;
}

export default function PlantPot({ plot }: PlantPotProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Pot top rim */}
      <div className="w-32 h-3 rounded-t-lg bg-gradient-to-b from-farm-brown to-farm-brown-dark" />
      {/* Pot body */}
      <div className="w-28 h-12 rounded-b-2xl bg-gradient-to-b from-farm-brown to-farm-brown-dark flex items-center justify-center shadow-md">
        <span className="text-[10px] font-heading font-semibold text-farm-gold-light tracking-wide">
          {plot.plantType.emoji} {plot.plantType.name}
        </span>
      </div>
      {/* Pot shadow */}
      <div className="w-24 h-2 bg-foreground/5 rounded-full mt-1" />
    </div>
  );
}
