import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';
import { useUIStore } from '../stores/uiStore';

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

/**
 * Get friends list with interaction status
 */
export function useFriends() {
  return useQuery({
    queryKey: ['game', 'social', 'friends'],
    queryFn: () => gameApi.getFriends(),
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Get referral info including referred users and commission stats
 */
export function useReferralInfo() {
  return useQuery({
    queryKey: ['game', 'social', 'referral'],
    queryFn: () => gameApi.getReferralInfo(),
    staleTime: 30_000, // 30 seconds
  });
}

// ═══════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Add friend by friend ID or referral code
 */
export function useAddFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { friendId?: string; referralCode?: string }) =>
      gameApi.addFriend(data),

    retry: false, // Don't retry failed friend additions

    onSuccess: (data) => {
      console.log('[SOCIAL-DEBUG] useAddFriend.onSuccess:', data);

      // Toast notification
      useUIStore.getState().addToast('Đã kết bạn thành công!', 'success', '👋');

      // Invalidate friends list
      queryClient.invalidateQueries({ queryKey: ['game', 'social', 'friends'] });
      // Invalidate referral info
      queryClient.invalidateQueries({ queryKey: ['game', 'social', 'referral'] });
    },
  });
}

/**
 * Interact with friend's garden (water/like/gift)
 * Both users receive +5 OGN on successful interaction
 */
export function useInteractFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { friendId: string; type: 'water' | 'like' | 'comment' | 'gift'; data?: { comment?: string; giftId?: string } }) =>
      gameApi.interactFriend(data.friendId, data.type, data.data),

    retry: false, // Don't retry interactions

    onSuccess: (result, variables) => {
      console.log('[SOCIAL-DEBUG] useInteractFriend.onSuccess:', result);

      // Toast notification
      useUIStore.getState().addToast(
        `Đã thăm vườn bạn! +${result.ognGain || 0} OGN`,
        'success',
        '👋'
      );

      // Invalidate profile for server truth (OGN will update from query)
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });
      // Invalidate friends list to update interaction status
      queryClient.invalidateQueries({ queryKey: ['game', 'social', 'friends'] });
    },

    onError: (error: any) => {
      const code = error?.code || error?.message || '';
      const msg = code === 'ALREADY_INTERACTED_TODAY' ? 'Đã tương tác hôm nay!'
        : code === 'DAILY_LIMIT' ? 'Đã đạt giới hạn hôm nay!'
        : code === 'NOT_FRIENDS' ? 'Chưa kết bạn!'
        : 'Lỗi khi tương tác';

      // Toast notification
      useUIStore.getState().addToast(msg, 'warning', '⚠️');

      console.error('[FARM-DEBUG] interact error:', code, '-', msg);
    },
  });
}
