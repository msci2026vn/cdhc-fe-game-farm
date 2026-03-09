import { useQuery } from '@tanstack/react-query';
import { gameClient } from '@/shared/api/client';
import type { PrayerHistoryItem } from '../types/prayer.types';

export function usePrayerHistory(page: number = 1) {
  return useQuery<PrayerHistoryItem[]>({
    queryKey: ['game', 'prayer', 'history', page],
    queryFn: () => gameClient.get<PrayerHistoryItem[]>(`/api/prayer/history?page=${page}&limit=20`),
    staleTime: 30_000,
    retry: 2,
  });
}
