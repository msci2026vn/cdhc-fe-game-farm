import { useQuery } from '@tanstack/react-query';
import { worldBossApi } from '@/shared/api/api-world-boss';
import type { WorldBossData } from '../types/world-boss.types';

export const WORLD_BOSS_KEY = ['world-boss', 'current'] as const;

export function useWorldBoss() {
  return useQuery<WorldBossData>({
    queryKey: WORLD_BOSS_KEY,
    queryFn: worldBossApi.getCurrent,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
    staleTime: 2000,
  });
}
