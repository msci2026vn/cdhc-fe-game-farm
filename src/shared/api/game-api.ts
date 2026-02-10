// ═══════════════════════════════════════════════════════════════
// GAME API - All game-related API calls
// Currently in MOCK mode - returns dummy data matching Zustand store shapes
// TODO: Each function will be converted to real API in later steps
// ═══════════════════════════════════════════════════════════════

import { gameClient } from './client';
import type { ApiResponse } from '../types/common';
import type {
  PlayerProfile,
  FarmPlotData,
  WaterResult,
  HarvestResult,
  BossFightInput,
  BossCompleteResult,
  QuizStartResult,
  QuizAnswerInput,
  QuizAnswerResult,
  ShopItemData,
  BuyResult,
  FriendData,
  FriendsResult,
  LeaderboardResult,
  SyncAction,
  SyncResult,
  PingResult,
  AuthStatus,
  PlantTypeId,
  QuizAnswer,
  InteractType,
} from '../types/game-api.types';

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
      const response = await fetch('https://sta.cdhc.vn/api/game/player/profile', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        console.warn('[GameAPI] Chưa đăng nhập');
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

  /**
   * Sync offline/actions to server
   * TODO: bước 22 chuyển sang API thật
   */
  syncActions: async (actions: SyncAction[]): Promise<SyncResult> => {
    // MOCK: Return sync result
    return {
      xp: 0,
      ogn: 1250,
      level: 1,
    };
    // Real API (bước 22): return gameClient.post<SyncResult>('/game/player/sync', { actions });
  },

  // ═══ FARM ═══
  /**
   * Get all farm plots (bước 12 — real API)
   */
  getPlots: async () => {
    const url = 'https://sta.cdhc.vn/api/game/farm/plots';
    console.log('[FARM-DEBUG] gameApi.getPlots: Calling', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getPlots: Response status =', response.status);

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
   * BE Zod: { plantTypeId: enum['tomato','lettuce','cucumber','carrot','chili'], slotIndex: int 0-5 }
   */
  plantSeed: async (
    slotIndex: number,
    plantTypeId: PlantTypeId
  ): Promise<{ plot: FarmPlotData; ognRemaining: number; plantType: { name: string; emoji: string; growthDurationMs: number } }> => {
    const url = 'https://sta.cdhc.vn/api/game/farm/plant';
    console.log('[FARM-DEBUG] gameApi.plantSeed:', { url, slotIndex, plantTypeId });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotIndex, plantTypeId }),
    });

    console.log('[FARM-DEBUG] gameApi.plantSeed status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.plantSeed ERROR:', error);
      const message = error?.error?.message || `Failed to plant: ${response.status}`;
      throw new Error(message);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.plantSeed data:', json);
    return json.data;
  },

  /**
   * Water a plot
   * BE Zod: { plotId: string uuid }
   * TODO: bước 14 chuyển sang API thật
   */
  waterPlot: async (plotId: string): Promise<WaterResult> => {
    // MOCK: Return water result
    return {
      cooldownRemaining: 3600,
      happinessGain: 15,
      xpGained: 5,
      newHappiness: 100,
    };
    // Real API (bước 14): return gameClient.post<WaterResult>('/game/farm/water', { plotId });
  },

  /**
   * Harvest a plot
   * BE Zod: { plotId: string uuid }
   * TODO: bước 15 chuyển sang API thật
   */
  harvestPlot: async (plotId: string): Promise<HarvestResult> => {
    // MOCK: Return harvest result
    return {
      ognReward: 100,
      xpGained: 25,
      ognTotal: 1350,
      leveledUp: false,
    };
    // Real API (bước 15): return gameClient.post<HarvestResult>('/game/farm/harvest', { plotId });
  },

  // ═══ BOSS ═══
  /**
   * Complete boss fight
   * BE Zod: { bossId: string, won: boolean, totalDamage: int 0-100000, durationSeconds: 0-3600 }
   * TODO: bước 17 chuyển sang API thật
   */
  completeBoss: async (data: BossFightInput): Promise<BossCompleteResult> => {
    // MOCK: Return boss result
    return {
      won: data.won,
      ognReward: data.won ? 5 : 0,
      xpGained: data.won ? 15 : 5,
      bossProgress: {
        kills: data.won ? 1 : 0,
        totalDamage: data.totalDamage,
      },
    };
    // Real API (bước 17): return gameClient.post<BossCompleteResult>('/game/boss/complete', data);
  },

  // ═══ QUIZ ═══
  /**
   * Start a quiz session
   * TODO: bước 18 chuyển sang API thật
   */
  startQuiz: async (): Promise<QuizStartResult> => {
    // MOCK: Return dummy quiz
    return {
      sessionId: 'mock-session',
      questions: [
        {
          id: 'q1',
          question: 'Câu hỏi mẫu',
          image: '🌱',
          options: [
            { letter: 'A', text: 'Đáp án A' },
            { letter: 'B', text: 'Đáp án B' },
            { letter: 'C', text: 'Đáp án C' },
            { letter: 'D', text: 'Đáp án D' },
          ],
        },
      ],
      totalQuestions: 1,
    };
    // Real API (bước 18): return gameClient.get<QuizStartResult>('/game/quiz/start');
  },

  /**
   * Answer a quiz question
   * BE Zod: { sessionId: string, questionId: string, answer: enum['A','B','C','D'] }
   * TODO: bước 18 chuyển sang API thật
   */
  answerQuiz: async (input: QuizAnswerInput): Promise<QuizAnswerResult> => {
    // MOCK: Return correct answer
    return {
      correct: true,
      correctAnswer: 'A',
      ognGained: 1,
      xpGained: 8,
      currentScore: 1,
      questionIndex: 0,
    };
    // Real API (bước 18): return gameClient.post<QuizAnswerResult>('/game/quiz/answer', input);
  },

  // ═══ SHOP ═══
  /**
   * Get shop items and inventory
   * TODO: bước 19 chuyển sang API thật
   */
  getShopItems: async (): Promise<ShopItemData[]> => {
    // MOCK: Empty shop
    return [];
    // Real API (bước 19): return gameClient.get<ShopItemData[]>('/game/shop');
  },

  /**
   * Buy an item from shop
   * BE Zod: { itemId: string, quantity?: int 1-10, default 1 }
   * TODO: bước 19 chuyển sang API thật
   */
  buyItem: async (itemId: string, quantity?: number): Promise<BuyResult> => {
    // MOCK: Return buy result
    return {
      item: {
        id: itemId,
        name: 'Mock Item',
        emoji: '🎁',
        quantity: quantity ?? 1,
      },
      ognRemaining: 1000,
    };
    // Real API (bước 19): return gameClient.post<BuyResult>('/game/shop/buy', { itemId, quantity: quantity ?? 1 });
  },

  // ═══ SOCIAL ═══
  /**
   * Get friends list
   * TODO: bước 20 chuyển sang API thật
   */
  getFriends: async (): Promise<FriendsResult> => {
    // MOCK: Empty friends
    return {
      friends: [],
      myReferralCode: 'MOCK123',
    };
    // Real API (bước 20): return gameClient.get<FriendsResult>('/game/social/friends');
  },

  /**
   * Interact with friend's garden
   * BE Zod: { friendId: string uuid, type: enum['water','like','comment','gift'], data?: { comment?, giftId? } }
   * TODO: bước 20 chuyển sang API thật
   */
  interactFriend: async (
    friendId: string,
    type: InteractType,
    data?: { comment?: string; giftId?: string }
  ): Promise<{ ognGained: number; xpGained: number; dailyLimitReached: boolean }> => {
    // MOCK: Return interaction result
    return {
      ognGained: 5,
      xpGained: 2,
      dailyLimitReached: false,
    };
    // Real API (bước 20): return gameClient.post('/game/social/interact', { friendId, type, data });
  },

  // ═══ LEADERBOARD ═══
  /**
   * Get leaderboard
   * TODO: bước 21 chuyển sang API thật
   */
  getLeaderboard: async (
    sort: 'ogn' | 'harvests',
    page?: number
  ): Promise<LeaderboardResult> => {
    // MOCK: Empty leaderboard
    return {
      players: [],
      myRank: 0,
      total: 0,
    };
    // Real API (bước 21): return gameClient.get<LeaderboardResult>(`/game/leaderboard?sort=${sort}&page=${page || 1}`);
  },

  // ═══ HEALTH CHECK ═══
  /**
   * Health check - test auth chain (bước 8)
   * Success = route + auth + CORS + cookie ALL work
   */
  ping: async (): Promise<PingResult> => {
    try {
      const res = await fetch('https://sta.cdhc.vn/api/game/ping', {
        method: 'GET',
        credentials: 'include', // ← BẮT BUỘC — gửi cookie cross-subdomain
        headers: { 'Accept': 'application/json' },
      });

      if (res.status === 401) {
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
        userId: result.data.userId,
        email: result.data.email,
      };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  },

  /**
   * Get auth status - Check if user is logged in
   * Bước 10 — REAL API: Calls /api/auth/me
   */
  getAuthStatus: async (): Promise<AuthStatus> => {
    try {
      const response = await fetch('https://sta.cdhc.vn/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
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
};

// Export types for use in stores and components
export type {
  PlayerProfile,
  FarmPlotData,
  WaterResult,
  HarvestResult,
  BossFightInput,
  BossCompleteResult,
  QuizStartResult,
  QuizAnswerInput,
  QuizAnswerResult,
  ShopItemData,
  BuyResult,
  FriendData,
  FriendsResult,
  LeaderboardResult,
  SyncAction,
  SyncResult,
  PingResult,
  AuthStatus,
  PlantTypeId,
  QuizAnswer,
  InteractType,
};
