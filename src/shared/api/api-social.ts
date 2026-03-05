// ═══════════════════════════════════════════════════════════════
// API SOCIAL — Friends, interactions, referrals, sync
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type {
  FriendData,
  FriendsResult,
  InteractType,
  FriendFarmData,
  ReferralInfoResult,
  SyncResult,
  FriendRequestsResult,
  SearchUsersResult,
  FriendActionResult,
  AddFriendPendingResult,
} from '../types/game-api.types';

export const socialApi = {
  /**
   * Get friends list (bước 20 — real API)
   */
  getFriends: async (): Promise<FriendsResult> => {
    const url = API_BASE_URL + '/api/game/social/friends';
    console.log('[FARM-DEBUG] gameApi.getFriends():', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getFriends() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getFriends');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getFriends() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to fetch friends: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getFriends() SUCCESS:', json);

    // Map backend fields → FriendData (BE returns friendId/picture, FE expects id/avatar)
    const raw = json.data?.friends || [];
    const friends = raw.map((f: Record<string, unknown>) => ({
      id: f.friendId || f.id,
      name: (f.name as string) || 'Unknown',
      avatar: (f.picture as string) || null,
      level: (f.level as number) ?? 1,
      title: (f.title as string) || '',
      online: (f.online as boolean) ?? false,
      plantCount: (f.plantCount as number) ?? 0,
      totalHarvest: (f.totalHarvest as number) ?? 0,
      ogn: (f.ogn as number) ?? 0,
    }));

    return { friends, myReferralCode: json.data?.myReferralCode || '' };
  },

  /**
   * Interact with friend's garden (bước 20 — real API)
   * BE Zod: { friendId: string uuid, type: enum['water','like','gift'] }
   */
  interactFriend: async (
    friendId: string,
    type: InteractType,
    data?: { comment?: string; giftId?: string }
  ): Promise<{ success: boolean; ognGain: number; xpGain: number; friendOgnGain: number; dailyCount: number; dailyLimit: number }> => {
    const url = API_BASE_URL + '/api/game/social/interact';
    console.log('[FARM-DEBUG] gameApi.interactFriend():', { url, friendId, type, data });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId, type, data }),
    });

    console.log('[FARM-DEBUG] gameApi.interactFriend() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('interactFriend');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.interactFriend() ERROR:', error);
      const err = new Error(error?.error?.message || `Failed to interact: ${response.status}`);
      (err as any).code = error?.error?.code;
      throw err;
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.interactFriend() SUCCESS:', json);
    return json.data;
  },

  /**
   * Send friend request by friend ID or referral code (2026-03-05 — pending flow)
   * BE Zod: { friendId?: string uuid, referralCode?: string }
   * NOTE: BE now returns pending status — target must accept to confirm.
   */
  addFriend: async (
    data: { friendId?: string; referralCode?: string }
  ): Promise<AddFriendPendingResult> => {
    const url = API_BASE_URL + '/api/game/social/add-friend';
    console.log('[FARM-DEBUG] gameApi.addFriend():', { url, data });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    console.log('[FARM-DEBUG] gameApi.addFriend() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('addFriend');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.addFriend() ERROR:', error);
      const err = new Error(error?.error?.message || `Failed to add friend: ${response.status}`);
      (err as any).code = error?.error?.code;
      throw err;
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.addFriend() SUCCESS:', json);
    return json.data;
  },

  /**
   * Get friend's farm (view-only) — plots + friend info
   */
  getFriendFarm: async (friendId: string): Promise<FriendFarmData> => {
    const url = `${API_BASE_URL}/api/game/social/friend-farm/${friendId}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getFriendFarm');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Get referral info including referred users and commission stats (bước 20 — real API)
   */
  getReferralInfo: async (): Promise<ReferralInfoResult> => {
    const url = API_BASE_URL + '/api/game/social/referral';
    console.log('[FARM-DEBUG] gameApi.getReferralInfo():', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getReferralInfo() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getReferralInfo');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getReferralInfo() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to get referral info: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getReferralInfo() SUCCESS:', json);
    return json.data;
  },

  /**
   * Get incoming pending friend requests (2026-03-05)
   */
  getFriendRequests: async (): Promise<FriendRequestsResult> => {
    const url = API_BASE_URL + '/api/game/social/friend-requests';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getFriendRequests');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error?.message || `Failed to get friend requests: ${response.status}`);
    }

    const json = await response.json();
    // Map BE fields → FE FriendRequest type
    // BE: fromUserId, fromUserName, fromUserPicture, fromUserLevel
    // FE: fromId, fromName, fromPicture, fromLevel
    const raw = json.data?.requests ?? [];
    const requests = raw.map((r: Record<string, unknown>) => ({
      fromId:      r.fromUserId,
      fromName:    (r.fromUserName as string) || 'Unknown',
      fromPicture: (r.fromUserPicture as string) ?? null,
      fromLevel:   (r.fromUserLevel as number) ?? 1,
      createdAt:   r.createdAt as string,
    }));
    return { requests };
  },

  /**
   * Search users by name, returns friendStatus for each result (2026-03-05)
   */
  searchUsers: async (q: string, limit = 20): Promise<SearchUsersResult> => {
    const params = new URLSearchParams({ q, limit: String(limit) });
    const url = `${API_BASE_URL}/api/game/social/search?${params}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('searchUsers');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error?.message || `Failed to search users: ${response.status}`);
    }

    const json = await response.json();
    // BE returns { userId, name, picture, level, friendStatus }
    // Map userId → id to match UserSearchResult interface
    const raw = json.data?.results ?? [];
    const results = raw.map((u: Record<string, unknown>) => ({
      id: u.userId,
      name: u.name,
      picture: u.picture ?? null,
      level: u.level ?? 1,
      friendStatus: u.friendStatus ?? 'none',
    }));
    return { results, total: json.data?.total ?? results.length };
  },

  /**
   * Accept an incoming pending friend request (2026-03-05)
   */
  acceptFriend: async (fromId: string): Promise<FriendActionResult> => {
    const url = `${API_BASE_URL}/api/game/social/accept-friend/${fromId}`;

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('acceptFriend');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const err = new Error(error?.error?.message || `Failed to accept friend: ${response.status}`);
      (err as any).code = error?.error?.code;
      throw err;
    }

    const json = await response.json();
    // BE returns { friendId, friendName, message } — normalize to FriendActionResult
    return { message: json.data?.message ?? '', success: true };
  },

  /**
   * Decline an incoming pending friend request (2026-03-05)
   */
  declineFriend: async (fromId: string): Promise<FriendActionResult> => {
    const url = `${API_BASE_URL}/api/game/social/decline-friend/${fromId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('declineFriend');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const err = new Error(error?.error?.message || `Failed to decline friend: ${response.status}`);
      (err as any).code = error?.error?.code;
      throw err;
    }

    const json = await response.json();
    // BE returns { message } — normalize to FriendActionResult
    return { message: json.data?.message ?? '', success: true };
  },

  /**
   * Remove an accepted friendship (2026-03-05)
   */
  unfriend: async (friendId: string): Promise<FriendActionResult> => {
    const url = `${API_BASE_URL}/api/game/social/unfriend/${friendId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('unfriend');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const err = new Error(error?.error?.message || `Failed to unfriend: ${response.status}`);
      (err as any).code = error?.error?.code;
      throw err;
    }

    const json = await response.json();
    // BE returns { message } — normalize to FriendActionResult
    return { message: json.data?.message ?? '', success: true };
  },

  /**
   * Sync batched actions — reduce API calls from ~50/min to ~2/min
   * (Bước 22 — Player Sync)
   */
  syncActions: async (actions: Array<{ type: 'bug_catch' | 'xp_pickup' | 'daily_check'; count: number; timestamp: number }>): Promise<SyncResult> => {
    const url = API_BASE_URL + '/api/game/player/sync';
    console.log('[FARM-DEBUG] gameApi.syncActions():', { url, actionCount: actions.length });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actions, clientTime: Date.now() }),
    });

    console.log('[FARM-DEBUG] gameApi.syncActions() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('syncActions');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.syncActions() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to sync: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.syncActions() SUCCESS:', json);
    return json.data;
  },
};
