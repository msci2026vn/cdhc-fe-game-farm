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
  name: string;
  picture: string | null;
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
  walletAddress?: string | null;
  createdAt: string;
  updatedAt: string;
  lastPlayedAt: string | null;
  // Stat system (Phase 2)
  statAtk?: number;
  statHp?: number;
  statDef?: number;
  statMana?: number;
  freeStatPoints?: number;
  totalStatPointsEarned?: number;
  autoPreset?: string | null;
  autoEnabled?: boolean;
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
  diedAt: string | null;
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

// MỚI — Harvest KHÔNG trả OGN, trả inventory info
export interface HarvestResult {
  ognEarned: number;
  xpGained: number;
  newOgn: number;
  newXp: number;
  newLevel: number;
  totalHarvests: number;
  leveledUp: boolean;
  plantName: string;
  plantEmoji: string;
  message: string;
}

export interface ClearResult {
  cleared: boolean;
  plotId: string;
  slotIndex: number;
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
  // Campaign combat sync (Prompt 12)
  stars?: number;
  playerHpPercent?: number;
  maxCombo?: number;
  dodgeCount?: number;
  isCampaign?: boolean;
}

export interface BossCompleteResult {
  won: boolean;
  ognReward: number;
  xpGained: number;
  leveledUp?: boolean;
  newLevel?: number;
  bossProgress: {
    kills: number;
    totalDamage: number;
  };
  // Campaign combat sync (Prompt 12)
  stars?: number;
  isFirstClear?: boolean;
  zoneProgress?: {
    bossesCleared: number;
    totalBosses: number;
    totalStars: number;
    maxStars: number;
    isZoneCleared: boolean;
  };
  campaignRewards?: {
    starBonus: number;
    firstClearBonus: number;
  };
  remainingBattles?: number;
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
  questionIndex: number;
  answer: QuizAnswer;
}

export interface QuizAnswerResult {
  correct: boolean;
  correctAnswer: string; // Server reveals after answering
  ognGain: number;
  xpGain: number;
  totalCorrect: number;
  totalAnswered: number;
  totalQuestions: number;
  quizComplete: boolean;
  totalOgnGained?: number;
  totalXpGained?: number;
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
  seasonStatus?: 'in_season' | 'off_season';
}

export interface BuyResult {
  item: {
    id: string;
    name: string;
    emoji: string;
    price: number;
  };
  quantityBought: number;
  totalOwned: number;
  ognSpent: number;
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
  success: boolean;
  ognGain: number;
  xpGain: number;
  friendOgnGain: number;
  dailyCount: number;
  dailyLimit: number;
}

export interface FriendsResult {
  friends: FriendData[];
  myReferralCode: string;
}

export interface AddFriendResult {
  friend: FriendData;
  referralCode: string;
}

// ═══════════════════════════════════════════════════════════════
// FRIEND FARM (view-only)
// ═══════════════════════════════════════════════════════════════

export interface FriendFarmPlot {
  id: string;
  slotIndex: number;
  plantTypeId: string;
  plantName: string;
  plantEmoji: string;
  plantedAt: number;
  happiness: number;
  lastWateredAt: number | null;
  isDead: boolean;
  growthPercent: number;
  isReady: boolean;
  growthDurationMs: number;
}

export interface FriendFarmData {
  friend: {
    id: string;
    name: string | null;
    picture: string | null;
    level: number;
    ogn: number;
  };
  plots: FriendFarmPlot[];
  totalSlots: number;
}

// ═══════════════════════════════════════════════════════════════
// REFERRAL (Step 20 — Enhanced)
// ═══════════════════════════════════════════════════════════════

export interface ReferredUser {
  userId: string;
  name: string;
  picture: string | null;
  joinedAt: string;
  lastSeen: string | null;
  isOnline: boolean;
  lastSeenAgo: string | null;
  ogn: number;
  level: number;
}

