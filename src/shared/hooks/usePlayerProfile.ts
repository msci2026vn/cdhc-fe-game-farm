import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import type { PlayerProfile } from '../api/game-api.types';

// Query key dùng chung — khi cần invalidate từ mutations
export const PLAYER_PROFILE_KEY = ['game', 'profile'] as const;

export function usePlayerProfile() {
  return useQuery<PlayerProfile | null>({
    queryKey: PLAYER_PROFILE_KEY,
    queryFn: () => gameApi.getProfile(),
    staleTime: 30_000,     // 30s — không refetch nếu data còn mới
    retry: 2,              // Retry 2 lần nếu fail
    refetchOnWindowFocus: true, // Refetch khi quay lại tab
  });
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE HOOKS — Single source of truth from TanStack Query
// ═══════════════════════════════════════════════════════════════

/**
 * Get OGN balance — uses TanStack Query cache
 */
export function useOgn(): number {
  const { data } = usePlayerProfile();
  return data?.ogn ?? 0;
}

/**
 * Get XP total — uses TanStack Query cache
 */
export function useXp(): number {
  const { data } = usePlayerProfile();
  return data?.xp ?? 0;
}

/**
 * Get player level — uses TanStack Query cache
 */
export function useLevel(): number {
  const { data } = usePlayerProfile();
  return data?.level ?? 1;
}

/**
 * Invalidate profile query — call this after mutations that change OGN/XP/Level
 */
export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });
}

/**
 * Set profile data optimistically — for instant UI updates
 */
export function useSetProfileData() {
  const queryClient = useQueryClient();
  return (updater: (old: PlayerProfile | null | undefined) => PlayerProfile | null | undefined) => {
    queryClient.setQueryData(PLAYER_PROFILE_KEY, updater);
  };
}
