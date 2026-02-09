import { memo } from 'react';
import { FarmPlot } from '../types/farm.types';
import { getPlantSprite, calculateStage, getMoodEmoji } from '../utils/growth';

interface PlantSpriteProps {
  plot: FarmPlot;
  showWaterEffect?: boolean;
}

const STAGE_SIZES: Record<string, string> = {
  seed: 'text-4xl',
  sprout: 'text-5xl',
  seedling: 'text-6xl',
  mature: 'text-7xl',
  dead: 'text-6xl',
};

function PlantSpriteInner({ plot, showWaterEffect }: PlantSpriteProps) {
  const stage = calculateStage(plot);
  const sprite = getPlantSprite(plot);
  const sizeClass = STAGE_SIZES[stage];
  const shouldSway = stage !== 'seed' && stage !== 'dead';

  return (
    <div className="relative flex flex-col items-center">
      {/* Mood indicator */}
      <span className="absolute -top-4 -right-2 text-lg animate-bounce-in">
        {getMoodEmoji(plot.mood)}
      </span>

      {/* Water splash particles */}
      {showWaterEffect && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="absolute animate-float-up text-sm"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 40}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              💧
            </span>
          ))}
        </div>
      )}

      {/* Plant */}
      <div className={shouldSway ? 'animate-plant-sway' : ''}>
        <span className={`${sizeClass} block drop-shadow-sm`}>{sprite}</span>
      </div>
    </div>
  );
}

export const PlantSprite = memo(PlantSpriteInner);
