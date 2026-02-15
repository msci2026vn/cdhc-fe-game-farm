/**
 * useBossStatus — TanStack Query hook for boss fight status
 *
 * Fetches daily fights used, cooldown remaining.
 * Auto-refetches every 30s for countdown accuracy.
 */
import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import type { BossStatus } from '../types/game-api.types';

export const BOSS_STATUS_KEY = ['game', 'boss', 'status'];

export function useBossStatus() {
  return useQuery<BossStatus>({
    queryKey: BOSS_STATUS_KEY,
    queryFn: () => gameApi.getBossStatus(),
    staleTime: 10_000,        // 10s
    gcTime: 60_000,
    refetchInterval: 30_000,  // Auto-refetch every 30s (for countdown)
    refetchOnWindowFocus: true,
  });
}
