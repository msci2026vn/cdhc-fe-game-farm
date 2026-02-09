import { useEffect, useState, useCallback } from 'react';
import ScreenShell from '@/shared/components/ScreenShell';
import FarmScene from '../components/FarmScene';
import { PlantSprite } from '../components/PlantSprite';
import PlantPot from '../components/PlantPot';
import GrowthBar from '../components/GrowthBar';
import HappinessBar from '../components/HappinessBar';
import PlantStatus from '../components/PlantStatus';
import PlantSeedModal from '../components/PlantSeedModal';
import useActionButtons from '../hooks/useActionButtons';
import { useFarmStore, startHappinessDecay } from '../stores/farmStore';
import { useUIStore } from '@/shared/stores/uiStore';
import EmptyState from '@/shared/components/EmptyState';
import { PlantType } from '../types/farm.types';

export default function FarmingScreen() {
  const plots = useFarmStore((s) => s.plots);
  const ogn = useFarmStore((s) => s.ogn);
  const plantSeed = useFarmStore((s) => s.plantSeed);
  const addToast = useUIStore((s) => s.addToast);

  const [activePlotIndex, setActivePlotIndex] = useState(0);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [, forceUpdate] = useState(0);

  // Tick growth bars every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  // Start happiness decay
  useEffect(() => {
    startHappinessDecay();
  }, []);

  const activePlot = plots[activePlotIndex] || null;

  const handlePlantNew = useCallback(() => {
    setShowPlantModal(true);
  }, []);

  const handleSelectPlant = useCallback((plantType: PlantType) => {
    const nextSlot = plots.length;
    plantSeed(plantType, nextSlot);
    setShowPlantModal(false);
    setActivePlotIndex(plots.length); // will be the new plot
    addToast(`Đã trồng ${plantType.name} ${plantType.emoji}!`, 'success');
  }, [plots.length, plantSeed, addToast]);

  return (
    <ScreenShell>
      {activePlot ? (
        <ActivePlotView
          plot={activePlot}
          plotCount={plots.length}
          activePlotIndex={activePlotIndex}
          onChangePlot={setActivePlotIndex}
          onPlantNew={handlePlantNew}
        />
      ) : (
        <div>
          <FarmScene>
            <EmptyState
              emoji="🌱"
              title="Chưa có cây nào"
              description="Hãy trồng cây đầu tiên nhé!"
            />
          </FarmScene>
          <div className="px-4 py-4">
            <button
              onClick={() => setShowPlantModal(true)}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-base active:scale-95 transition-transform shadow-lg green-glow"
            >
              🌱 Trồng cây mới
            </button>
          </div>
        </div>
      )}

      <PlantSeedModal
        open={showPlantModal}
        onClose={() => setShowPlantModal(false)}
        onSelect={handleSelectPlant}
      />
    </ScreenShell>
  );
}

// Separated to use hooks conditionally
function ActivePlotView({
  plot,
  plotCount,
  activePlotIndex,
  onChangePlot,
  onPlantNew,
}: {
  plot: NonNullable<ReturnType<typeof useFarmStore.getState>['plots'][number]>;
  plotCount: number;
  activePlotIndex: number;
  onChangePlot: (i: number) => void;
  onPlantNew: () => void;
}) {
  const { buttons, showWater } = useActionButtons({ plot, onPlantNew });

  return (
    <div>
      <FarmScene>
        {/* Plot dots if multiple */}
        {plotCount > 1 && (
          <div className="flex gap-2 mb-4">
            {Array.from({ length: plotCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => onChangePlot(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === activePlotIndex
                    ? 'bg-primary scale-125'
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Plant + Pot */}
        <PlantSprite plot={plot} showWaterEffect={showWater} />
        <div className="mt-2">
          <PlantPot plot={plot} />
        </div>

        {/* Status tags */}
        <div className="mt-3">
          <PlantStatus plot={plot} />
        </div>

        {/* Bars */}
        <div className="mt-3 w-60 space-y-2">
          <GrowthBar plot={plot} />
          <HappinessBar plot={plot} />
        </div>
      </FarmScene>

      {/* Action buttons */}
      <div className="px-4 py-4 grid grid-cols-4 gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            disabled={btn.disabled}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border font-semibold text-xs transition-all active:scale-95 ${btn.color} ${
              btn.disabled ? 'opacity-50' : ''
            }`}
          >
            <span className="text-2xl">{btn.emoji}</span>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Plant more button */}
      <div className="px-4 pb-2">
        <button
          onClick={onPlantNew}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-heading font-semibold text-sm active:scale-95 transition-all hover:bg-primary-pale"
        >
          + Trồng thêm cây mới
        </button>
      </div>
    </div>
  );
}
