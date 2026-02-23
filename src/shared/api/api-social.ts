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
   * BE Zod: { friendId: string uuid, type: enum['water','like','comment','gift'], data?: { comment?, giftId? } }
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
   * Add friend by friend ID or referral code (bước 20 — real API)
   * BE Zod: { friendId?: string uuid, referralCode?: string }
   */
  addFriend: async (
    data: { friendId?: string; referralCode?: string }
  ): Promise<{ friend: FriendData; referralCode: string }> => {
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