export interface CommissionTransaction {
  id: string;
  spenderId: string;
  spenderName: string;
  spendAction: string;
  spendAmount: number;
  commissionAmount: number;
  commissionRateBps: number;
  createdAt: string;
}

export interface ReferralInfoResult {
  referralCode: string;
  referredCount: number;
  totalCommissionEarned: number;
  commissionRate: number;
  commissionCount: number;
  referredUsers: ReferredUser[];
  recentCommissions: CommissionTransaction[];
}

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  picture: string | null;
  ogn: number;
  xp: number;
  level: number;
  totalHarvests: number;
}

export interface LeaderboardResult {
  rankings: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  myRank: number | null;
  sort: string;
}

// ═══════════════════════════════════════════════════════════════
// SYNC (Step 22 — Batch Actions)
// ═══════════════════════════════════════════════════════════════

// Action types that can be batched (small actions only)
export type SyncActionType = 'bug_catch' | 'xp_pickup' | 'daily_check';

export interface SyncAction {
  type: SyncActionType;
  count: number;      // Number of times this action was performed
  timestamp: number;  // When the first action occurred (client time)
}

export interface SyncResult {
  ogn: number;
  xp: number;
  level: number;
  processed: number;  // Total actions processed
  rejected: number;   // Total actions rejected (anti-cheat)
  details: Array<{ type: string; count: number; ogn: number; xp: number }>;
}

// ═══════════════════════════════════════════════════════════════
// WEATHER (GPS Integration)
// ═══════════════════════════════════════════════════════════════

export type WeatherCondition = 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'wind' | 'cold' | 'hot';

export interface VipPlan {
  id: string;
  name: string;
  nameEn: string;
  tier: 'standard' | 'premium';
  priceUsd?: number;
  priceVnd?: number;
  priceAvax: string;
  durationDays: number;
  ognMultiplier: number;
  deliveriesPerMonth: number;
  features: string[];
  receiverAddress: string;
  chainId: number;
}

export interface VipOrder {
  orderId: string;
  planId: string;
  planName: string;
  amountAvax: string;
  receiverAddress: string;
  expiresAt: string;
  status: 'pending' | 'confirmed' | 'expired' | 'failed';
  alreadyExists?: boolean;
  chainId: number;
  explorerUrl: string;
}

export interface VipVerifyResult {
  status: 'confirmed' | 'already_confirmed';
  orderId: string;
  txHash: string;
  blockNumber: number;
  amountAvax: string;
  subscription: {
    id: string;
    tier: string;
    expiresAt: string;
  };
  explorerUrl: string;
}

export interface VipOrderStatus {
  orderId: string;
  status: string;
  amountAvax: string;
  txHash: string | null;
  receiverAddress: string;
  expiresAt: string;
  confirmedAt: string | null;
  explorerUrl: string | null;
}

export interface VipStatus {
  isVip: boolean;
  tier: 'free' | 'standard' | 'premium';
  ognMultiplier: number;
  expiresAt: string | null;
  daysRemaining: number;
  deliveriesPerMonth: number;
  subscription: {
    id: string;
    startsAt: string;
    expiresAt: string;
  } | null;
}

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number;        // Celsius
  humidity: number;           // Percentage
  windSpeed: number;          // km/h
  wmoCode: number;            // WMO weather code
  location: {
    lat: number;
    lon: number;
    province?: string;
  };
  timeOfDay: TimeOfDay;
  isDay: boolean;
  lastUpdated: string;         // ISO timestamp
}

export interface WeatherRequest {
  lat?: number;
  lon?: number;
}

// ═══════════════════════════════════════════════════════════════
// LEVEL SYSTEM (Economy v2)
// ═══════════════════════════════════════════════════════════════

export interface LevelTierInfo {
  minLevel: number;
  maxLevel: number;
  xpPerLevel: number;
  ognFeePerLevel: number;
  title: string;
  icon: string;
}

