import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import type { PlayerProfile } from '../api/game-api.types';

export function usePlayerProfile() {
  return useQuery<PlayerProfile | null>({
    queryKey: ['game', 'profile'],
    queryFn: () => gameApi.getProfile(),
    staleTime: 30_000,     // 30s — không refetch nếu data còn mới
    retry: 2,              // Retry 2 lần nếu fail
    refetchOnWindowFocus: true, // Refetch khi quay lại tab
  });
}
