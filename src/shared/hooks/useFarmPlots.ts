/**
 * useFarmPlots — TanStack Query hook for farm plots
 *
 * FARMVERSE Step 12
 *
 * Returns user's farm plots from server with:
 * - Real-time growth percentage
 * - Plant type info (name, emoji)
 * - Auto-refresh every 60s (growth changes over time)
 *
 * Transforms BE response to match FE FarmPlot format expected by components.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';

// Plant type lookup table (matches BE plant_types data)
const PLANT_TYPES: Record<string, { id: string; name: string; emoji: string; growthDurationMs: number; rewardOGN: number; rewardXP: number; shopPrice: number }> = {
  wheat: { id: 'wheat', name: 'Lúa Mì', emoji: '🌾', growthDurationMs: 30000, rewardOGN: 100, rewardXP: 5, shopPrice: 50 },
  tomato: { id: 'tomato', name: 'Cà Chua', emoji: '🍅', growthDurationMs: 120000, rewardOGN: 400, rewardXP: 25, shopPrice: 200 },
  carrot: { id: 'carrot', name: 'Cà Rốt', emoji: '🥕', growthDurationMs: 150000, rewardOGN: 560, rewardXP: 25, shopPrice: 280 },
  chili: { id: 'chili', name: 'Ớt', emoji: '🌶️', growthDurationMs: 200000, rewardOGN: 800, rewardXP: 25, shopPrice: 400 },
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
    queryFn: async () => {
      console.log('[FARM-DEBUG] useFarmPlots: 🔄 Fetching plots from API...');
      const data = await gameApi.getPlots();
      console.log('[FARM-DEBUG] useFarmPlots: ✅ Received data =', JSON.stringify(data));
      return data;
    },
    staleTime: 0, // FIX: Set to 0 to always refetch when invalidated
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
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

  const totalSlots = data?.totalSlots ?? 6;

  return {
    ...rest,
    data: transformedPlots,
    totalSlots,
  };
}
