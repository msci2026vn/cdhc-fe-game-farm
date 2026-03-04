import React from 'react';
import type { FarmPlot } from '@/shared/hooks/useFarmPlots';

interface SlotData {
  index: number;
  plot: FarmPlot | null;
  unlocked: boolean;
}

interface Props {
  slotGrid: SlotData[];
  plots: FarmPlot[];
  activePlotIndex: number;
  growthMap: Map<string, any>;
  onSlotClick: (slotIndex: number, unlocked: boolean) => void;
  setActivePlotIndex: (index: number) => void;
}

const PLOT_CLASSES = ['farm-plot--plot1', 'farm-plot--plot2', 'farm-plot--plot3'];

export default function FarmPlotRow({
  slotGrid, plots, activePlotIndex, growthMap, onSlotClick, setActivePlotIndex,
}: Props) {
  return (
    <>
      {slotGrid.map((slot, i) => {
        const posClass = PLOT_CLASSES[i] || '';
        const growth = slot.plot ? growthMap.get(slot.plot.id) : undefined;
        const isSelected = slot.plot && plots.indexOf(slot.plot) === activePlotIndex;
        const isReady = growth?.isReady && !slot.plot?.isDead;

        // LOCKED
        if (!slot.unlocked) {
          return (
            <div
              key={slot.index}
              className={`farm-plot farm-plot--locked ${posClass}`}
              onClick={() => onSlotClick(slot.index, false)}
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
              onClick={() => onSlotClick(slot.index, true)}
            >
              <span className="farm-plot-add">+</span>
              <span className="farm-plot-add-label">Trồng</span>
            </div>
          );
        }

        // DEAD
        if (slot.plot.isDead) {
          return (
            <div
              key={slot.index}
              className={`farm-plot ${posClass}`}
              style={isSelected ? { borderColor: '#ef5350', boxShadow: '0 0 12px rgba(239,83,80,0.5)' } : {}}
              onClick={() => {
                const idx = plots.indexOf(slot.plot!);
                if (idx >= 0) setActivePlotIndex(idx);
              }}
            >
              <span className="farm-plot-emoji" style={{ filter: 'grayscale(0.7)', opacity: 0.7 }}>🥀</span>
            </div>
          );
        }

        // PLANTED / GROWING / READY
        return (
          <div
            key={slot.index}
            className={`farm-plot ${isReady ? 'farm-plot--ready' : 'farm-plot--growing'} ${posClass}`}
            style={isSelected ? { borderColor: '#4CAF50', boxShadow: '0 0 14px rgba(76,175,80,0.5)' } : {}}
            onClick={() => {
              const idx = plots.indexOf(slot.plot!);
              if (idx >= 0) setActivePlotIndex(idx);
            }}
          >
            <span className="farm-plot-emoji">{slot.plot.plantType.emoji}</span>

            {/* Water need indicator */}
            {slot.plot.happiness < 40 && <span className="water-need-icon">💧</span>}

            {/* Growth progress bar */}
            {growth && (
              <div className="farm-plot-progress">
                <div
                  className={`farm-plot-progress-fill ${isReady ? 'farm-plot-progress-fill--ready' : ''}`}
                  style={{ width: `${Math.max(5, growth.percent)}%` }}
                />
              </div>
            )}

            {/* Ready badge */}
            {isReady && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                fontSize: 16, animation: 'readyGlow 1.5s infinite',
              }}>🌾</span>
            )}
          </div>
        );
      })}
    </>
  );
}
