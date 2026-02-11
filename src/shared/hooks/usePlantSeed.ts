/**
 * usePlantSeed — TanStack Query mutation for planting seeds
 *
 * FARMVERSE Step 13
 *
 * Features:
 * - Optimistic update: cây hiện ngay trước server confirm
 * - Rollback: nếu server reject → xóa cây + hoàn OGN
 * - Auto invalidate: farm plots + player profile queries
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';

interface PlantSeedParams {
  slotIndex: number;
  plantTypeId: string;
}

interface PlantSeedResult {
  plot: {
    id: string;
    slotIndex: number;
    plantTypeId: string;
    plantedAt: number;
    happiness: number;
    lastWateredAt: number;
    plantType: {
      id: string;
      name: string;
      emoji: string;
      growthDurationMs: number;
      rewardOGN: number;
      rewardXP: number;
      shopPrice: number;
    };
    isDead: boolean;
  };
  ognRemaining: number;
  plantType: {
    name: string;
    emoji: string;
    growthDurationMs: number;
  };
}

export function usePlantSeed() {
  const queryClient = useQueryClient();

  return useMutation<PlantSeedResult, Error, PlantSeedParams>({
    mutationFn: ({ slotIndex, plantTypeId }) => {
      console.log('[FARM-DEBUG] usePlantSeed.mutationFn() — CALLING API', { slotIndex, plantTypeId });
      return gameApi.plantSeed(slotIndex, plantTypeId);
    },

    // ─── Optimistic Update ───
    onMutate: async ({ slotIndex, plantTypeId }) => {
      console.log('[FARM-DEBUG] usePlantSeed.onMutate() — OPTIMISTIC START', { slotIndex, plantTypeId });

      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ['game', 'farm', 'plots'] });
      await queryClient.cancelQueries({ queryKey: ['game', 'profile'] });

      // Snapshot previous data
      const previousPlots = queryClient.getQueryData(['game', 'farm', 'plots']);
      const previousProfile = queryClient.getQueryData(['game', 'profile']);
      console.log('[FARM-DEBUG] usePlantSeed.onMutate() — snapshot saved, prev plots:', previousPlots);

      // Optimistic: add plot to cache
      queryClient.setQueryData(['game', 'farm', 'plots'], (old: any) => {
        if (!old) return old;

        // Create temporary plot data
        const optimisticPlot = {
          id: `temp-${Date.now()}`,
          slotIndex,
          plantTypeId,
          plantedAt: Date.now(),
          happiness: 100,
          lastWateredAt: Date.now(),
          isDead: false,
          plantType: {
            id: plantTypeId,
            name: plantTypeId.charAt(0).toUpperCase() + plantTypeId.slice(1),
            emoji: '🌱', // seedling until server confirms
            growthDurationMs: 3600000, // default 1 hour
            rewardOGN: 100,
            rewardXP: 25,
            shopPrice: 200,
          },
        };

        console.log('[FARM-DEBUG] usePlantSeed.onMutate() — OPTIMISTIC PLOT added:', optimisticPlot);

        return {
          ...old,
          plots: [...(old.plots || []), optimisticPlot],
        };
      });

      return { previousPlots, previousProfile };
    },

    // ─── Success: invalidate để lấy data thật từ server ───
    onSuccess: (data) => {
      console.log('[FARM-DEBUG] usePlantSeed.onSuccess() — SERVER CONFIRMED', JSON.stringify(data));

      // Optimistic: update OGN immediately for realtime UI
      if (data.ognRemaining !== undefined) {
        queryClient.setQueryData(PLAYER_PROFILE_KEY, (old: any) => ({
          ...old,
          ogn: data.ognRemaining,
        }));
      }

      // Invalidate to get real server data (replaces optimistic)
      queryClient.invalidateQueries({ queryKey: ['game', 'farm', 'plots'] });
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });
      console.log('[FARM-DEBUG] usePlantSeed.onSuccess() — queries invalidated');
    },

    // ─── Error: rollback optimistic update ───
    onError: (error: Error, _variables, context) => {
      console.error('[FARM-DEBUG] usePlantSeed.onError() — ROLLING BACK', error.message);

      // Rollback
      if (context?.previousPlots) {
        queryClient.setQueryData(['game', 'farm', 'plots'], context.previousPlots);
        console.log('[FARM-DEBUG] usePlantSeed.onError() — rollback DONE for plots');
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(['game', 'profile'], context.previousProfile);
        console.log('[FARM-DEBUG] usePlantSeed.onError() — rollback DONE for profile');
      }
    },

    onSettled: () => {
      console.log('[FARM-DEBUG] usePlantSeed.onSettled() — mutation cycle complete');
    },
  });
}
