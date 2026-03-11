export interface WorldBossSkill {
  type: string        // mechanicId từ BE: dot_poison, aoe_blast, shield, heal, stun, etc.
  name: string
  description: string
  trigger: string     // normal, every_2_turns, every_3_turns, hp_below_50, hp_below_10, etc.
  damage_multi: number
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
  username?: string
  avatarUrl?: string
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

/** @deprecated Dùng WorldBossAttackPayload thay thế */
export interface WorldBossAttackData {
  eventId: string
  gemsMatched: number
  maxCombo: number
  specialGems: number
  score: number
}

export interface WorldBossAttackPayload {
  eventId: string
  damageDelta: number
  hits: number
  maxCombo: number
  final?: boolean
  username?: string
}

export interface WorldBossLiteData {
  active: boolean
  hpPercent?: number
  participantCount?: number
  timeRemaining?: number
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
    avatarUrl?: string
  }>
}

/** @deprecated Dùng WorldBossAttackResult mới bên dưới */
export interface WorldBossAttackResultLegacy {
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

export type WorldBossAttackResult =
  | { ok: true; hpPercent: number; rank: number | null; totalDamage?: number }
  | { ok: false; error: string; retryAfter?: number }
