// ═══════════════════════════════════════════════════════════════
// SOCIAL TYPES — Friends, Referral, Leaderboard
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

// ═══ FRIEND FARM (view-only) ═══

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

// ═══ REFERRAL ═══

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

// ═══ LEADERBOARD ═══

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
