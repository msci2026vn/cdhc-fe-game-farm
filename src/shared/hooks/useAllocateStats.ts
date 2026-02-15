import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';
import { PLAYER_STATS_KEY } from './usePlayerStats';
import { useUIStore } from '../stores/uiStore';
import type { AllocateStatsRequest, AllocateStatsResponse } from '../types/game-api.types';

export function useAllocateStats() {
  const queryClient = useQueryClient();

  return useMutation<AllocateStatsResponse, Error, AllocateStatsRequest>({
    mutationFn: (allocation) => gameApi.allocateStats(allocation),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PLAYER_STATS_KEY });
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });

      useUIStore.getState().addToast(
        'Phan bo chi so thanh cong!',
        'success',
        '✅'
      );
    },
    onError: (error) => {
      useUIStore.getState().addToast(
        error.message || 'Khong the phan bo chi so',
        'error'
      );
    },
  });
}
