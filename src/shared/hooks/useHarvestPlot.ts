/**
 * useHarvestPlot — TanStack Query mutation for harvesting
 *
 * FARMVERSE Step 15
 *
 * Flow: optimistic remove plot → server confirm → invalidate queries
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';
import { useUIStore } from '../stores/uiStore';

import { HarvestResult } from '../types/game-api.types';

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
      const plantName = data.plantName || 'cây';
      const plantEmoji = data.plantEmoji || '🌾';
      const ognEarned = data.ognEarned || 0;
      const xp = data.xpGained || 0;

      // Toast: harvest = sell directly, show OGN earned
      useUIStore.getState().addToast(
        `${plantEmoji} Thu hoạch ${plantName}! +${ognEarned} OGN +${xp} XP`,
        'success',
        '🌾'
      );

      // Optimistic: update OGN + XP from harvest response
      queryClient.setQueryData(PLAYER_PROFILE_KEY, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ogn: data.newOgn ?? old.ogn,
          xp: data.newXp ?? old.xp,
          level: data.newLevel ?? old.level,
        };
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['game', 'farm', 'plots'] });
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });
    },

    onError: (error: any, _plotId, context: any) => {
      console.error('[FARM-DEBUG] useHarvestPlot.onError() — ROLLING BACK', error.message);

      // Toast notification
      const msg = error.message?.includes('NOT_READY') ? 'Cây chưa chín!'
        : error.message?.includes('DEAD') ? 'Cây đã héo, cần dọn vườn!'
          : 'Không thể thu hoạch.';
      useUIStore.getState().addToast(msg, 'error');

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
