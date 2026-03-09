// ═══════════════════════════════════════════════════════════════
// Auto-play self-learning weight adjuster — adjusts gem weights
// per archetype based on win/loss history. VIP Lv5 only.
// ═══════════════════════════════════════════════════════════════

// ═══ Types ═══

/** Multiplier weights per archetype — stored in localStorage */
export interface LearnedWeights {
  atk: number;
  hp: number;
  def: number;
  star: number;
}

/** Battle stats fed to learner after each fight */
export interface BattleStats {
  won: boolean;
  bossArchetype: string;
  bossId: number;
  totalTurns: number;
  turnLimit: number;
  gemsUsed: { atk: number; hp: number; def: number; star: number };
  playerHPPercent: number;
  dodgesUsed: number;
  ultsUsed: number;
  timeSeconds: number;
}

interface BattleRecord {
  wins: number;
  losses: number;
  totalBattles: number;
}

interface LearnerData {
  version: number;
  weights: Record<string, LearnedWeights>;
  battleHistory: Record<string, BattleRecord>;
  lastUpdated: string;
}

// ═══ Constants ═══

const STORAGE_KEY = 'farmverse-autoplay-learner';
const LEARNING_RATE_WIN = 0.04;
const LEARNING_RATE_LOSE = 0.05;
const MIN_MULTIPLIER = 0.5;
const MAX_MULTIPLIER = 2.0;
const DEFAULT_MULTIPLIER = 1.0;
const DECAY_INTERVAL = 20;
const DECAY_RATE = 0.02;

const GEM_KEYS: (keyof LearnedWeights)[] = ['atk', 'hp', 'def', 'star'];

const defaultWeights = (): LearnedWeights => ({
  atk: DEFAULT_MULTIPLIER,
  hp: DEFAULT_MULTIPLIER,
  def: DEFAULT_MULTIPLIER,
  star: DEFAULT_MULTIPLIER,
});

const defaultData = (): LearnerData => ({
  version: 1,
  weights: {},
  battleHistory: {},
  lastUpdated: new Date().toISOString(),
});

// ═══ localStorage helpers ═══

function load(): LearnerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return defaultData();
    return parsed as LearnerData;
  } catch {
    return defaultData();
  }
}

function save(data: LearnerData): void {
  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* localStorage unavailable — silently skip */ }
}

function clamp(v: number): number {
  return Math.min(MAX_MULTIPLIER, Math.max(MIN_MULTIPLIER, v));
}

// ═══ Core: rank gems by usage ═══

function rankGems(gemsUsed: BattleStats['gemsUsed']): (keyof LearnedWeights)[] {
  return [...GEM_KEYS].sort((a, b) => gemsUsed[b] - gemsUsed[a]);
}

// ═══ Exported functions ═══

export function onBattleEnd(stats: BattleStats): void {
  const total = stats.gemsUsed.atk + stats.gemsUsed.hp + stats.gemsUsed.def + stats.gemsUsed.star;
  if (total === 0) return; // extremely short fight — skip

  const data = load();
  const arch = stats.bossArchetype;
  const w = data.weights[arch] ?? defaultWeights();
  const hist = data.battleHistory[arch] ?? { wins: 0, losses: 0, totalBattles: 0 };
  const ranked = rankGems(stats.gemsUsed);

  if (stats.won) {
    // Reinforce top 2 gem types used
    const rate = stats.playerHPPercent > 70 ? LEARNING_RATE_WIN * 1.5 : LEARNING_RATE_WIN;
    w[ranked[0]] = clamp(w[ranked[0]] * (1 + rate));
    w[ranked[1]] = clamp(w[ranked[1]] * (1 + rate * 0.5));

    // Fast win bonus: boost ATK & Star
    if (stats.turnLimit > 0 && stats.totalTurns < stats.turnLimit * 0.5) {
      w.atk = clamp(w.atk * (1 + 0.02));
      w.star = clamp(w.star * (1 + 0.02));
    }
    hist.wins++;
  } else {
    // Penalize most-used, boost least-used
    w[ranked[0]] = clamp(w[ranked[0]] * (1 - LEARNING_RATE_LOSE));
    w[ranked[3]] = clamp(w[ranked[3]] * (1 + LEARNING_RATE_LOSE * 0.5));

    // Died (HP=0) → reinforce survival
    if (stats.playerHPPercent === 0) {
      w.hp = clamp(w.hp * (1 + 0.02));
      w.def = clamp(w.def * (1 + 0.02));
    }
    // Turn limit exceeded → reinforce DPS
    if (stats.turnLimit > 0 && stats.totalTurns >= stats.turnLimit) {
      w.atk = clamp(w.atk * (1 + 0.02));
      w.star = clamp(w.star * (1 + 0.02));
    }
    hist.losses++;
  }

  hist.totalBattles++;

  // Decay toward 1.0 every DECAY_INTERVAL battles
  if (hist.totalBattles % DECAY_INTERVAL === 0) {
    for (const k of GEM_KEYS) {
      w[k] = clamp(w[k] + (DEFAULT_MULTIPLIER - w[k]) * DECAY_RATE);
    }
  }

  data.weights[arch] = w;
  data.battleHistory[arch] = hist;
  save(data);
}

export function getLearnedWeights(archetype: string): LearnedWeights {
  const data = load();
  return data.weights[archetype] ?? defaultWeights();
}

export function resetWeights(archetype?: string): void {
  const data = load();
  if (archetype) {
    data.weights[archetype] = defaultWeights();
    delete data.battleHistory[archetype];
  } else {
    data.weights = {};
    data.battleHistory = {};
  }
  save(data);
}

export function getLearningSummary(): Record<
  string,
  { weights: LearnedWeights; wins: number; losses: number; insights: string }
> {
  const data = load();
  const result: Record<string, { weights: LearnedWeights; wins: number; losses: number; insights: string }> = {};

  for (const arch of Object.keys(data.weights)) {
    const w = data.weights[arch];
    const h = data.battleHistory[arch] ?? { wins: 0, losses: 0, totalBattles: 0 };
    const parts: string[] = [];
    for (const k of GEM_KEYS) {
      const diff = Math.round((w[k] - DEFAULT_MULTIPLIER) * 100);
      if (diff !== 0) parts.push(`${k.toUpperCase()} ${diff > 0 ? '↑' : '↓'}${Math.abs(diff)}%`);
    }
    result[arch] = {
      weights: { ...w },
      wins: h.wins,
      losses: h.losses,
      insights: parts.length > 0 ? parts.join(', ') : 'No adjustments yet',
    };
  }

  return result;
}
