import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameClient } from '@/shared/api/client';
import { useUIStore } from '@/shared/stores/uiStore';
import { PLAYER_PROFILE_KEY } from '@/shared/hooks/usePlayerProfile';
import { PRAYER_STATUS_KEY } from './usePrayerStatus';
import type { PrayerOfferPayload, PrayerOfferResponse } from '../types/prayer.types';

export function usePrayerOffer() {
  const queryClient = useQueryClient();

  return useMutation<PrayerOfferResponse, Error, PrayerOfferPayload>({
    mutationFn: (data) => gameClient.post<PrayerOfferResponse>('/prayer/offer', data),

    onSuccess: (data) => {
      // Toast
      const rewardText: string[] = [];
      if (data.ognReward > 0) rewardText.push(`+${data.ognReward} OGN`);
      if (data.xpReward > 0) rewardText.push(`+${data.xpReward} XP`);
      const msg = rewardText.length > 0
        ? `${rewardText.join(', ')}`
        : 'Cầu nguyện thành công!';

      useUIStore.getState().addToast(msg, 'success', '🙏');

      // FlyUp
      if (data.ognReward > 0) {
        useUIStore.getState().showFlyUp(`+${data.ognReward} OGN 🪙`);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: PRAYER_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });
      queryClient.invalidateQueries({ queryKey: ['game', 'prayer', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['game', 'prayer', 'leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['game', 'prayer', 'global'] });
    },

    onError: (error: any) => {
      const msg = error?.message || 'Đã xảy ra lỗi';
      useUIStore.getState().addToast(msg, 'error');
    },
  });
}