export interface LevelInfo {
  level: number;
  xp: number;
  ogn: number;
  xpInLevel: number;
  xpForNextLevel: number;
  levelUpFee: number;
  canLevelUp: boolean;
  pendingLevelUp: boolean;
  title: string;
  icon: string;
  maxLevel: number;
  tiers: LevelTierInfo[];
}

export interface LevelUpResult {
  success: boolean;
  newLevel: number;
  ognSpent: number;
  title: string;
  icon: string;
  pendingMore?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// DAILY STATUS (Economy v2)
// ═══════════════════════════════════════════════════════════════

export interface DailyStatus {
  date: string;
  xp: {
    used: number;
    cap: number;
    remaining: number;
  };
  boss: {
    fightsUsed: number;
    fightsMax: number;
    cooldownRemaining: number;
    canFight: boolean;
  };
  sync: Record<string, { used: number; max: number }>;
}

// ═══════════════════════════════════════════════════════════════
// BOSS STATUS (Economy v2)
// ═══════════════════════════════════════════════════════════════

export interface BossStatus {
  dailyFightsUsed: number;
  dailyFightsMax: number;
  cooldownRemaining: number;
  canFight: boolean;
  nextFightAt: string | null;
}

export interface WeeklyBossInfo {
  bossId: string;
  bossName: string;
  bossEmoji: string;
  weakness: 'atk' | 'hp' | 'def' | 'mana';
  rewardMultiplier: number;
  weekNumber: number;
  year: number;
  startsAt: string;
  endsAt: string;
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
    picture: string | null;
    fullName?: string;    // Fallback for Google Auth
    avatarUrl?: string;   // Fallback for some APIs
    avatar?: string;      // Fallback for consistency with FriendData
    walletAddress?: string | null;
  } | null;
}

// ═══════════════════════════════════════════════════════════════
// REQUEST TYPES (match BE Zod schemas)
// ═══════════════════════════════════════════════════════════════

export type PlantTypeId = 'tomato' | 'carrot' | 'chili' | 'wheat';
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


// ═════════════════════════════════════════════════════════════
// INVENTORY — Kho đồ nông sản (MỚI)
// ═════════════════════════════════════════════════════════════

export interface InventoryItem {
  id: string;               // UUID — dùng để bán
  itemId: string;            // plant type: 'tomato', 'carrot', 'chili', 'wheat'
  plantName: string;
  plantEmoji: string;
  quantity: number;
  harvestedAt: string;
  expiresAt: string | null;
  freshnessPercent: number;  // 0-100
  freshnessLabel: string;    // 'Tươi 🟢', 'Sắp héo 🟡', 'Gần hỏ 🔴', 'Hết hạn 🥀'
  sellPrice: number;         // OGN nhận được khi bán
  seasonTag: string;         // 'Đúng vụ ✅' hoặc 'Trái vụ ⚠️'
}

export interface InventoryResponse {
  items: InventoryItem[];
  expiredItems?: Array<{
    id: string;
    itemId: string;
    plantName: string;
    plantEmoji: string;
    message: string;
  }>;
}

export interface SellResult {
  sold: {
    plantName: string;
    plantEmoji: string;
    sellPrice: number;
    freshnessLabel: string;
    seasonTag: string;
  };
  message: string;
  newOgn: number;
}

export interface SellAllResult {
  soldItems: Array<{
    plantName: string;
    plantEmoji: string;
    sellPrice: number;
  }>;
  totalOgn: number;
  expiredItems?: Array<{ plantName: string; message: string }>;
  message: string;
}

