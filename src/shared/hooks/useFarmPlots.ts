/**
 * useFarmPlots — TanStack Query hook for farm plots
 *
 * Fetches plots ONCE on mount. No polling.
 * Growth is calculated client-side by useGrowthTimer.
 * Re-fetches only after user actions (plant/water/harvest) via invalidateQueries.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';

// Plant type lookup table (matches BE plant_types DB — updated 2026-02-15)
const PLANT_TYPES: Record<string, { id: string; name: string; emoji: string; growthDurationMs: number; rewardOGN: number; rewardXP: number; shopPrice: number }> = {
  wheat: { id: 'wheat', name: 'Lúa Mì', emoji: '🌾', growthDurationMs: 900000, rewardOGN: 100, rewardXP: 5, shopPrice: 50 },
  tomato: { id: 'tomato', name: 'Cà Chua', emoji: '🍅', growthDurationMs: 3600000, rewardOGN: 400, rewardXP: 15, shopPrice: 200 },
  carrot: { id: 'carrot', name: 'Cà Rốt', emoji: '🥕', growthDurationMs: 10800000, rewardOGN: 800, rewardXP: 30, shopPrice: 400 },
  chili: { id: 'chili', name: 'Ớt', emoji: '🌶️', growthDurationMs: 21600000, rewardOGN: 1600, rewardXP: 50, shopPrice: 800 },
};

// BE response format
export interface ApiFarmPlot {
  id: string;
  slotIndex: number;
  plantTypeId: string;
  plantedAt: number;
  happiness: number;
  lastWateredAt: number;
  isDead: boolean;
  plantName: string;
  plantEmoji: string;
  growthPercent: number;
  isReady: boolean;
}

export interface FarmPlotsResponse {
  plots: ApiFarmPlot[];
  totalSlots: number;
}

// Transformed to match FE FarmPlot format
export interface FarmPlot {
  id: string;
  slotIndex: number;
  plantType: {
    id: string;
    name: string;
    emoji: string;
    growthDurationMs: number;
    rewardOGN: number;
    rewardXP: number;
    shopPrice: number;
  };
  plantedAt: number;
  happiness: number;
  lastWateredAt: number | null;
  isDead: boolean;
  mood: 'happy' | 'neutral' | 'sad';
}

/**
 * Transform BE plot to FE FarmPlot format
 */
function transformPlot(apiPlot: ApiFarmPlot): FarmPlot {
  const plantType = PLANT_TYPES[apiPlot.plantTypeId] || PLANT_TYPES.tomato;

  // Compute mood based on happiness
  let mood: 'happy' | 'neutral' | 'sad' = 'neutral';
  if (apiPlot.happiness >= 70) mood = 'happy';
  else if (apiPlot.happiness <= 30) mood = 'sad';

  return {
    id: apiPlot.id,
    slotIndex: apiPlot.slotIndex,
    plantType,
    plantedAt: apiPlot.plantedAt,
    happiness: apiPlot.happiness,
    lastWateredAt: apiPlot.lastWateredAt,
    isDead: apiPlot.isDead,
    mood,
  };
}

export function useFarmPlots() {
  return useQuery<FarmPlotsResponse>({
    queryKey: ['game', 'farm', 'plots'],
    queryFn: () => gameApi.getPlots(),
    staleTime: Infinity,          // Never auto-refetch; growth is client-side
    gcTime: 1000 * 60 * 10,      // Keep in cache 10 minutes
    refetchOnWindowFocus: false,  // No poll on focus
    refetchOnMount: true,         // Fetch once on mount
    retry: 2,
  });
}

/**
 * Hook that returns transformed plots matching FE FarmStore format
 */
export function useTransformedFarmPlots() {
  const { data, ...rest } = useFarmPlots();

  // Memoize to prevent new array reference every render → avoids infinite re-render loop
  const transformedPlots: FarmPlot[] = useMemo(
    () => data?.plots.map(transformPlot) ?? [],
    [data?.plots]
  );

  const totalSlots = data?.totalSlots ?? 1; // Free user default = 1 slot

  return {
    ...rest,
    data: transformedPlots,
    totalSlots,
  };
}
