/**
 * useFriendFarm — Fetch friend's farm plots (view-only)
 *
 * Used in FriendGarden to display real farm data.
 * Growth is calculated client-side via useGrowthTimer.
 */
import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';

export function useFriendFarm(friendId: string | null) {
  return useQuery({
    queryKey: ['game', 'social', 'friend-farm', friendId],
    queryFn: () => gameApi.getFriendFarm(friendId!),
    enabled: !!friendId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });
}
