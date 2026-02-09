// ═══════════════════════════════════════════════════════════════
// GAME API TYPES — Backend Contract
// These types MUST match backend responses exactly
// ═══════════════════════════════════════════════════════════════

import type { ApiResponse } from './common';

// ═══════════════════════════════════════════════════════════════
// PLAYER
// ═══════════════════════════════════════════════════════════════

export interface PlayerProfile {
  userId: string;
  xp: number;
  level: number;
  ogn: number;
  totalHarvests: number;
  totalBossKills: number;
  totalDamage: number;
  likesCount: number;
  commentsCount: number;
  giftsCount: number;
  referralCode: string | null;
  createdAt: string;
  updatedAt: string;
  lastPlayedAt: string | null;
}

// ═══════════════════════════════════════════════════════════════
// FARM
// ═══════════════════════════════════════════════════════════════

export interface PlantTypeInfo {
  id: string;
  name: string;
  emoji: string;
  growthDurationMs: number;
  rewardOGN: number;
  rewardXP: number;
  shopPrice: number;
}

export interface FarmPlotData {
  id: string;
  slotIndex: number;
  plantType: PlantTypeInfo;
  plantedAt: number;
  happiness: number;
  lastWateredAt: number | null;
  isDead: boolean;
}

export interface PlantResult {
  plot: FarmPlotData;
  ognRemaining: number;
  xpGained: number;
}

export interface WaterResult {
  cooldownRemaining: number;
  happinessGain: number;
  xpGained: number;
  newHappiness: number;
}

export interface HarvestResult {
  ognReward: number;
  xpGained: number;
  ognTotal: number;
  leveledUp: boolean;
  newLevel?: number;
}

// ═══════════════════════════════════════════════════════════════
// BOSS
// ═══════════════════════════════════════════════════════════════

export interface BossInfo {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  attack: number;
  rewardOGN: number;
  rewardXP: number;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  unlockLevel: number;
}

export interface BossFightInput {
  bossId: string;
  won: boolean;
  totalDamage: number;
  durationSeconds: number;
}

export interface BossCompleteResult {
  won: boolean;
  ognReward: number;
  xpGained: number;
  bossProgress: {
    kills: number;
    totalDamage: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════

export interface QuizOption {
  letter: string;
  text: string;
}

export interface QuizQuestionData {
  id: string;
  question: string;
  image: string;
  options: QuizOption[];
  // ⚠️ NO correctAnswer field - server keeps it secret
}

export interface QuizStartResult {
  sessionId: string;
  questions: QuizQuestionData[];
  totalQuestions: number;
}

export interface QuizAnswerInput {
  sessionId: string;
  questionId: string;
  answer: QuizAnswer;
}

export interface QuizAnswerResult {
  correct: boolean;
  correctAnswer: string; // Server reveals after answering
  ognGained: number;
  xpGained: number;
  currentScore: number;
  questionIndex: number;
}

// ═══════════════════════════════════════════════════════════════
// SHOP
// ═══════════════════════════════════════════════════════════════

export interface ShopItemData {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  price: number;
  category: 'seed' | 'tool' | 'card' | 'nft';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  owned: number;
}

export interface BuyResult {
  item: {
    id: string;
    name: string;
    emoji: string;
    quantity: number;
  };
  ognRemaining: number;
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL
// ═══════════════════════════════════════════════════════════════

export interface FriendData {
  id: string;
  name: string;
  avatar: string | null;
  level: number;
  title: string;
  online: boolean;
  plantCount: number;
  totalHarvest: number;
  ogn: number;
}

export interface InteractResult {
  ognGained: number;
  xpGained: number;
  dailyLimitReached: boolean;
}

export interface FriendsResult {
  friends: FriendData[];
  myReferralCode: string;
}

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  ogn: number;
  totalHarvests: number;
  level: number;
}

export interface LeaderboardResult {
  players: LeaderboardEntry[];
  myRank: number;
  total: number;
}

// ═══════════════════════════════════════════════════════════════
// SYNC
// ═══════════════════════════════════════════════════════════════

export interface SyncAction {
  type:
    | 'water'
    | 'bug_catch'
    | 'social_interact'
    | 'plant'
    | 'harvest'
    | 'boss_kill'
    | 'quiz'
    | 'shop_buy';
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface SyncResult {
  xp: number;
  ogn: number;
  level: number;
}

// ═══════════════════════════════════════════════════════════════
// HEALTH & AUTH
// ═══════════════════════════════════════════════════════════════

export interface PingResult {
  success: boolean;
  message: string;
}

export interface AuthStatus {
  isLoggedIn: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

// ═══════════════════════════════════════════════════════════════
// REQUEST TYPES (match BE Zod schemas)
// ═══════════════════════════════════════════════════════════════

export type PlantTypeId = 'tomato' | 'lettuce' | 'cucumber' | 'carrot' | 'chili';
export type QuizAnswer = 'A' | 'B' | 'C' | 'D';
export type InteractType = 'water' | 'like' | 'comment' | 'gift';

export interface PlantRequest {
  plantTypeId: PlantTypeId;
  slotIndex: number;
}

export interface WaterRequest {
  plotId: string;
}

export interface HarvestRequest {
  plotId: string;
}

export interface BuyRequest {
  itemId: string;
  quantity?: number;
}

export interface InteractRequest {
  friendId: string;
  type: InteractType;
  data?: {
    comment?: string;
    giftId?: string;
  };
}

export interface SyncRequest {
  actions: SyncAction[];
}

// ═══════════════════════════════════════════════════════════════
// WRAPPER TYPES
// ═══════════════════════════════════════════════════════════════

export type PlayerProfileResponse = ApiResponse<PlayerProfile>;
export type FarmPlotsResponse = ApiResponse<FarmPlotData[]>;
export type PlantResponse = ApiResponse<PlantResult>;
export type WaterResponse = ApiResponse<WaterResult>;
export type HarvestResponse = ApiResponse<HarvestResult>;
export type BossCompleteResponse = ApiResponse<BossCompleteResult>;
export type QuizStartResponse = ApiResponse<QuizStartResult>;
export type QuizAnswerResponse = ApiResponse<QuizAnswerResult>;
export type ShopItemsResponse = ApiResponse<ShopItemData[]>;
export type BuyResponse = ApiResponse<BuyResult>;
export type FriendsResponse = ApiResponse<FriendsResult>;
export type InteractResponse = ApiResponse<InteractResult>;
export type LeaderboardResponse = ApiResponse<LeaderboardResult>;
export type SyncResponse = ApiResponse<SyncResult>;
export type PingResponse = ApiResponse<PingResult>;
export type AuthStatusResponse = ApiResponse<AuthStatus>;
