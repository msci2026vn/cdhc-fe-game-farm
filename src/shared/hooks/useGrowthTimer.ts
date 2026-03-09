/**
 * useGrowthTimer — Client-side growth calculation
 *
 * Calculates growthPercent + countdown timer locally via setInterval(1s).
 * ZERO API calls. Server only verifies on harvest.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

interface PlotGrowthInput {
  plotId: string;
  plantedAt: number;
  growthDurationMs: number;
  isDead: boolean;
}

export interface GrowthState {
  percent: number;
  isReady: boolean;
  remainingMs: number;
  remainingText: string;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Thu hoạch!';
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h${m > 0 ? m + 'm' : ''}`;
  if (m > 0) return `${m}m${s > 0 ? s + 's' : ''}`;
  return `${s}s`;
}

function calcGrowth(plot: PlotGrowthInput): GrowthState {
  if (plot.isDead) {
    return { percent: 0, isReady: false, remainingMs: 0, remainingText: 'Đã chết' };
  }
  const elapsed = Date.now() - plot.plantedAt;
  const percent = Math.min(100, Math.floor((elapsed / plot.growthDurationMs) * 100));
  const remainingMs = Math.max(0, plot.growthDurationMs - elapsed);
  return {
    percent,
    isReady: percent >= 100,
    remainingMs,
    remainingText: formatRemaining(remainingMs),
  };
}

export function useGrowthTimer(plots: PlotGrowthInput[]): Map<string, GrowthState> {
  const [growthMap, setGrowthMap] = useState<Map<string, GrowthState>>(() => {
    const m = new Map<string, GrowthState>();
    for (const p of plots) m.set(p.plotId, calcGrowth(p));
    return m;
  });
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const plotsRef = useRef(plots);
  plotsRef.current = plots;

  const tick = useCallback(() => {
    const m = new Map<string, GrowthState>();
    let hasGrowing = false;
    for (const p of plotsRef.current) {
      const g = calcGrowth(p);
      m.set(p.plotId, g);
      if (!g.isReady && !p.isDead) hasGrowing = true;
    }
    setGrowthMap(m);

    // Stop interval when all plots are ready or dead
    if (!hasGrowing && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    tick(); // initial calc

    const hasGrowing = plots.some(p => !p.isDead && (Date.now() - p.plantedAt) < p.growthDurationMs);
    if (hasGrowing) {
      intervalRef.current = setInterval(tick, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [plots, tick]);

  return growthMap;
}
