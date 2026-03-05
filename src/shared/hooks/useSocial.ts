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
 * Send friend request by friend ID or referral code
 * NOTE: BE now returns pending — target must accept. Do NOT invalidate friends list.
 */
export function useAddFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { friendId?: string; referralCode?: string }) =>
      gameApi.addFriend(data),

    retry: false,

    onSuccess: (data) => {
      console.log('[SOCIAL-DEBUG] useAddFriend.onSuccess:', data);
      useUIStore.getState().addToast('Đã gửi lời mời kết bạn! 📨', 'success', '👥');
      // Invalidate search so friendStatus updates to 'request_sent'
      queryClient.invalidateQueries({ queryKey: ['game', 'social', 'search'] });
      // Invalidate referral info (used referral code case)
      queryClient.invalidateQueries({ queryKey: ['game', 'social', 'referral'] });
    },

    onError: (error: any) => {
      const code = error?.code || '';
      const msg =
        code === 'ALREADY_FRIENDS' ? 'Đã là bạn bè rồi!' :
        code === 'REQUEST_ALREADY_SENT' ? 'Đã gửi lời mời rồi!' :
        code === 'THEY_SENT_REQUEST_FIRST' ? 'Họ đã gửi lời mời cho bạn, hãy chấp nhận!' :
        code === 'MAX_FRIENDS' ? 'Đã đạt giới hạn bạn bè!' :
        code === 'CANNOT_ADD_SELF' ? 'Không thể kết bạn với chính mình!' :
        code === 'REFERRAL_CODE_NOT_FOUND' ? 'Mã giới thiệu không tồn tại!' :
        error?.message || 'Gửi lời mời thất bại';
      useUIStore.getState().addToast(msg, 'warning', '⚠️');
    },
  });
}

/**
 * Get incoming pending friend requests
 */
export function useFriendRequests() {
  return useQuery({
    queryKey: ['game', 'social', 'friend-requests'],
    queryFn: () => gameApi.getFriendRequests(),
    staleTime: 30_000,
  });
}

/**
 * Search users by name — only fetches when q has at least 2 chars
 */
export function useSearchUsers(q: string) {
  return useQuery({
    queryKey: ['game', 'social', 'search', q],
    queryFn: () => gameApi.searchUsers(q),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });
}

/**
 * Accept an incoming pending friend request
 */
export function useAcceptFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fromId: string) => gameApi.acceptFriend(fromId),
    retry: false,

    onSuccess: () => {
      useUIStore.getState().addToast('Đã chấp nhận lời mời kết bạn!', 'success', '🎉');
      queryClient.invalidateQueries({ queryKey: ['game', 'social', 'friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['game', 'social', 'friends'] });
      queryClient.invalidateQueries({ queryKey: ['game', 'social', 'search'] });
    },

    onError: () => {
      useUIStore.getState().addToast('Không tìm thấy lời mời kết bạn', 'warning', '⚠️');
    },
  });
}

/**
 * Decline an incoming pending friend request
 */
export function useDeclineFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fromId: string) => gameApi.declineFriend(fromId),
    retry: false,

    onSuccess: () => {
      useUIStore.getState().addToast('Đã từ chối lời mời', 'info', '👋');
      queryClient.invalidateQueries({ queryKey: ['game', 'social', 'friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['game', 'social', 'search'] });
    },

    onError: () => {
      useUIStore.getState().addToast('Có lỗi xảy ra', 'warning', '⚠️');
    },
  });
}

/**
 * Remove an accepted friendship
 */
export function useUnfriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: string) => gameApi.unfriend(friendId),
    retry: false,

    onSuccess: () => {
      useUIStore.getState().addToast('Đã hủy kết bạn', 'info', '💔');
      queryClient.invalidateQueries({ queryKey: ['game', 'social', 'friends'] });
      queryClient.invalidateQueries({ queryKey: ['game', 'social', 'search'] });
    },

    onError: () => {
      useUIStore.getState().addToast('Có lỗi xảy ra', 'warning', '⚠️');
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
    mutationFn: (data: { friendId: string; type: 'water' | 'like' | 'gift'; data?: { giftId?: string } }) =>
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
