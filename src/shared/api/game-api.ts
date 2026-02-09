// ═══════════════════════════════════════════════════════════════
// GAME API - All game-related API calls
// Currently in MOCK mode - returns dummy data matching Zustand store shapes
// TODO: Each function will be converted to real API in later steps
// ═══════════════════════════════════════════════════════════════

import { gameClient } from './client';
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
} from '../types/game-api.types';

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS (16 total)
// ═══════════════════════════════════════════════════════════════

export const gameApi = {
  // ═══ PLAYER ═══
  /**
   * Get player profile
   * TODO: bước 9 chuyển sang API thật
   */
  getProfile: async (): Promise<PlayerProfile> => {
    // MOCK: Return dummy profile
    return {
      userId: 'mock',
      xp: 0,
      level: 1,
      ogn: 1250,
      totalHarvests: 0,
      totalBossKills: 0,
      totalDamage: 0,
      likesCount: 0,
      commentsCount: 0,
      giftsCount: 0,
      referralCode: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastPlayedAt: null,
    } as PlayerProfile;
    // Real API (bước 9): return gameClient.get<PlayerProfile>('/game/player/profile');
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
   * Get all farm plots
   * TODO: bước 12 chuyển sang API thật
   */
  getPlots: async (): Promise<FarmPlotData[]> => {
    // MOCK: Empty garden
    return [];
    // Real API (bước 12): return gameClient.get<FarmPlotData[]>('/game/farm/plots');
  },

  /**
   * Plant a seed in a slot
   * TODO: bước 13 chuyển sang API thật
   */
  plantSeed: async (slotIndex: number, plantTypeId: string): Promise<FarmPlotData> => {
    // MOCK: Return dummy plot
    return {
      id: 'mock-plot',
      slotIndex,
      plantType: {
        id: plantTypeId,
        name: 'Mock Plant',
        emoji: '🌱',
        growthDurationMs: 120000,
        rewardOGN: 100,
        rewardXP: 25,
        shopPrice: 200,
      },
      plantedAt: Date.now(),
      happiness: 100,
      lastWateredAt: Date.now(),
      isDead: false,
    } as FarmPlotData;
    // Real API (bước 13): return gameClient.post<FarmPlotData>('/game/farm/plant', { slotIndex, plantTypeId });
  },

  /**
   * Water a plot
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
   * TODO: bước 19 chuyển sang API thật
   */
  buyItem: async (itemId: string): Promise<BuyResult> => {
    // MOCK: Return buy result
    return {
      item: {
        id: itemId,
        name: 'Mock Item',
        emoji: '🎁',
        quantity: 1,
      },
      ognRemaining: 1000,
    };
    // Real API (bước 19): return gameClient.post<BuyResult>('/game/shop/buy', { itemId });
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
   * TODO: bước 20 chuyển sang API thật
   */
  interactFriend: async (
    friendId: string,
    type: 'water' | 'like' | 'comment' | 'gift'
  ): Promise<{ ognGained: number; xpGained: number; dailyLimitReached: boolean }> => {
    // MOCK: Return interaction result
    return {
      ognGained: 5,
      xpGained: 2,
      dailyLimitReached: false,
    };
    // Real API (bước 20): return gameClient.post('/game/social/interact', { friendId, type });
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
   * Health check - FIRST ENDPOINT TO TEST
   * TODO: bước 8 chuyển sang API thật - ENDPOINT ĐẦU TIÊN TEST
   */
  ping: async (): Promise<PingResult> => {
    // MOCK: Return mock mode indicator
    return {
      success: true,
      message: 'mock mode',
    };
    // Real API (bước 8): return gameClient.get<PingResult>('/game/ping');
  },

  /**
   * Get auth status
   * TODO: bước 10 chuyển sang API thật
   */
  getAuthStatus: async (): Promise<AuthStatus> => {
    // MOCK: Return logged out status
    return {
      isLoggedIn: false,
      user: null,
    };
    // Real API (bước 10): return gameClient.get<AuthStatus>('/game/auth/status');
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
};