export interface InventoryRequest {
  id: string;
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
export type AddFriendResponse = ApiResponse<AddFriendResult>;
export type ReferralInfoResponse = ApiResponse<ReferralInfoResult>;
export type InteractResponse = ApiResponse<InteractResult>;
export type LeaderboardResponse = ApiResponse<LeaderboardResult>;
export type SyncResponse = ApiResponse<SyncResult>;
export type PingResponse = ApiResponse<PingResult>;
export type AuthStatusResponse = ApiResponse<AuthStatus>;

export type InventoryResponseType = ApiResponse<InventoryResponse>;
export type SellResponseType = ApiResponse<SellResult>;
export type SellAllResponseType = ApiResponse<SellAllResult>;

// ═════════════════════════════════════════════════════════════
// OGN TRANSACTION HISTORY
// ═════════════════════════════════════════════════════════════

export interface OgnTransaction {
  id: string;
  amount: number;             // +50 or -10
  type: string;              // 'plant_seed' | 'harvest_sell' | 'shop_buy' | 'boss_reward' | 'quiz_reward' | 'daily_login' | 'referral' | 'social_interact' | 'system'
  category: string;          // 'earn' | 'spend'
  description: string;       // Vietnamese description
  balanceAfter: number;       // OGN balance after this transaction
  metadata: Record<string, unknown> | null;
  createdAt: string;         // ISO timestamp
}

export interface OgnHistoryResult {
  transactions: OgnTransaction[];
  total: number;
}

export interface OgnHistoryResponse extends ApiResponse<OgnHistoryResult> { }

// ═══════════════════════════════════════════════════════════════
// STAT SYSTEM (Phase 2)
// ═══════════════════════════════════════════════════════════════

export interface StatInfo {
  stats: {
    atk: number;
    hp: number;
    def: number;
    mana: number;
  };
  effectiveStats: {
    atk: number;
    hp: number;
    def: number;
    mana: number;
  };
  freePoints: number;
  totalEarned: number;
  milestones: {
    unlocked: MilestoneInfo[];
    next: MilestoneNextInfo[];
  };
  resetInfo: {
    weeklyCount: number;
    nextCost: number;
    weekResetsAt: string;
  };
  autoPreset: string | null;
  autoEnabled: boolean;
}

export interface MilestoneInfo {
  id: string;
  stat: 'atk' | 'hp' | 'def' | 'mana';
  name: string;
  description: string;
  icon: string;
}

export interface MilestoneNextInfo extends MilestoneInfo {
  threshold: number;
  remaining: number;
}

export interface AllocateStatsRequest {
  atk: number;
  hp: number;
  def: number;
  mana: number;
}

export interface AllocateStatsResponse {
  success: boolean;
  newStats: { atk: number; hp: number; def: number; mana: number };
  effectiveStats: { atk: number; hp: number; def: number; mana: number };
  freePointsRemaining: number;
  newMilestones: MilestoneInfo[];
}

export interface ResetStatsResponse {
  success: boolean;
  ognSpent: number;
  freePoints: number;
  nextResetCost: number;
}

export interface AutoSettingRequest {
  preset: 'attack' | 'defense' | 'balance';
  enabled: boolean;
}

// ═══════════════════════════════════════════════════════════════
// SEED ↔ OGN CONVERSION
// ═══════════════════════════════════════════════════════════════

export type ConversionDirection = 'seed_to_ogn' | 'ogn_to_seed';

export interface ConversionTierStatus {
  direction: ConversionDirection;
  tierId: number;
  unlocked: boolean;
  usedToday: number;
  usedThisWeek: number;
  remainingToday: number;
  remainingThisWeek: number;
  canConvert: boolean;
}

export interface ConversionStatus {
  seedBalance: number;
  ognBalance: number;
  playerLevel: number;
  systemFrozen: boolean;
  userFrozen: boolean;
  cooldownRemaining: number;
  tiers: ConversionTierStatus[];
}

export interface ConversionRecord {
  id: string;
  direction: ConversionDirection;
  tierId: number;
  fromAmount: number;
  feeAmount: number;
  toAmount: number;
  seedBefore: number;
  seedAfter: number;
  ognBefore: number;
  ognAfter: number;
  playerLevel: number;
  createdAt: string;
}

export interface ConversionSuccessResult {
  success: true;
  conversion: ConversionRecord;
}

export interface ConversionHistoryResult {
  conversions: ConversionRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
