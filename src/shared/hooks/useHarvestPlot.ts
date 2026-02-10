/**
 * useHarvestPlot — TanStack Query mutation for harvesting
 *
 * FARMVERSE Step 15
 *
 * Flow: optimistic remove plot → server confirm → invalidate queries
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';

interface HarvestResult {
  ognReward: number;
  xpGained: number;
  newOgn: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
  plantName: string;
  plantEmoji: string;
  message: string;
}

export function useHarvestPlot() {
  const queryClient = useQueryClient();

  return useMutation<HarvestResult, Error, string>({
    mutationFn: (plotId: string) => {
      console.log('[FARM-DEBUG] useHarvestPlot.mutationFn() — plotId:', plotId);
      return gameApi.harvestPlot(plotId);
    },

    onMutate: async (plotId) => {
      console.log('[FARM-DEBUG] useHarvestPlot.onMutate() — OPTIMISTIC REMOVE', { plotId });

      await queryClient.cancelQueries({ queryKey: ['game', 'farm', 'plots'] });
      const previousPlots = queryClient.getQueryData(['game', 'farm', 'plots']);

      // Optimistic: remove plot from cache
      queryClient.setQueryData(['game', 'farm', 'plots'], (old: any) => {
        if (!old?.plots) return old;
        const removedPlot = old.plots.find((p: any) => p.id === plotId);
        console.log('[FARM-DEBUG] useHarvestPlot.onMutate() — removing plot:', removedPlot?.plantEmoji, removedPlot?.plantName);
        return {
          ...old,
          plots: old.plots.filter((p: any) => p.id !== plotId),
        };
      });

      return { previousPlots };
    },

    onSuccess: (data) => {
      console.log('[FARM-DEBUG] useHarvestPlot.onSuccess() — HARVEST CONFIRMED', JSON.stringify({
        ognReward: data.ognReward,
        xpGained: data.xpGained,
        newOgn: data.newOgn,
        leveledUp: data.leveledUp,
      }));

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['game', 'farm', 'plots'] });
      queryClient.invalidateQueries({ queryKey: ['game', 'profile'] });
      console.log('[FARM-DEBUG] useHarvestPlot.onSuccess() — queries invalidated');
    },

    onError: (error, plotId, context) => {
      console.error('[FARM-DEBUG] useHarvestPlot.onError() — ROLLING BACK', error.message);

      // Rollback: restore plot
      if (context?.previousPlots) {
        queryClient.setQueryData(['game', 'farm', 'plots'], context.previousPlots);
        console.log('[FARM-DEBUG] useHarvestPlot.onError() — plot restored');
      }
    },

    onSettled: () => {
      console.log('[FARM-DEBUG] useHarvestPlot.onSettled() — mutation cycle complete');
    },
  });
}
