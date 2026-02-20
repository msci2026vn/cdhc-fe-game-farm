import { useQuery } from '@tanstack/react-query';
import { gameClient } from '@/shared/api/client';
import type { PrayerGlobalResponse } from '../types/prayer.types';

export function usePrayerGlobal() {
  return useQuery<PrayerGlobalResponse>({
    queryKey: ['game', 'prayer', 'global'],
    queryFn: () => gameClient.get<PrayerGlobalResponse>('/api/prayer/global'),
    staleTime: 30_000,
    retry: 2,
  });
}
