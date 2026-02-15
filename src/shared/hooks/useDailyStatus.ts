/**
 * useDailyStatus — TanStack Query hook for daily status
 *
 * Fetches daily XP usage, boss fights, sync caps.
 * Auto-refetches every 60s.
 */
import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import type { DailyStatus } from '../types/game-api.types';

export const DAILY_STATUS_KEY = ['game', 'daily-status'];

export function useDailyStatus() {
  return useQuery<DailyStatus>({
    queryKey: DAILY_STATUS_KEY,
    queryFn: () => gameApi.getDailyStatus(),
    staleTime: 30_000,        // 30s
    gcTime: 120_000,
    refetchInterval: 60_000,  // Auto-refetch every 60s
    refetchOnWindowFocus: true,
  });
}
