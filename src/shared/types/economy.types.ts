// ═══════════════════════════════════════════════════════════════
// ECONOMY TYPES — Level, Stats, Conversion, VIP, Delivery
// ═══════════════════════════════════════════════════════════════

// ═══ LEVEL SYSTEM (Economy v2) ═══

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

// ═══ DAILY STATUS (Economy v2) ═══

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

// ═══ BOSS STATUS (Economy v2) ═══

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

// ═══ STAT SYSTEM (Phase 2) ═══

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

// ═══════════════════════════════════════════════════════════════
// VIP
// ═══════════════════════════════════════════════════════════════

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
  deliveriesPerDay: number;
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
  createdAt: string;
  confirmedAt: string | null;
  explorerUrl: string | null;
}

export interface VipStatus {
  isVip: boolean;
  tier: 'free' | 'standard' | 'premium';
  ognMultiplier: number;
  expiresAt: string | null;
  daysRemaining: number;
  deliveriesPerDay: number;
  subscription: {
    id: string;
    startsAt: string;
    expiresAt: string;
  } | null;
}

// ═══════════════════════════════════════════════════════════════
// Phase 4: Delivery Slots (My Garden)
// ═══════════════════════════════════════════════════════════════

export type DeliverySlotStatus = 'available' | 'claimed' | 'shipped' | 'delivered' | 'expired';

export interface DeliverySlot {
  id: string;
  slotNumber: number;
  status: DeliverySlotStatus;
  claimedAt: string | null;
  deliveredAt: string | null;
  blockchainTx: string | null;
  otpCode?: string | null;
  otpExpiresAt?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientAddress?: string | null;
  recipientNote?: string | null;
}

export interface MyGardenData {
  date: string;             // 'YYYY-MM-DD' — ngày hiện tại
  totalSlots: number;
  availableSlots: number;
  claimedSlots: number;
  vipTier: string;
  deliveriesPerDay: number;
  slots: DeliverySlot[];
  lastRecipientInfo: RecipientInfo | null;
}

export interface GardenSummary {
  isVip: boolean;
  tier?: string;
  date?: string;            // 'YYYY-MM-DD'
  totalSlots: number;
  availableSlots: number;
  claimedSlots?: number;
}

export interface DeliveryHistoryDay {
  date: string;             // 'YYYY-MM-DD'
  totalSlots: number;
  deliveredSlots: number;
  slots: DeliverySlot[];
}

// ═══════════════════════════════════════════════════════════════
// Phase 6C/6F: Delivery OTP + Verify + Blockchain Proof
// ═══════════════════════════════════════════════════════════════

export interface BatchInfo {
  batchId: string;
  product: string;
  farm: string;
  harvestDate: string;
}

export interface RecipientInfo {
  name: string;
  phone: string;
  address: string;
  note?: string;
}

export interface ClaimSlotRequest {
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientNote?: string;
}

export interface ClaimSlotResult {
  slotId: string;
  otpCode: string;
  batchInfo: BatchInfo;
  recipientInfo: RecipientInfo;
  expiresAt: string;
  message: string;
  isExisting?: boolean;
}

export interface ScanClaimRequest {
  slotId: string;
  otpCode: string;
  secretToken: string;
}

export interface ScanClaimResult {
  success: boolean;
  slotId: string;
  deliveredAt: string;
  deliveryHash: string;
  blockchainStatus: string;
  message: string;
}

export interface VerifyOtpResult {
  success: boolean;
  deliveryHash: string;
  blockchainStatus: 'pending' | 'submitted' | 'confirmed';
  claimMethod?: string;
  message?: string;
}

export interface SlotQrData {
  otpCode: string;
  qrDataUrl: string;
  batchInfo: BatchInfo;
  isVerified: boolean;
  expiresAt: string;
}

export interface DeliveryProof {
  status: 'not_delivered' | 'pending_blockchain' | 'verified';
  isVerified?: boolean;
  verifiedAt?: string;
  deliveryData?: {
    slotId: string;
    slotNumber: number;
    date: string;
    deliveredAt: string;
    product: string;
    farm: string;
    harvestDate: string;
    recipientId?: string;
  };
  deliveryHash?: string;
  blockchain?: {
    txHash: string;
    explorerUrl: string;
    deliveryHash: string;
    merkleProof: string[];
    merkleIndex: number;
    dataIntegrity: boolean;
    onChainVerified: boolean;
  };
}
