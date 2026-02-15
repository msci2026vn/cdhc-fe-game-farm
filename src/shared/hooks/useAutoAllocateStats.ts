import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';
import { PLAYER_STATS_KEY } from './usePlayerStats';
import { useUIStore } from '../stores/uiStore';
import type { AllocateStatsResponse } from '../types/game-api.types';

export function useAutoAllocateStats() {
  const queryClient = useQueryClient();

  return useMutation<AllocateStatsResponse, Error, 'attack' | 'defense' | 'balance'>({
    mutationFn: (preset) => gameApi.autoAllocateStats(preset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYER_STATS_KEY });
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });

      useUIStore.getState().addToast(
        'Tu dong phan bo thanh cong!',
        'success',
        '✅'
      );
    },
    onError: (error) => {
      useUIStore.getState().addToast(
        error.message || 'Khong the tu dong phan bo',
        'error'
      );
    },
  });
}
