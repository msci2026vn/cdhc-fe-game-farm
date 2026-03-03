// ═══════════════════════════════════════════════════════════════
// Campaign Adapter — WorldBossInfo → CampaignBossData
// CampaignBossData defined in useMatch3Campaign.ts
// ═══════════════════════════════════════════════════════════════

import type { WorldBossInfo } from '../types/world-boss.types';
import { adaptWorldBossSkills } from './skill-mapper';

// Mirror CampaignBossData từ useMatch3Campaign.ts
export interface CampaignBossData {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  spritePath?: string;
  hp: number;
  attack: number;
  reward: number;
  xpReward: number;
  description: string;
  difficulty: string;
  unlockLevel: number;
  archetype: string;
  def: number;
  freq: number;
  healPercent: number;
  turnLimit: number;
  phases?: unknown[];
  skills?: ReturnType<typeof adaptWorldBossSkills>;
}

/**
 * Fallback values theo difficulty level
 * freq = số hits/lần boss attack bình thường
 */
const DIFFICULTY_DEFAULTS: Record<string, { freq: number; def: number; healPercent: number }> = {
  normal:       { freq: 2, def: 20,  healPercent: 0 },
  hard:         { freq: 3, def: 40,  healPercent: 0 },
  extreme:      { freq: 4, def: 55,  healPercent: 0 },
  catastrophic: { freq: 5, def: 70,  healPercent: 0 },
};

/**
 * WorldBossInfo (API) → CampaignBossData (campaign engine)
 *
 * Notes:
 * - hp = 999_999_999 vì World Boss không thể bị solo kill
 * - freq = số hits/attack từ difficulty defaults (campaign AI dùng freq như hit count)
 * - turnLimit = 0 (vô hạn — chơi đến hết session)
 * - phases = undefined (World Boss dùng hpPercent thresholds, không dùng phases)
 */
export function adaptWorldBossToCampaign(boss: WorldBossInfo): CampaignBossData {
  const difficulty = boss.difficulty ?? 'normal';
  const defaults = DIFFICULTY_DEFAULTS[difficulty] ?? DIFFICULTY_DEFAULTS.normal;

  return {
    id: boss.id,
    name: boss.bossName,
    emoji: elementToEmoji(boss.element),
    spritePath: boss.baseSprite,

    // HP cực cao — player không thể kill, session kết thúc bằng timer
    hp: 999_999_999,

    // Combat stats từ API hoặc fallback
    attack: boss.stats?.atk ?? 200,
    def: boss.stats?.def ?? defaults.def,
    freq: defaults.freq,
    healPercent: defaults.healPercent,

    // Session vô hạn
    turnLimit: 0,

    // Skills mapped từ API
    skills: adaptWorldBossSkills(boss.skills ?? []),

    // Không dùng phases
    phases: undefined,

    // Meta
    archetype: boss.element ?? 'chaos',
    difficulty,
    unlockLevel: 1,
    reward: 0,
    xpReward: 0,
    description: boss.storyPreview ?? boss.bossTitle ?? '',
  };
}

function elementToEmoji(element: string): string {
  switch (element) {
    case 'fire':    return '🔥';
    case 'ice':     return '❄️';
    case 'water':   return '💧';
    case 'wind':    return '🌪️';
    case 'poison':  return '☠️';
    default:        return '👹';
  }
}
