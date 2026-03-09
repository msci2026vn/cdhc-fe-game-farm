/**
 * useLevelUp — TanStack Query mutation for manual level-up
 *
 * Pays OGN fee to level up when player has enough XP but
 * lacked OGN at the time of XP gain.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';
import { LEVEL_INFO_KEY } from './useLevelInfo';
import { useUIStore } from '../stores/uiStore';
import type { LevelUpResult } from '../types/game-api.types';

export function useLevelUp() {
  const queryClient = useQueryClient();

  return useMutation<LevelUpResult, Error>({
    mutationFn: () => gameApi.levelUp(),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });
      queryClient.invalidateQueries({ queryKey: LEVEL_INFO_KEY });
      queryClient.invalidateQueries({ queryKey: ['game', 'daily-status'] });

      // Toast
      useUIStore.getState().addToast(
        `Level Up! ${data.icon} ${data.title} (Level ${data.newLevel})`,
        'success',
        '🎉',
        5000
      );
    },
    onError: (error) => {
      const msg = error.message || 'Không thể lên cấp';
      useUIStore.getState().addToast(msg, 'error');
    },
  });
}
