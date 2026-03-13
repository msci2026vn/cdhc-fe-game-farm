// ═══════════════════════════════════════════════════════════════
// CORE TYPES — Player, Auth, Health
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

export interface PingResult {
  success: boolean;
  message: string;
}

export interface AuthStatus {
  isLoggedIn: boolean;
  isAdmin?: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    picture: string | null;
    role?: string;
    fullName?: string;    // Fallback for Google Auth
    avatarUrl?: string;   // Fallback for some APIs
    avatar?: string;      // Fallback for consistency with FriendData
    walletAddress?: string | null;
  } | null;
}
