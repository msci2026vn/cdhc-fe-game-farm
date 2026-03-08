import { useTranslation } from 'react-i18next';
import { FarmPlot } from '../types/farm.types';
import { getStatusTag, isHarvestReady, calculateStage } from '../utils/growth';

interface PlantStatusProps {
  plot: FarmPlot;
}

export default function PlantStatus({ plot }: PlantStatusProps) {
  const { t } = useTranslation();
  const status = getStatusTag(plot);
  const harvestReady = isHarvestReady(plot);
  const stage = calculateStage(plot);

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${status.className}`}>
        {status.text}
      </span>
      {harvestReady && !plot.isDead && (
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary/20 text-secondary-foreground animate-pulse-glow">
          {t('farming.plant_status.harvest_now')}
        </span>
      )}
      {stage !== 'dead' && stage !== 'mature' && (
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-farm-sky text-farm-blue">
          {t('farming.plant_status.growing')}
        </span>
      )}
    </div>
  );
}
