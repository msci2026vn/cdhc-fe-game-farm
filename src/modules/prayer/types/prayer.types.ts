// ============================================================
// PRAYER API TYPES — Matches backend response contracts
// ============================================================

export interface PrayerStatusResponse {
  freeUsed: number;
  freeMax: number;
  customUsed: number;
  customMax: number;
  cooldownRemaining: number;
  canPray: boolean;
  currentStreak: number;
  totalPrayers: number;
  globalCount: number;
}

export interface PrayerOfferResponse {
  prayerId: string;
  ognReward: number;
  xpReward: number;
  multiplier: number;
  prayerHash: string;
  globalCount: number;
  milestone?: number;
}

export interface PrayerPreset {
  id: string;
  text: string;
  category: string;
}

export interface PrayerHistoryItem {
  id: string;
  text: string;
  type: 'preset' | 'custom';
  category: string | null;
  ognReward: number;
  xpReward: number;
  multiplier: number;
  prayerHash: string | null;
  batchStatus: string | null;
  txHash: string | null;
  createdAt: string;
}

export interface PrayerLeaderboardEntry {
  userId: string;
  userName: string;
  picture?: string | null;
  avatarUrl?: string | null;
  gmailAvatar?: string | null;
  gmailName?: string | null;
  totalPrayers: number;
  currentStreak: number;
  rank: number;
}

export interface PrayerGlobalResponse {
  totalPrayers: number;
  totalUsers: number;
  totalBatches: number;
  todayPrayers: number;
  nextMilestone: number;
}

export interface PrayerCategoryInfo {
  category: string;
  count: number;
  label: string;
}

export interface PrayerOfferPayload {
  type: 'preset' | 'custom';
  text?: string;
  presetId?: string;
}
