// ═══════════════════════════════════════════════════════════════
// Achievement types — achievements, login streak, combo leaderboard
// ═══════════════════════════════════════════════════════════════

export type AchievementCategory = 'campaign' | 'combat' | 'collection' | 'farming' | 'social';

export interface Achievement {
  id: number;
  achievementKey: string;
  name: string;
  description: string;
  category: AchievementCategory;
  conditionType: string;
  conditionValue: number;
  rewardOgn: number;
  rewardTitle?: string;
  rewardFragmentTier?: string;
  rewardFragmentCount?: number;
  isHidden: boolean;
  sortOrder: number;
  progress: number;
  isUnlocked: boolean;
  isClaimed: boolean;
}

export interface LoginStreak {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  monthlyDay: number;
  milestones: LoginMilestone[];
  todayReward: { ogn: number; fragment?: string } | null;
}

export interface LoginMilestone {
  day: number;
  ogn: number;
  fragmentTier?: string;
  fragmentCount?: number;
  title?: string;
  isClaimed: boolean;
}

export interface ComboLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar?: string;
  maxCombo: number;
  bossName?: string;
  zoneNumber?: number;
  stars?: number;
  updatedAt: string;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

export const CATEGORY_CONFIG: Record<AchievementCategory, { emoji: string; color: string; label: string }> = {
  campaign: { emoji: '⚔️', color: '#ef4444', label: 'campaign.achievements.category_campaign' },
  combat: { emoji: '💥', color: '#f59e0b', label: 'campaign.achievements.category_combat' },
  collection: { emoji: '🧩', color: '#3b82f6', label: 'campaign.achievements.category_collection' },
  farming: { emoji: '🌾', color: '#22c55e', label: 'campaign.achievements.category_farming' },
  social: { emoji: '👥', color: '#a855f7', label: 'campaign.achievements.category_social' },
};

export const STREAK_MILESTONES = [
  { day: 1, ogn: 50, fragment: null },
  { day: 3, ogn: 100, fragment: null },
  { day: 7, ogn: 200, fragment: { tier: 'common', count: 1 } },
  { day: 14, ogn: 500, fragment: { tier: 'rare', count: 1 } },
  { day: 21, ogn: 1000, fragment: { tier: 'rare', count: 2 } },
  { day: 28, ogn: 2000, fragment: { tier: 'legendary', count: 1 }, title: 'campaign.streak.milestone_28' },
] as const;

export const DAILY_OGN = 30;
