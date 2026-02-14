import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';
import { BossFightInput, BossCompleteResult } from '../types/game-api.types';
import { useUIStore } from '../stores/uiStore';

export function useBossComplete() {
    const queryClient = useQueryClient();

    return useMutation<BossCompleteResult, Error, BossFightInput>({
        mutationFn: (data) => {
            console.log('[FARM-DEBUG] useBossComplete.mutationFn:', data);
            return gameApi.completeBoss(data);
        },
        retry: false,
        onSuccess: (data) => {
            console.log('[FARM-DEBUG] useBossComplete.onSuccess:', data);

            // Toast notification
            if (data.won) {
              useUIStore.getState().addToast(
                `Đánh bại Boss! +${data.ognReward || 0} OGN +${data.xpGained || 0} XP`,
                'success',
                '⚔️'
              );
            } else {
              useUIStore.getState().addToast(
                'Thua trận! Thử lại nhé.',
                'warning',
                '💔'
              );
            }

            // Invalidate boss progress
            queryClient.invalidateQueries({ queryKey: ['game', 'boss', 'progress'] });

            // Invalidate player profile (for OGN/XP)
            queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });

            // Boss progress updated via TanStack Query invalidate
        },
        onError: (error) => {
            console.error('[FARM-DEBUG] useBossComplete.onError:', error);
            useUIStore.getState().addToast(
              'Không thể hoàn thành trận đấu.',
              'error'
            );
        },
    });
}
