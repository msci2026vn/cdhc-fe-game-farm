import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';
import { useUIStore } from '../stores/uiStore';
import type { ConversionDirection } from '../types/game-api.types';

export const CONVERSION_TIERS_KEY = ['conversion', 'tiers'] as const;
export const CONVERSION_HISTORY_KEY = ['conversion', 'history'] as const;

/**
 * Fetch conversion tiers + status (balance, cooldown, limits)
 */
export function useConversionTiers(enabled = false) {
  return useQuery({
    queryKey: CONVERSION_TIERS_KEY,
    queryFn: () => gameApi.getConversionTiers(),
    staleTime: 10_000,
    enabled,
  });
}

/**
 * Fetch conversion history
 */
export function useConversionHistory(enabled = false, page = 1) {
  return useQuery({
    queryKey: [...CONVERSION_HISTORY_KEY, page],
    queryFn: () => gameApi.getConversionHistory(page, 5),
    staleTime: 10_000,
    enabled,
  });
}

/**
 * Mutation: convert seed↔ogn
 */
export function useConvert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ direction, tierId }: { direction: ConversionDirection; tierId: number }) => {
      return direction === 'seed_to_ogn'
        ? gameApi.convertSeedToOgn(tierId)
        : gameApi.convertOgnToSeed(tierId);
    },
    onSuccess: (data) => {
      const c = data.conversion;
      const dirLabel = c.direction === 'seed_to_ogn' ? 'Hạt → OGN' : 'OGN → Hạt';
      const toLabel = c.direction === 'seed_to_ogn'
        ? `${(c.toAmount / 100).toFixed(2)} OGN`
        : `${c.toAmount.toLocaleString('vi-VN')} Hạt`;
      useUIStore.getState().addToast(
        `${dirLabel}: +${toLabel}`,
        'success',
        '✅',
      );
      // Refresh tiers (balance + cooldown updated)
      queryClient.invalidateQueries({ queryKey: CONVERSION_TIERS_KEY });
      // Refresh history
      queryClient.invalidateQueries({ queryKey: CONVERSION_HISTORY_KEY });
      // Refresh player profile (OGN/Seed changed)
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });
    },
    onError: (err: any) => {
      useUIStore.getState().addToast(
        err.message || 'Lỗi chuyển đổi. Thử lại sau.',
        'error',
        '❌',
      );
    },
  });
}
