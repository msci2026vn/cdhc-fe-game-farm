/**
 * useWaterPlot — TanStack Query mutation for watering plants
 *
 * FARMVERSE Step 14
 *
 * Features:
 * - Optimistic: happiness tăng ngay
 * - Cooldown: server-enforced, hiển thị countdown
 * - Rollback: nếu server reject
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { useUIStore } from '../stores/uiStore';

interface WaterResult {
  happiness: number;
  xpGained: number;
  cooldownSeconds: number;
  wateredAt: number;
  xpTotal: number;
  level: number;
  leveledUp: boolean;
  message: string;
}

interface WaterError extends Error {
  cooldownRemaining?: number;
  code?: string;
}

export function useWaterPlot() {
  const queryClient = useQueryClient();

  return useMutation<WaterResult, WaterError, string>({
    // mutationFn receives plotId
    mutationFn: (plotId: string) => {
      console.log('[FARM-DEBUG] useWaterPlot.mutationFn() — plotId:', plotId);
      return gameApi.waterPlot(plotId);
    },

    // Optimistic: tăng happiness ngay
    onMutate: async (plotId) => {
      console.log('[FARM-DEBUG] useWaterPlot.onMutate() — OPTIMISTIC', { plotId });

      await queryClient.cancelQueries({ queryKey: ['game', 'farm', 'plots'] });
      const previousPlots = queryClient.getQueryData(['game', 'farm', 'plots']);

      // Optimistic: happiness +10
      queryClient.setQueryData(['game', 'farm', 'plots'], (old: any) => {
        if (!old?.plots) return old;
        return {
          ...old,
          plots: old.plots.map((p: any) =>
            p.id === plotId
              ? { ...p, happiness: Math.min((p.happiness || 0) + 10, 100), lastWateredAt: Date.now() }
              : p
          ),
        };
      });

      console.log('[FARM-DEBUG] useWaterPlot.onMutate() — optimistic happiness +10 applied');
      return { previousPlots };
    },

    onSuccess: (data) => {
      console.log('[FARM-DEBUG] useWaterPlot.onSuccess() — SERVER CONFIRMED', JSON.stringify(data));

      // Toast notification
      useUIStore.getState().addToast(
        `Tưới nước thành công! +${data.xpGained || 0} XP`,
        'success',
        '💧'
      );

      // Invalidate to get real server data
      queryClient.invalidateQueries({ queryKey: ['game', 'farm', 'plots'] });
      queryClient.invalidateQueries({ queryKey: ['game', 'profile'] });

      console.log('[FARM-DEBUG] useWaterPlot.onSuccess() — queries invalidated, cooldown:', data.cooldownSeconds, 's');
    },

    onError: (error, plotId, context) => {
      console.error('[FARM-DEBUG] useWaterPlot.onError() — ROLLING BACK', {
        message: error.message,
        code: error.code,
        cooldownRemaining: error.cooldownRemaining,
      });

      // Toast notification
      const msg = error.message?.includes('COOLDOWN') || error.code === 'COOLDOWN'
        ? `Đang cooldown, chờ ${error.cooldownRemaining || 5}s!`
        : error.message?.includes('DEAD') ? 'Cây đã héo rồi!'
        : 'Không thể tưới nước.';
      useUIStore.getState().addToast(msg, 'warning', '⏳');

      // Rollback optimistic
      if (context?.previousPlots) {
        queryClient.setQueryData(['game', 'farm', 'plots'], context.previousPlots);
        console.log('[FARM-DEBUG] useWaterPlot.onError() — rollback DONE');
      }
    },

    onSettled: () => {
      console.log('[FARM-DEBUG] useWaterPlot.onSettled() — mutation cycle complete');
    },
  });
}
