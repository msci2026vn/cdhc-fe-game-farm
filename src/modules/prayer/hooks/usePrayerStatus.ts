import { useQuery } from '@tanstack/react-query';
import { gameClient } from '@/shared/api/client';
import type { PrayerStatusResponse } from '../types/prayer.types';

export const PRAYER_STATUS_KEY = ['game', 'prayer', 'status'];

export function usePrayerStatus() {
  return useQuery<PrayerStatusResponse>({
    queryKey: PRAYER_STATUS_KEY,
    queryFn: () => gameClient.get<PrayerStatusResponse>('/api/prayer/status'),
    staleTime: 10_000,
    retry: 2,
    refetchOnWindowFocus: true,
  });
}
