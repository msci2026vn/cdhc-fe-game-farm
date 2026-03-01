// ═══════════════════════════════════════════════════════════════
// GAMEPLAY TYPES — Boss, Quiz, Weather, Sync
// ═══════════════════════════════════════════════════════════════

// ═══ BOSS ═══

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

export interface BattleLogTurn {
  turn: number;
  situation: string;
  scoreBefore: number;
  action: 'swap' | 'dodge' | 'ult' | 'skill';
  gemType?: string;
}

export interface BattleLog {
  gemsUsed: { atk: number; hp: number; def: number; star: number };
  situationsEncountered: string[];
  turns?: BattleLogTurn[];  // Only Lv4-5
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
  // Unique session ID from /boss/battle/start — prevents race condition on retry
  battleSessionId?: string;
  // Auto-play tracking (B4)
  ultsUsed?: number;
  autoAILevel?: number;
  battleLog?: BattleLog;
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
  } | null;
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
  // Reward reduction (after daily threshold)
  isReducedReward?: boolean;
  xpMultiplier?: number;
  ognMultiplier?: number;
  dailyFightsUsed?: number;
  dailyFightsMax?: number;
  dailyBattlesMax?: number;
  // Damage verification
  wasAdjusted?: boolean;
  // Fragment drop (Prompt 6)
  drop?: {
    dropped: boolean;
    fragment?: {
      fragmentKey: string;
      name: string;
      tier: 'common' | 'rare' | 'legendary';
      zoneNumber: number;
    };
    pityCounter: number;
    guaranteedIn: number;
  };
}

// ═══ QUIZ ═══

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

export type QuizAnswer = 'A' | 'B' | 'C' | 'D';

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

// ═══ WEATHER ═══

export type WeatherCondition = 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'wind' | 'cold' | 'hot';

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

// ═══ SYNC ═══

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
