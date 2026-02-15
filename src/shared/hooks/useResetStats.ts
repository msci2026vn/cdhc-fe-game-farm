import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';
import { PLAYER_STATS_KEY } from './usePlayerStats';
import { useUIStore } from '../stores/uiStore';
import type { ResetStatsResponse } from '../types/game-api.types';

export function useResetStats() {
  const queryClient = useQueryClient();

  return useMutation<ResetStatsResponse, Error>({
    mutationFn: () => gameApi.resetStats(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PLAYER_STATS_KEY });
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });

      useUIStore.getState().addToast(
        `Đã reset chỉ số! -${data.ognSpent} OGN`,
        'success',
        '🔄'
      );
    },
    onError: (error) => {
      useUIStore.getState().addToast(
        error.message || 'Không thể reset chỉ số',
        'error'
      );
    },
  });
}
