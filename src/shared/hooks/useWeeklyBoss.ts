import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import type { WeeklyBossInfo } from '../types/game-api.types';

export const WEEKLY_BOSS_KEY = ['game', 'weekly-boss'];

export function useWeeklyBoss() {
  return useQuery<WeeklyBossInfo>({
    queryKey: WEEKLY_BOSS_KEY,
    queryFn: () => gameApi.getWeeklyBoss(),
    staleTime: 5 * 60_000, // 5 min — doesn't change often
    refetchOnWindowFocus: false,
  });
}
