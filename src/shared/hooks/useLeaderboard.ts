import { useQuery } from '@tanstack/react-query';
import * as gameApi from '../api/game-api';

/**
 * Get leaderboard with sorting options
 * Bước 21 — Real API integration
 */
export function useLeaderboard(
  sort: 'ogn' | 'xp' | 'level' | 'harvests' = 'ogn',
  page = 1,
  limit = 20
) {
  return useQuery({
    queryKey: ['game', 'leaderboard', sort, page, limit],
    queryFn: () => gameApi.getLeaderboard(sort, page, limit),
    staleTime: 300_000,              // 5 phút — match BE cron interval (Step 24)
    refetchOnWindowFocus: true,      // auto refresh khi focus tab (Step 24)
    refetchInterval: false,          // không auto poll (cron handles freshness)
  });
}
