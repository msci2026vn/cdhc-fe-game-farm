import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmPlot } from '@/shared/hooks/useFarmPlots';
import type { GrowthState } from '@/shared/hooks/useGrowthTimer';

interface SlotData {
  index: number;
  plot: FarmPlot | null;
  unlocked: boolean;
}

interface Props {
  slotGrid: SlotData[];
  growthMap: Map<string, GrowthState>;
  canWater: (plotId: string) => boolean;
  getCooldownRemaining: (plotId: string) => number;
  onPlant: (slotIndex: number) => void;
  onWater: (plotIndex: number) => void;
  onHarvest: (plotIndex: number) => void;
  onClear: (plotIndex: number) => void;
  onLocked: (slotIndex: number) => void;
  isWatering: boolean;
  isClearing: boolean;
}

const PLOT_CLASSES = ['farm-plot--plot1', 'farm-plot--plot2', 'farm-plot--plot3'];

export default function FarmPlotRow({
  slotGrid, growthMap, canWater, getCooldownRemaining,
  onPlant, onWater, onHarvest, onClear, onLocked,
  isWatering, isClearing,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      {slotGrid.map((slot, i) => {
        const posClass = PLOT_CLASSES[i] || '';

        // LOCKED
        if (!slot.unlocked) {
          return (
            <div
              key={slot.index}
              className={`farm-plot farm-plot--locked ${posClass}`}
              onClick={() => onLocked(slot.index)}
            >
              <span className="farm-plot-lock">🔒</span>
              <span className="farm-plot-lock-label">VIP</span>
            </div>
          );
        }

        // EMPTY
        if (!slot.plot) {
          return (
            <div
              key={slot.index}
              className={`farm-plot farm-plot--empty ${posClass}`}
              onClick={() => onPlant(slot.index)}
            >
              <div className="plot-empty-action">
                <span className="plot-plus">+</span>
                <span className="plot-plant-label">{t('farming.plot.plant')}</span>
              </div>
            </div>
          );
        }

        const growth = growthMap.get(slot.plot.id);
        const isReady = growth?.isReady && !slot.plot.isDead;
        const needsWater = slot.plot.happiness < 40 && !slot.plot.isDead && !isReady;
        const isHealthy = !slot.plot.isDead && !needsWater && !isReady;
        const canWaterNow = canWater(slot.plot.id);
        const waterCooldown = getCooldownRemaining(slot.plot.id);

        // DEAD / WILTED
        if (slot.plot.isDead) {
          return (
            <div key={slot.index} className={`farm-plot ${posClass}`}>
              <span className="farm-plot-emoji" style={{ filter: 'grayscale(0.7)', opacity: 0.7 }}>🥀</span>
              <span className="plot-timer" style={{ color: '#fca5a5' }}>{t('farming.plot.dead')}</span>
              <button
                className="plot-clear-btn"
                disabled={isClearing}
                onClick={(e) => { e.stopPropagation(); onClear(i); }}
              >
                🗑 {t('farming.plot.clear')}
              </button>
            </div>
          );
        }

        // READY TO HARVEST
        if (isReady) {
          return (
            <div key={slot.index} className={`farm-plot farm-plot--ready ${posClass}`}>
              <span className="farm-plot-emoji">{slot.plot.plantType.emoji}</span>
              <span className="plot-timer" style={{ color: '#fde047' }}>{t('farming.plot.harvest_ready')}</span>
              <button
                className="plot-harvest-btn ready-glow"
                onClick={(e) => { e.stopPropagation(); onHarvest(i); }}
              >
                ✅ {t('farming.plot.harvest_short')}
              </button>
            </div>
          );
        }

        // GROWING
        return (
          <div key={slot.index} className={`farm-plot farm-plot--growing ${posClass}`}>

            {/* 💧 Water icon — top right, tapable */}
            {needsWater && (
              <button
                className={`plot-water-icon ${canWaterNow ? 'water-pulse' : ''}`}
                disabled={!canWaterNow || isWatering}
                onClick={(e) => { e.stopPropagation(); onWater(i); }}
                title={!canWaterNow ? `Còn ${waterCooldown}s` : 'Tưới nước'}
              >
                💧
                {!canWaterNow && (
                  <span className="plot-water-cooldown">{waterCooldown}s</span>
                )}
              </button>
            )}

            <span className="farm-plot-emoji">{slot.plot.plantType.emoji}</span>

            {/* Timer countdown */}
            <span className="plot-timer">{growth?.remainingText || '...'}</span>

            {/* Progress bar */}
            {growth && (
              <div className="plot-progress">
                <div
                  className="plot-progress-fill"
                  style={{ width: `${Math.max(5, growth.percent)}%` }}
                />
              </div>
            )}

            {/* Status badges — bottom, only when growing */}
            <div className="plot-status-badges">
              {isHealthy && (
                <span className="plot-badge plot-badge--healthy">✅ {t('farming.plot.healthy')}</span>
              )}
              {!needsWater && (
                <span className="plot-badge plot-badge--water">💧 {t('farming.plot.watered')}</span>
              )}
            </div>

          </div>
        );
      })}
    </>
  );
}
