import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import type { StatInfo } from '../types/game-api.types';

export const PLAYER_STATS_KEY = ['game', 'player-stats'];

export function usePlayerStats() {
  return useQuery<StatInfo>({
    queryKey: PLAYER_STATS_KEY,
    queryFn: () => gameApi.getStatInfo(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
