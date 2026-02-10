import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';

export interface BossProgressItem {
    userId: string;
    bossId: string;
    kills: number;
    totalDamage: number;
    lastFightAt: string;
}

export function useBossProgress() {
    return useQuery<BossProgressItem[]>({
        queryKey: ['game', 'boss', 'progress'],
        queryFn: () => gameApi.getBossProgress(),
        staleTime: 60 * 1000, // 1 minute
        retry: 2,
        refetchOnWindowFocus: true,
    });
}
