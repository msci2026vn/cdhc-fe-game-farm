import { useQuery } from '@tanstack/react-query';
import { gameClient } from '@/shared/api/client';
import type { PrayerLeaderboardEntry } from '../types/prayer.types';

export function usePrayerLeaderboard(limit: number = 20) {
  return useQuery<PrayerLeaderboardEntry[]>({
    queryKey: ['game', 'prayer', 'leaderboard'],
    queryFn: () => gameClient.get<PrayerLeaderboardEntry[]>(`/api/prayer/leaderboard?limit=${limit}`),
    staleTime: 60_000,
    retry: 2,
  });
}
