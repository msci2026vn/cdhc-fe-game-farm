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
    staleTime: 30_000, // 30s — match BE cache TTL
  });
}
