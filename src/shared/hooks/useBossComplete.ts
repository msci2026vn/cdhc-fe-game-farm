import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { BossFightInput, BossCompleteResult } from '../types/game-api.types';
import { useBossProgressStore } from '@/modules/boss/stores/bossProgressStore';

export function useBossComplete() {
    const queryClient = useQueryClient();

    return useMutation<BossCompleteResult, Error, BossFightInput>({
        mutationFn: (data) => {
            console.log('[FARM-DEBUG] useBossComplete.mutationFn:', data);
            return gameApi.completeBoss(data);
        },
        onSuccess: (data) => {
            console.log('[FARM-DEBUG] useBossComplete.onSuccess:', data);

            // Invalidate boss progress
            queryClient.invalidateQueries({ queryKey: ['game', 'boss', 'progress'] });

            // Invalidate player profile (for OGN/XP)
            queryClient.invalidateQueries({ queryKey: ['game', 'profile'] });

            // Update local store if needed (optional)
            // useBossProgressStore.getState()... 
        },
        onError: (error) => {
            console.error('[FARM-DEBUG] useBossComplete.onError:', error);
        },
    });
}
