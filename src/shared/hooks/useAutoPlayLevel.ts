// ═══════════════════════════════════════════════════════════════
// useAutoPlayLevel — auto-play tier from API (B3 refactor)
// Previously localStorage; now synced with backend.
// Fallback: effectiveLevel=1 (free) if API fails — game never crashes.
// ═══════════════════════════════════════════════════════════════

import { useQuery } from '@tanstack/react-query';
import { autoPlayApi, type AutoPlayStatus } from '../api/api-autoplay';

export const AUTO_PLAY_STATUS_KEY = ['auto-play-status'] as const;

export function useAutoPlayLevel() {
  const { data, refetch, isLoading, error } = useQuery<AutoPlayStatus>({
    queryKey: AUTO_PLAY_STATUS_KEY,
    queryFn: () => autoPlayApi.getStatus(),
    staleTime: 5 * 60 * 1000,  // 5 min cache — level rarely changes mid-session
    retry: 1,
  });

  return {
    effectiveLevel: data?.effectiveLevel ?? 1,   // Fallback Lv1 on API error
    purchasedLevel: data?.purchasedLevel ?? null,
    rentedLevel: data?.rentedLevel ?? null,
    rentExpiresAt: data?.rentExpiresAt ?? null,
    daysUntilExpiry: data?.daysUntilExpiry ?? null,
    isLoading,
    error,
    refetch,
  };
}
