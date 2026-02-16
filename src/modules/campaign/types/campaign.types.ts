// ═══════════════════════════════════════════════════════════════
// Campaign Types — Zone Map + Zone Detail
// ═══════════════════════════════════════════════════════════════

export interface CampaignZone {
  zoneNumber: number;
  name: string;
  unlockLevel: number;
  maxLevel: number;
  isUnlocked: boolean;
  isZoneCleared: boolean;
  isPerfect: boolean;
  bossesCleared: number;
  totalBosses: number;
  totalStars: number;
  maxStars: number;
}

export interface ZoneBoss {
  id: string;
  bossNumber: number;
  name: string;
  emoji: string;
  tier: 'minion' | 'elite' | 'boss';
  archetype: string;
  hp: number;
  attack: number;
  reward: number;
  xpReward: number;
  isUnlocked: boolean;
  isCleared: boolean;
  bestStars: number;
  clearCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  unlockLevel: number;
  // Extended fields for Boss Detail (may come from API or static fallback)
  bestTurns?: number | null;
  bestHpPercent?: number | null;
}

export interface ZoneInfo {
  zoneNumber: number;
  name: string;
  unlockLevel: number;
  maxLevel: number;
  isUnlocked: boolean;
  isZoneCleared: boolean;
  totalStars: number;
  maxStars: number;
}

export type StageState = 'completed' | 'current' | 'locked';

export interface CampaignZonesResponse {
  zones: CampaignZone[];
}

export interface ZoneBossesResponse {
  zone: ZoneInfo;
  bosses: ZoneBoss[];
}
