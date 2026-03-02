export interface WorldBossSkill {
  mechanicId: string
  name: string
  description: string
}

export interface WorldBossFeedEntry {
  type: string
  userId: string
  username?: string
  damage: number
  isCrit?: boolean
  timestamp: number
}

export interface WorldBossLeaderboardEntry {
  userId: string
  damage: number
}

export interface WorldBossVisualVariant {
  color_shift: string
  scale: number
  aura: string
  glow_color: string
}

export interface WorldBossStats {
  hp: number
  max_hp: number
  atk: number
  def: number
  crit_rate: number
}

export interface WorldBossInfo {
  id: string
  bossName: string
  bossTitle: string
  element: 'fire' | 'ice' | 'water' | 'wind' | 'poison' | 'chaos'
  weakness: string
  baseSprite: string
  difficulty: 'normal' | 'hard' | 'extreme' | 'catastrophic'
  durationMinutes: number
  startedAt: string
  currentHp: number
  hpPercent: number
  participantCount: number
  stats: WorldBossStats
  skills: WorldBossSkill[]
  visualVariant: WorldBossVisualVariant
  storyPreview: string | null
  storyFull: string | null
  leaderboard: WorldBossLeaderboardEntry[]
  feed: WorldBossFeedEntry[]
}

export interface WorldBossData {
  active: boolean
  boss?: WorldBossInfo
}

export interface WorldBossAttackData {
  eventId: string
  gemsMatched: number
  maxCombo: number
  specialGems: number
  score: number
}

export interface WorldBossMyRewards {
  participation: {
    totalDamage: number
    rank: number
    hitsCount: number
  } | null
  rewards: Array<{
    rewardTier: string
    rewardType: string
    xpAmount: number
    ognAmount: number
    itemRewards: unknown[] | null
    claimed: boolean
  }>
}

export interface WorldBossHistoryEntry {
  id: string
  bossName: string
  bossTitle?: string
  element: string
  baseSprite?: string
  difficulty: string
  status: string
  startedAt: string
  endedAt: string | null
  totalParticipants: number
  totalDamageDealt: number
}

export interface WorldBossHistoryResponse {
  bosses: WorldBossHistoryEntry[]
}

export interface WorldBossHistoryLeaderboard {
  source: 'history' | 'live'
  leaderboard: Array<{
    id: string
    eventId: string
    userId: string
    totalDamage: number
    hitsCount: number
    maxCombo: number
    bestSingleHit: number
    rank: number
    username?: string
  }>
}

export interface WorldBossAttackResult {
  success: boolean
  damage: number
  isCrit: boolean
  bossHp: number
  bossDefeated: boolean
  userTotalDamage?: number
  cooldownSeconds?: number
  error?: string
  retryAfter?: number
}
