import { useQuery } from '@tanstack/react-query';
import { gameApi } from '@/shared/api/game-api';

export function useZoneBosses(zoneNumber: number) {
  return useQuery({
    queryKey: ['game', 'campaign', 'zone', zoneNumber],
    queryFn: () => gameApi.getZoneBosses(zoneNumber),
    enabled: zoneNumber > 0,
    staleTime: 30_000,
    retry: 2,
  });
}
