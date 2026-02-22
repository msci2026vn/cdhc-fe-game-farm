// ═══════════════════════════════════════════════════════════════
// GAME API - All game-related API calls
// ═══════════════════════════════════════════════════════════════

import { gameClient } from './client';
import { mapBackendWeatherToGameWeather } from '../utils/weatherMapper';
import { queryClient } from '../lib/queryClient';
import { API_BASE_URL } from '../utils/constants';

// ═══════════════════════════════════════════════════════════════
// GLOBAL 401 HANDLER — Single source of truth for session expiry
// ═══════════════════════════════════════════════════════════════
let isRedirecting = false;

/**
 * Reset redirect lock — call after successful login so future 401s
 * can trigger redirect again.
 */
export function resetRedirectLock() {
  isRedirecting = false;
}

function handleUnauthorized(context: string = 'API') {
  if (isRedirecting) return; // Prevent multiple redirects
  isRedirecting = true;

  console.warn(`[GameAPI] 401 Unauthorized in ${context} — redirecting to login`);

  // ⚠️ FIX: Do NOT call queryClient.clear() here!
  // clear() wipes ALL cached data, causing every active hook to refetch.
  // Those refetches also hit 401 → creating a cascade of redirects.
  // Instead, only cancel active queries to stop background refetches,
  // then invalidate auth so components know session is gone.
  try {
    queryClient.cancelQueries();                      // Stop all in-flight + auto-refetches
    queryClient.setQueryData(['auth', 'status'], {    // Immediately mark as logged-out
      isLoggedIn: false, user: null
    });
  } catch (_) { /* ignore */ }

  // Show toast notification (if available)
  try {
    const toastEvent = new CustomEvent('session-expired', {
      detail: { message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' }
    });
    window.dispatchEvent(toastEvent);
  } catch (e) {
    // Ignore if toast not available
  }

  // Redirect to login after a short delay to show toast
  setTimeout(() => {
    window.location.href = '/login';
  }, 800);
}
import type { ApiResponse } from '../types/common';
import type {
  PlayerProfile,
  FarmPlotData,
  WaterResult,
  HarvestResult,
  ClearResult,
  BossFightInput,
  BossCompleteResult,
  QuizStartResult,
  QuizAnswerInput,
  QuizAnswerResult,
  ShopItemData,
  BuyResult,
  FriendData,
  FriendsResult,
  AddFriendResult,
  ReferralInfoResult,
  LeaderboardResult,
  SyncAction,
  SyncResult,
  PingResult,
  AuthStatus,
  PlantTypeId,
  QuizAnswer,
  InteractType,
  WeatherData,
  // Inventory types
  InventoryResponse,
  SellResult,
  SellAllResult,
  OgnHistoryResult,
  // Friend farm
  FriendFarmData,
  // Economy v2
  LevelInfo,
  LevelUpResult,
  DailyStatus,
  BossStatus,
  // Stat system (Phase 2)
  StatInfo,
  AllocateStatsRequest,
  AllocateStatsResponse,
  ResetStatsResponse,
  AutoSettingRequest,
  // Weekly boss (Phase 4)
  WeeklyBossInfo,
  // Conversion
  ConversionStatus,
  ConversionSuccessResult,
  ConversionHistoryResult,
  // VIP
  VipPlan,
  VipStatus,
  VipOrder,
  VipVerifyResult,
  VipOrderStatus,
} from '../types/game-api.types';

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLER HELPER
// ═══════════════════════════════════════════════════════════════
async function handleApiError(response: Response): Promise<never> {
  // Handle 401 globally — redirect to login
  if (response.status === 401) {
    handleUnauthorized('API call');
    throw new Error('Session expired');
  }

  const errorData = await response.json().catch(() => ({}));
  const err = new Error(errorData?.error?.message || `API Error: ${response.status}`);
  (err as any).status = response.status;
  (err as any).code = errorData?.error?.code || 'UNKNOWN';
  (err as any).cooldownRemaining = errorData?.error?.cooldownRemaining;

  console.log('[FARM-DEBUG] handleApiError()', JSON.stringify({
    status: response.status,
    code: (err as any).code,
    message: err.message,
    cooldownRemaining: (err as any).cooldownRemaining,
  }));

  throw err;
}

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS (16 total)
// ═══════════════════════════════════════════════════════════════

export const gameApi = {
  // ═══ PLAYER ═══
  /**
   * Get player profile (bước 9 — real API)
   */
  getProfile: async (): Promise<PlayerProfile | null> => {
    try {
      const response = await fetch(API_BASE_URL + '/api/game/player/profile', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        // Session expired — redirect to login
        handleUnauthorized('getProfile');
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      return json.data; // { userId, xp, level, ogn, ... }
    } catch (error) {
      console.error('[GameAPI] getProfile failed:', error);
      return null;
    }
  },

  // ═══ FARM ═══
  /**
   * Get all farm plots (bước 12 — real API)
   */
  getPlots: async () => {
    const url = API_BASE_URL + '/api/game/farm/plots';
    console.log('[FARM-DEBUG] gameApi.getPlots: Calling', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getPlots: Response status =', response.status);

    if (response.status === 401) {
      handleUnauthorized('getPlots');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getPlots: ERROR =', error);
      throw new Error(error?.error?.message || `Failed to fetch plots: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getPlots: Response data =', json);
    return json.data; // { plots: [...], totalSlots: 6 }
  },

  /**
   * Plant a seed in a slot (bước 13 — real API)
   * BE Zod: { plantTypeId: enum['tomato','carrot','chili','wheat'], slotIndex: int 0-5 }
   */
  plantSeed: async (
    slotIndex: number,
    plantTypeId: PlantTypeId
  ): Promise<{ plot: FarmPlotData; ognRemaining: number; plantType: { name: string; emoji: string; growthDurationMs: number } }> => {
    const url = API_BASE_URL + '/api/game/farm/plant';
    console.log('[FARM-DEBUG] gameApi.plantSeed:', { url, slotIndex, plantTypeId });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotIndex, plantTypeId }),
    });

    console.log('[FARM-DEBUG] gameApi.plantSeed status:', response.status);

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.plantSeed data:', json);
    return json.data;
  },

  /**
   * Water a plot (bước 14 — real API)
   * BE Zod: { plotId: string uuid }
   */
  waterPlot: async (plotId: string): Promise<WaterResult> => {
    const url = API_BASE_URL + '/api/game/farm/water';
    const body = { plotId };

    console.log('[FARM-DEBUG] gameApi.waterPlot() — REQUEST', JSON.stringify({ url, plotId }));

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('[FARM-DEBUG] gameApi.waterPlot() — STATUS:', response.status);

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.waterPlot() — SUCCESS:', JSON.stringify(json.data));
    return json.data;
  },

  /**
   * Harvest a plot (bước 15 — real API)
   * BE Zod: { plotId: string uuid }
   */
  harvestPlot: async (plotId: string): Promise<HarvestResult> => {
    const url = API_BASE_URL + '/api/game/farm/harvest';
    const body = { plotId };

    console.log('[FARM-DEBUG] gameApi.harvestPlot() — REQUEST', JSON.stringify({ url, plotId }));

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('[FARM-DEBUG] gameApi.harvestPlot() — STATUS:', response.status);

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.harvestPlot() — SUCCESS:', JSON.stringify(json.data));
    return json.data;
  },

  /**
   * Clear dead plot (bước 23 — real API)
   * BE Zod: { plotId: string uuid }
   */
  clearPlot: async (plotId: string): Promise<{ cleared: boolean; plotId: string; slotIndex: number }> => {
    const url = API_BASE_URL + '/api/game/farm/clear';
    const body = { plotId };

    console.log('[FARM-DEBUG] gameApi.clearPlot() — REQUEST', JSON.stringify({ url, plotId }));

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('[FARM-DEBUG] gameApi.clearPlot() — STATUS:', response.status);

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.clearPlot() — SUCCESS:', JSON.stringify(json.data));
    return json.data;
  },

  // ═══ BOSS ═══
  /**
   * Complete boss fight (bước 17 — real API)
   * BE Zod: { bossId: string, won: boolean, totalDamage: int 0-100000, durationSeconds: 0-3600 }
   */
  completeBoss: async (data: BossFightInput): Promise<BossCompleteResult> => {
    const url = API_BASE_URL + '/api/game/boss/complete';
    const timestamp = new Date().toISOString();
    console.log('[FARM-DEBUG] gameApi.completeBoss() — START', JSON.stringify({
      url,
      bossId: data.bossId,
      won: data.won,
      damage: data.totalDamage,
      timestamp,
      credentials: 'include',
      documentCookie: document.cookie || '(empty - httpOnly)',
    }));

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    console.log('[FARM-DEBUG] gameApi.completeBoss() status:', response.status);
    console.log('[FARM-DEBUG] gameApi.completeBoss() response headers:', {
      'set-cookie': response.headers.get('set-cookie'),
      'content-type': response.headers.get('content-type'),
    });

    if (response.status === 401) {
      handleUnauthorized('completeBoss');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.completeBoss() ERROR:', error);
      const err = new Error(error?.error?.message || `Failed to complete boss: ${response.status}`);
      (err as any).status = response.status;
      (err as any).code = error?.error?.code;
      throw err;
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.completeBoss() SUCCESS:', json);
    return json.data;
  },

  /**
   * Get boss progress (bước 17 — real API)
   */
  getBossProgress: async () => {
    const url = API_BASE_URL + '/api/game/boss/progress';
    console.log('[FARM-DEBUG] gameApi.getBossProgress():', url);

    const response = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getBossProgress() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getBossProgress');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getBossProgress() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to get boss progress: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getBossProgress() SUCCESS:', json);
    return json.data;
  },

  // ═══ QUIZ ═══
  /**
   * Start a quiz session (bước 18 — real API)
   * Server returns 5 random questions WITHOUT correctAnswer
   */
  startQuiz: async (): Promise<QuizStartResult> => {
    const url = API_BASE_URL + '/api/game/quiz/start';
    console.log('[FARM-DEBUG] gameApi.startQuiz():', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.startQuiz() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('startQuiz');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.startQuiz() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to start quiz: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.startQuiz() SUCCESS:', json);
    return json.data;
  },

  /**
   * Answer a quiz question (bước 18 — real API)
   * Server validates answer and returns rewards
   */
  answerQuiz: async (input: QuizAnswerInput): Promise<QuizAnswerResult> => {
    const url = API_BASE_URL + '/api/game/quiz/answer';
    console.log('[FARM-DEBUG] gameApi.answerQuiz():', { url, ...input });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    console.log('[FARM-DEBUG] gameApi.answerQuiz() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('answerQuiz');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.answerQuiz() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to submit answer: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.answerQuiz() SUCCESS:', json);
    return json.data;
  },

  // ═══ SHOP ═══
  /**
   * Get shop items and inventory (bước 19 — real API)
   */
  getShopItems: async (): Promise<{ items: ShopItemData[] }> => {
    const url = API_BASE_URL + '/api/game/shop/items';
    console.log('[FARM-DEBUG] gameApi.getShopItems():', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getShopItems() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getShopItems');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getShopItems() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to fetch shop items: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getShopItems() SUCCESS:', json);
    return json.data;
  },

  /**
   * Buy an item from shop (bước 19 — real API)
   * BE Zod: { itemId: string, quantity?: int 1-99, default 1 }
   */
  buyItem: async (itemId: string, quantity?: number): Promise<BuyResult> => {
    const url = API_BASE_URL + '/api/game/shop/buy';
    console.log('[FARM-DEBUG] gameApi.buyItem():', { url, itemId, quantity });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, quantity: quantity || 1 }),
    });

    console.log('[FARM-DEBUG] gameApi.buyItem() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('buyItem');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.buyItem() ERROR:', error);
      const err = new Error(error?.error?.message || `Failed to buy item: ${response.status}`);
      (err as any).code = error?.error?.code;
      throw err;
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.buyItem() SUCCESS:', json);
    return json.data;
  },

  // ═══ SOCIAL ═══
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

  // ═══ LEADERBOARD ═══
  /**
   * Get leaderboard (bước 21 — real API)
   */
  getLeaderboard: async (
    sort: 'ogn' | 'xp' | 'level' | 'harvests' = 'ogn',
    page = 1,
    limit = 20
  ): Promise<LeaderboardResult> => {
    const url = `${API_BASE_URL}/api/game/leaderboard?sort=${sort}&page=${page}&limit=${limit}`;
    console.log('[FARM-DEBUG] gameApi.getLeaderboard():', { url, sort, page, limit });

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getLeaderboard() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getLeaderboard');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getLeaderboard() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to fetch leaderboard: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getLeaderboard() SUCCESS:', {
      total: json.data.total,
      myRank: json.data.myRank,
      sort: json.data.sort,
    });
    return json.data;
  },

  // ═══ HEALTH CHECK ═══
  /**
   * Health check - test auth chain (bước 8)
   * Success = route + auth + CORS + cookie ALL work
   */
  ping: async (): Promise<PingResult> => {
    try {
      const res = await fetch(API_BASE_URL + '/api/game/ping', {
        method: 'GET',
        credentials: 'include', // ← BẮT BUỘC — gửi cookie cross-subdomain
        headers: { 'Accept': 'application/json' },
      });

      if (res.status === 401) {
        // Session expired — redirect to login
        handleUnauthorized('ping');
        return { success: false, message: 'Unauthorized — cần đăng nhập' };
      }

      if (res.status === 403) {
        return { success: false, message: 'Forbidden — tài khoản chưa được duyệt' };
      }

      if (!res.ok) {
        return { success: false, message: `HTTP ${res.status}` };
      }

      const result: ApiResponse<{ message: string; userId: string; email: string; timestamp: string }> = await res.json();
      if (!result.success) {
        return { success: false, message: result.message || 'API Error' };
      }

      return {
        success: true,
        message: result.data.message,
      };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  },

  /**
   * Logout — xóa session cookie phía server, redirect về /login
   */
  logout: async (): Promise<void> => {
    try {
      await fetch(API_BASE_URL + '/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.warn('[GameAPI] logout request failed:', error);
    }
    // Dù API thành công hay thất bại, luôn redirect về login
    window.location.href = '/login';
  },

  /**
   * Get auth status - Check if user is logged in
   * Bước 10 — REAL API: Calls /api/auth/me
   */
  getAuthStatus: async (): Promise<AuthStatus> => {
    try {
      const response = await fetch(API_BASE_URL + '/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        // Don't redirect here - this is used to check auth status initially
        // The caller (AuthGuard) will handle the redirect
        return { isLoggedIn: false, user: null };
      }

      if (!response.ok) {
        console.error('[GameAPI] getAuthStatus failed:', response.status);
        return { isLoggedIn: false, user: null };
      }

      const json = await response.json();
      if (!json.success) {
        return { isLoggedIn: false, user: null };
      }

      // Return user data
      return {
        isLoggedIn: true,
        user: json.data || json.user || null,
      };
    } catch (error) {
      console.error('[GameAPI] getAuthStatus error:', error);
      return { isLoggedIn: false, user: null };
    }
  },

  // ═══ WEATHER ═══
  /**
   * Get weather data by GPS coordinates
   * Bước 31 — Weather/GPS Integration
   * @param lat - Latitude (optional, uses cached GPS if not provided)
   * @param lon - Longitude (optional, uses cached GPS if not provided)
   */
  getWeather: async (lat?: number, lon?: number) => {
    let url = API_BASE_URL + '/api/weather/location';

    // Add lat/lon if provided
    if (lat !== undefined && lon !== undefined) {
      url += `?lat=${lat}&lon=${lon}`;
    }

    console.log('[FARM-DEBUG] gameApi.getWeather():', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getWeather() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getWeather');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getWeather() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to fetch weather: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getWeather() SUCCESS:', json);

    // Map backend response to frontend WeatherData format
    const weatherData = mapBackendWeatherToGameWeather(json.data);
    console.log('[FARM-DEBUG] gameApi.getWeather() MAPPED:', weatherData);

    return weatherData;
  },

  // ═══════════════════════════════════════════════════════════════
  // INVENTORY — Kho đồ (MỚI)
  // ═════════════════════════════════════════════════════════════════

  /**
   * Xem kho đồ — danh sách nông sản đã thu hoạch
   */
  getInventory: async (): Promise<InventoryResponse> => {
    const url = API_BASE_URL + '/api/game/inventory';
    console.log('[FARM-DEBUG] gameApi.getInventory():', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getInventory() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getInventory');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getInventory() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to fetch inventory: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getInventory() SUCCESS:', json);
    return json.data;
  },

  /**
   * Bán 1 nông sản — truyền UUID của inventory record
   */
  sellInventoryItem: async (id: string): Promise<SellResult> => {
    const url = API_BASE_URL + '/api/game/inventory/sell';
    console.log('[FARM-DEBUG] gameApi.sellInventoryItem():', { url, id });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    console.log('[FARM-DEBUG] gameApi.sellInventoryItem() status:', response.status);

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.sellInventoryItem() SUCCESS:', json);
    return json.data;
  },

  /**
   * Bán hết tất cả nông sản chưa hết hạn
   */
  sellAllInventory: async (): Promise<SellAllResult> => {
    const url = API_BASE_URL + '/api/game/inventory/sell-all';
    console.log('[FARM-DEBUG] gameApi.sellAllInventory():', url);

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.sellAllInventory() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('sellAllInventory');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.sellAllInventory() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to sell all: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.sellAllInventory() SUCCESS:', json);
    return json.data;
  },

  /**
   * Get OGN transaction history
   */
  getOgnHistory: async (limit = 50, offset = 0): Promise<OgnHistoryResult> => {
    const url = `${API_BASE_URL}/api/game/ogn/history?limit=${limit}&offset=${offset}`;
    console.log('[FARM-DEBUG] gameApi.getOgnHistory():', { url, limit, offset });

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getOgnHistory() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getOgnHistory');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getOgnHistory() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to fetch OGN history: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getOgnHistory() SUCCESS:', json);
    return json.data;
  },

  // ═══ LEVEL SYSTEM (Economy v2) ═══

  /**
   * Get level info — tier progress, fees, can level up
   */
  getLevelInfo: async (): Promise<LevelInfo> => {
    const url = API_BASE_URL + '/api/game/player/level-info';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getLevelInfo');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Manual level-up — pay OGN fee to level up
   */
  levelUp: async (): Promise<LevelUpResult> => {
    const url = API_BASE_URL + '/api/game/player/level-up';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('levelUp');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Get daily status — XP cap, boss fights, sync caps
   */
  getDailyStatus: async (): Promise<DailyStatus> => {
    const url = API_BASE_URL + '/api/game/player/daily-status';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getDailyStatus');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Get boss status — cooldown, daily fights remaining
   */
  getBossStatus: async (): Promise<BossStatus> => {
    const url = API_BASE_URL + '/api/game/boss/status';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getBossStatus');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  // ═══ STAT SYSTEM (Phase 2) ═══

  /**
   * Get stat info — stats, effective stats, free points, milestones, reset info
   */
  getStatInfo: async (): Promise<StatInfo> => {
    const url = API_BASE_URL + '/api/game/stat/info';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getStatInfo');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Allocate stat points manually
   */
  allocateStats: async (allocation: AllocateStatsRequest): Promise<AllocateStatsResponse> => {
    const url = API_BASE_URL + '/api/game/stat/allocate';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allocation),
    });

    if (response.status === 401) {
      handleUnauthorized('allocateStats');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Auto-allocate stat points by preset
   */
  autoAllocateStats: async (preset: 'attack' | 'defense' | 'balance'): Promise<AllocateStatsResponse> => {
    const url = API_BASE_URL + '/api/game/stat/auto-allocate';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset }),
    });

    if (response.status === 401) {
      handleUnauthorized('autoAllocateStats');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Reset all stats — costs OGN, increases weekly
   */
  resetStats: async (): Promise<ResetStatsResponse> => {
    const url = API_BASE_URL + '/api/game/stat/reset';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.status === 401) {
      handleUnauthorized('resetStats');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Update auto-allocation setting (preset + enabled)
   */
  updateAutoSetting: async (setting: AutoSettingRequest): Promise<{ success: boolean }> => {
    const url = API_BASE_URL + '/api/game/stat/auto-setting';

    const response = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setting),
    });

    if (response.status === 401) {
      handleUnauthorized('updateAutoSetting');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json;
  },

  // ═══ CAMPAIGN ═══

  /**
   * Get all campaign zones with progress
   */
  getCampaignZones: async (): Promise<{ zones: import('@/modules/campaign/types/campaign.types').CampaignZone[] }> => {
    const url = API_BASE_URL + '/api/game/boss/campaign/zones';
    console.log('[FARM-DEBUG] gameApi.getCampaignZones():', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getCampaignZones');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Get bosses for a specific campaign zone
   */
  getZoneBosses: async (zoneNumber: number): Promise<{
    zone: import('@/modules/campaign/types/campaign.types').ZoneInfo;
    bosses: import('@/modules/campaign/types/campaign.types').ZoneBoss[];
  }> => {
    const url = `${API_BASE_URL}/api/game/boss/campaign/zones/${zoneNumber}/bosses`;
    console.log('[FARM-DEBUG] gameApi.getZoneBosses():', { url, zoneNumber });

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getZoneBosses');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Start a campaign battle session
   */
  startCampaignBattle: async (bossId: string): Promise<{ sessionId: string }> => {
    const url = API_BASE_URL + '/api/game/boss/battle/start';
    console.log('[FARM-DEBUG] gameApi.startCampaignBattle():', { url, bossId });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bossId }),
    });

    if (response.status === 401) {
      handleUnauthorized('startCampaignBattle');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Get weekly boss rotation info
   */
  getWeeklyBoss: async (): Promise<WeeklyBossInfo> => {
    const url = API_BASE_URL + '/api/game/boss/weekly';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getWeeklyBoss');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  // ═══ SEED ↔ OGN CONVERSION ═══

  getConversionTiers: async (): Promise<ConversionStatus> => {
    const url = API_BASE_URL + '/api/conversion/tiers';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getConversionTiers');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  convertSeedToOgn: async (tierId: number): Promise<ConversionSuccessResult> => {
    const url = API_BASE_URL + '/api/conversion/seed-to-ogn';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId }),
    });

    if (response.status === 401) {
      handleUnauthorized('convertSeedToOgn');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json;
  },

  convertOgnToSeed: async (tierId: number): Promise<ConversionSuccessResult> => {
    const url = API_BASE_URL + '/api/conversion/ogn-to-seed';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId }),
    });

    if (response.status === 401) {
      handleUnauthorized('convertOgnToSeed');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json;
  },

  // ═══ SMART WALLET ═══

  createSmartWallet: async (): Promise<{ address: string; isDeployed: boolean; alreadyExists: boolean }> => {
    const url = API_BASE_URL + '/api/smart-wallet/create';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('createSmartWallet'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  getSmartWalletStatus: async (): Promise<{
    hasWallet: boolean;
    address: string | null;
    isDeployed: boolean;
    balance: string;
    chainId: number;
  }> => {
    const url = API_BASE_URL + '/api/smart-wallet/status';
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('getSmartWalletStatus'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  prepareUserOp: async (calls: Array<{ to: string; value: string; data?: string }>): Promise<{ userOpHash: string; expiresAt: number; expiresIn: number }> => {
    const url = API_BASE_URL + '/api/smart-wallet/prepare-op';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calls }),
    });
    if (response.status === 401) { handleUnauthorized('prepareUserOp'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  submitSignedOp: async (payload: {
    userOpHash: string;
    assertion: { authenticatorData: string; clientDataJSON: string; signature: string };
  }): Promise<{ txHash: string }> => {
    const url = API_BASE_URL + '/api/smart-wallet/submit-op';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.status === 401) { handleUnauthorized('submitSignedOp'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  getOpReceipt: async (hash: string): Promise<{ txHash: string; status: string; blockNumber: number }> => {
    const url = `${API_BASE_URL}/api/smart-wallet/receipt/${hash}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('getOpReceipt'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  // ═══ PASSKEY (WebAuthn) ═══

  getPasskeyRegisterOptions: async (): Promise<any> => {
    const url = API_BASE_URL + '/api/auth/passkey/register/options';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('getPasskeyRegisterOptions'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.options;
  },

  registerPasskey: async (credential: any): Promise<any> => {
    const url = API_BASE_URL + '/api/auth/passkey/register/verify';
    const { friendlyName, ...response } = credential;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response, friendlyName }),
    });
    if (res.status === 401) { handleUnauthorized('registerPasskey'); throw new Error('Session expired'); }
    if (!res.ok) { await handleApiError(res); }
    const json = await res.json();
    return json;
  },

  listPasskeys: async (): Promise<Array<{ id: string; friendlyName: string; createdAt: string }>> => {
    const url = API_BASE_URL + '/api/auth/passkey/list';
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('listPasskeys'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.passkeys || json.data || [];
  },

  // ═══ VIP PAYMENT (Phase 2) ═══

  createVipOrder: async (planId: string): Promise<VipOrder> => {
    const url = API_BASE_URL + '/api/vip/orders';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });

    if (response.status === 401) {
      handleUnauthorized('createVipOrder');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  verifyVipPayment: async (orderId: string, txHash: string): Promise<VipVerifyResult> => {
    const url = `${API_BASE_URL}/api/vip/orders/${orderId}/verify`;

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash }),
    });

    if (response.status === 401) {
      handleUnauthorized('verifyVipPayment');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  getVipOrders: async (): Promise<VipOrderStatus[]> => {
    const url = API_BASE_URL + '/api/vip/orders';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getVipOrders');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  getConversionHistory: async (page = 1, limit = 5): Promise<ConversionHistoryResult> => {
    const url = `${API_BASE_URL}/api/conversion/history?page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getConversionHistory');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  // ═══ CUSTODIAL WALLET ═══

  getCustodialWalletStatus: async (): Promise<{
    address: string;
    balance: string;
    balanceWei: string;
    chainId: number;
    isActive: boolean;
  } | null> => {
    const url = API_BASE_URL + '/api/custodial-wallet/status';
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('getCustodialWalletStatus'); throw new Error('Session expired'); }
    if (response.status === 404) return null;
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  createCustodialWallet: async (): Promise<{ address: string; isNew: boolean }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/create';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('createCustodialWallet'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  sendCustodialTransaction: async (to: string, amount: string): Promise<{ txHash: string; from: string; to: string; amount: string }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/send';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, amount }),
    });
    if (response.status === 401) { handleUnauthorized('sendCustodialTransaction'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  exportCustodialKey: async (): Promise<{ privateKey: string }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/export';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('exportCustodialKey'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  payVipCustodial: async (orderId: string): Promise<{ txHash: string; from: string; to: string; amount: string; status: string }> => {
    const url = `${API_BASE_URL}/api/vip/orders/${orderId}/pay-custodial`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('payVipCustodial'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },
};

// ═══ VIP ═══
/**
 * Get VIP Status
 */
export const getVipStatus = async (): Promise<VipStatus> => {
  const url = API_BASE_URL + '/api/vip/status';
  console.log('[FARM-DEBUG] gameApi.getVipStatus():', url);

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('getVipStatus');
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[FARM-DEBUG] gameApi.getVipStatus() ERROR:', error);
    throw new Error(error?.error?.message || `Failed to fetch VIP status: ${response.status}`);
  }

  const json = await response.json();
  return json.data;
};

/**
 * Get VIP Plans
 */
export const getVipPlans = async (): Promise<VipPlan[]> => {
  const url = API_BASE_URL + '/api/vip/plans';
  console.log('[FARM-DEBUG] gameApi.getVipPlans():', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[FARM-DEBUG] gameApi.getVipPlans() ERROR:', error);
    throw new Error(error?.error?.message || `Failed to fetch VIP plans: ${response.status}`);
  }

  const json = await response.json();
  return json.data;
};

// ═══ Phase 5: Blockchain + IoT Types ═══

export interface BlockchainStats {
  rootCount: number;
  totalReadingsOnChain: number;
  deployerBalance: string;
  contractAddress: string;
  chainId: number;
  explorerUrl: string;
}

export interface BlockchainLog {
  id: string;
  merkleRoot: string;
  readingCount: number;
  txHash: string | null;
  blockNumber: number | null;
  gasUsed: string | null;
  chainId: number;
  contractAddress: string | null;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  errorMessage: string | null;
  batchedAt: string;
  submittedAt: string | null;
  confirmedAt: string | null;
  explorerUrl: string | null;
}

export interface SensorReading {
  id: string;
  deviceId: string;
  temperature: string | null;
  humidity: string | null;
  lightLevel: string | null;
  soilPh: string | null;
  soilMoisture: string | null;
  dataHash: string | null;
  blockchainBatchId: string | null;
  recordedAt: string;
  indicators?: {
    temperature: 'good' | 'warning' | 'danger';
    humidity: 'good' | 'warning' | 'danger';
    soilPh: 'good' | 'warning' | 'danger';
  };
}

export interface IoTDevice {
  id: string;
  name: string;
  type: string;
  location: string | null;
  isActive: boolean;
  createdAt: string;
}

// ═══ Phase 5: Blockchain + IoT API Functions ═══

export const getBlockchainStats = async (): Promise<BlockchainStats> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/blockchain/stats`);
  if (!res.ok) throw new Error(`Failed to fetch blockchain stats: ${res.status}`);
  const json = await res.json();
  return json.data;
};

export const getBlockchainLogs = async (limit = 20): Promise<BlockchainLog[]> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/blockchain/logs?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch blockchain logs: ${res.status}`);
  const json = await res.json();
  return json.data;
};

export const getSensorLatest = async (deviceId?: string): Promise<SensorReading | null> => {
  const params = deviceId ? `?deviceId=${deviceId}` : '';
  const res = await fetch(`${API_BASE_URL}/api/rwa/sensors/latest${params}`);
  if (!res.ok) throw new Error(`Failed to fetch sensor latest: ${res.status}`);
  const json = await res.json();
  return json.data;
};

export const getSensorHistory = async (deviceId = 'mock-sensor-001', hours = 24): Promise<SensorReading[]> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/sensors/history?deviceId=${deviceId}&hours=${hours}`);
  if (!res.ok) throw new Error(`Failed to fetch sensor history: ${res.status}`);
  const json = await res.json();
  return json.data;
};

export const getIoTDevices = async (): Promise<IoTDevice[]> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/devices`);
  if (!res.ok) throw new Error(`Failed to fetch IoT devices: ${res.status}`);
  const json = await res.json();
  return json.data;
};

export type {
  PlayerProfile,
  FarmPlotData,
  WaterResult,
  HarvestResult,
  ClearResult,
  BossFightInput,
  BossCompleteResult,
  QuizStartResult,
  QuizAnswerInput,
  QuizAnswerResult,
  ShopItemData,
  BuyResult,
  FriendData,
  FriendsResult,
  AddFriendResult,
  ReferralInfoResult,
  LeaderboardResult,
  SyncAction,
  SyncResult,
  PingResult,
  AuthStatus,
  PlantTypeId,
  QuizAnswer,
  InteractType,
  FriendFarmData,
  LevelInfo,
  LevelUpResult,
  DailyStatus,
  BossStatus,
  StatInfo,
  AllocateStatsRequest,
  AllocateStatsResponse,
  ResetStatsResponse,
  AutoSettingRequest,
  WeeklyBossInfo,
  ConversionStatus,
  ConversionSuccessResult,
  ConversionHistoryResult,
  VipOrder,
  VipVerifyResult,
  VipOrderStatus,
};
