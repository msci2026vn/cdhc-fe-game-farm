import { useQuery } from '@tanstack/react-query';
import { gameClient } from '@/shared/api/client';
import type { PrayerPreset } from '../types/prayer.types';

export function usePrayerPresets(category?: string) {
  return useQuery<PrayerPreset[]>({
    queryKey: ['game', 'prayer', 'presets', category || 'all'],
    queryFn: () => {
      const params = category ? `?category=${category}&limit=20` : '?limit=20';
      return gameClient.get<PrayerPreset[]>(`/prayer/presets${params}`);
    },
    staleTime: 60_000,
    retry: 2,
  });
}
