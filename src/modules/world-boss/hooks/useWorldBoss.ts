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
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });
}

/** Battle polling — lite data every 2s (1.5s when boss HP < 10%) */
export function useWorldBossLite(enabled: boolean) {
  const query = useQuery<WorldBossLiteData>({
    queryKey: WORLD_BOSS_LITE_KEY,
    queryFn: worldBossApi.getLite,
    refetchInterval: (query) => {
      const hp = query.state.data?.hpPercent;
      if (hp !== undefined && hp < 0.1) return 1_500;
      return 2_000;
    },
    refetchIntervalInBackground: false,
    staleTime: 1_000,
    enabled,
  });
  return query;
}
