/**
 * useLevelInfo — TanStack Query hook for level info
 *
 * Fetches level progress, tier info, and level-up fee.
 * Used by LevelUpButton and FarmHeader.
 */
import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import type { LevelInfo } from '../types/game-api.types';

export const LEVEL_INFO_KEY = ['game', 'level-info'];

export function useLevelInfo() {
  return useQuery<LevelInfo>({
    queryKey: LEVEL_INFO_KEY,
    queryFn: () => gameApi.getLevelInfo(),
    staleTime: 10_000,     // 10s — needs to be fresh as XP changes often
    gcTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
