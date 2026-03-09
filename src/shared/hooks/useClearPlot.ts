/**
 * useClearPlot — TanStack Query mutation for clearing dead plots
 *
 * FARMVERSE Step 23 — Wither Cron + Dead Plants
 *
 * Flow: optimistic remove plot → server confirm → invalidate queries
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';
import { useUIStore } from '../stores/uiStore';

interface ClearResult {
  cleared: boolean;
  plotId: string;
  slotIndex: number;
}

export function useClearPlot() {
  const queryClient = useQueryClient();

  return useMutation<ClearResult, Error, string>({
    mutationFn: (plotId: string) => {
      console.log('[FARM-DEBUG] useClearPlot.mutationFn() — plotId:', plotId);
      return gameApi.clearPlot(plotId);
    },

    onMutate: async (plotId) => {
      console.log('[FARM-DEBUG] useClearPlot.onMutate() — OPTIMISTIC REMOVE', { plotId });

      await queryClient.cancelQueries({ queryKey: ['game', 'farm', 'plots'] });
      const previousPlots = queryClient.getQueryData(['game', 'farm', 'plots']);

      // Optimistic: remove dead plot from cache
      queryClient.setQueryData(['game', 'farm', 'plots'], (old: any) => {
        if (!old?.plots) return old;
        const removedPlot = old.plots.find((p: any) => p.id === plotId);
        console.log('[FARM-DEBUG] useClearPlot.onMutate() — removing dead plot:', removedPlot?.plantType?.emoji);
        return {
          ...old,
          plots: old.plots.filter((p: any) => p.id !== plotId),
        };
      });

      return { previousPlots };
    },

    onSuccess: (data) => {
      console.log('[FARM-DEBUG] useClearPlot.onSuccess() — CLEAR CONFIRMED', JSON.stringify({
        plotId: data.plotId,
        slotIndex: data.slotIndex,
      }));

      // Toast notification
      useUIStore.getState().addToast('Đã dọn cây héo!', 'success', '🧹');

      // Invalidate farm plots query
      queryClient.invalidateQueries({ queryKey: ['game', 'farm', 'plots'] });
      // Invalidate profile (OGN/XP/Level might change)
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });
      console.log('[FARM-DEBUG] useClearPlot.onSuccess() — queries invalidated');
    },

    onError: (error, plotId, context) => {
      console.error('[FARM-DEBUG] useClearPlot.onError() — ROLLING BACK', error.message);

      // Rollback: restore plot
      if (context?.previousPlots) {
        queryClient.setQueryData(['game', 'farm', 'plots'], context.previousPlots);
        console.log('[FARM-DEBUG] useClearPlot.onError() — plot restored');
      }
    },

    onSettled: () => {
      console.log('[FARM-DEBUG] useClearPlot.onSettled() — mutation cycle complete');
    },
  });
}
