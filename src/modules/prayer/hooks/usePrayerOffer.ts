import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameClient } from '@/shared/api/client';
import { useUIStore } from '@/shared/stores/uiStore';
import { PLAYER_PROFILE_KEY } from '@/shared/hooks/usePlayerProfile';
import { PRAYER_STATUS_KEY } from './usePrayerStatus';
import type { PrayerOfferPayload, PrayerOfferResponse } from '../types/prayer.types';

export function usePrayerOffer() {
  const queryClient = useQueryClient();

  return useMutation<PrayerOfferResponse, Error, PrayerOfferPayload>({
    mutationFn: (data) => gameClient.post<PrayerOfferResponse>('/api/prayer/offer', data),

    onSuccess: (data) => {
      // Toast
      const rewardText: string[] = [];
      if (data.ognReward > 0) rewardText.push(`+${data.ognReward} OGN`);
      if (data.xpReward > 0) rewardText.push(`+${data.xpReward} XP`);
      const msg = rewardText.length > 0
        ? `${rewardText.join(', ')}`
        : 'Cầu nguyện thành công!';

      useUIStore.getState().addToast(msg, 'success', '🙏');

      // [PRAYER-BLOCKCHAIN v2] Blockchain confirmation toast for custom prayers
      if (data.txHash && data.snowscanUrl) {
        // Ghi blockchain thành công — hiện link Snowtrace
        import('sonner').then(({ toast }) => {
          toast.success('🌟 Đã ghi vĩnh viễn trên Avalanche blockchain', {
            description: `TX: ${data.txHash!.slice(0, 10)}...${data.txHash!.slice(-6)}`,
            action: {
              label: '🔗 Xem Snowtrace',
              onClick: () => window.open(data.snowscanUrl!, '_blank'),
            },
            duration: 8000,
          });
        });
      } else if (data.blockchainWarning) {
        // [PRAYER-BLOCKCHAIN v2] Prayer đã lưu DB nhưng blockchain lỗi tạm — hiện warning nhỏ
        import('sonner').then(({ toast }) => {
          toast.warning('⚠️ Lời cầu nguyện đã lưu', {
            description: data.blockchainWarning!,
            duration: 6000,
          });
        });
      }

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
