import { useQuery } from '@tanstack/react-query';
import { worldBossApi } from '@/shared/api/api-world-boss';
import type { WorldBossData, WorldBossLiteData } from '../types/world-boss.types';

export const WORLD_BOSS_KEY = ['world-boss', 'current'] as const;
export const WORLD_BOSS_LITE_KEY = ['world-boss', 'lite'] as const;

/** Lobby polling — full data every 15s */
export function useWorldBoss() {
  return useQuery<WorldBossData>({
    queryKey: WORLD_BOSS_KEY,
    queryFn: worldBossApi.getCurrent,
    refetchInterval: (query) => {
      // If server error (5xx), slow down significantly to 60s
      if ((query.state.error as any)?.isServerError) return 60_000;
      if (query.state.error) return 10_000; // General error: 10s
      return 15_000;
    },
    refetchIntervalInBackground: false,
    staleTime: 5_000,
  });
}

/** Battle polling — lite data every 2s (1.5s when boss HP < 10%) */
export function useWorldBossLite(enabled: boolean) {
  const query = useQuery<WorldBossLiteData>({
    queryKey: WORLD_BOSS_LITE_KEY,
    queryFn: worldBossApi.getLite,
    refetchInterval: (query) => {
      // If server error (5xx), stop polling to avoid clutter
      if ((query.state.error as any)?.isServerError) return false;
      
      const hp = query.state.data?.hpPercent;
      if (hp !== undefined && hp < 0.1) return 1_000;
      return 2_000;
    },
    refetchIntervalInBackground: false,
    staleTime: 1_000,
    enabled,
    retry: (failureCount, error: any) => {
      if (error?.isServerError && failureCount >= 2) return false;
      return failureCount < 3;
    },
  });
  return query;
}
