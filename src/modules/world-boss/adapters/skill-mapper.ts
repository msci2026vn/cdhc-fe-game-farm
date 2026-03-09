// ═══════════════════════════════════════════════════════════════
// Skill Mapper — map World Boss API skill types → campaign BossSkill
// ═══════════════════════════════════════════════════════════════

import type { WorldBossSkill } from '../types/world-boss.types';

// Campaign BossSkill shape (inline — bossSkills.ts doesn't exist yet)
export interface CampaignBossSkill {
  type: 'burn' | 'stun' | 'armor_break' | 'shield' | 'heal' | 'enrage' | 'egg' | 'gem_lock';
  cooldown: number;     // ms
  duration?: number;    // ms
  healPercent?: number; // fraction: 0.05 = 5%
}

/**
 * Map trigger string → cooldown ms
 */
function triggerToCooldown(trigger: string): number {
  switch (trigger) {
    case 'first_turn':    return 5_000;
    case 'every_2_turns': return 15_000;
    case 'every_3_turns': return 25_000;
    case 'hp_below_75':   return 30_000;
    case 'hp_below_50':   return 25_000;
    case 'hp_below_30':   return 20_000;
    case 'hp_below_10':   return 15_000;
    default:              return 20_000;
  }
}

/**
 * Map single BE skill type → CampaignBossSkill
 * Returns null for types handled natively by boss AI loop (single_hit, multi_strike, aoe_blast)
 */
function mapSkill(skill: WorldBossSkill): CampaignBossSkill | null {
  const cooldown = triggerToCooldown(skill.trigger);

  switch (skill.type) {
    case 'single_hit':
    case 'multi_strike':
    case 'aoe_blast':
      // Normal attacks — handled by boss AI loop, không cần skill riêng
      return null;

    case 'dot_poison':
      return { type: 'burn', cooldown, duration: 5_000 };

    case 'stun':
      return { type: 'stun', cooldown, duration: 1_500 };

    case 'def_break':
      return { type: 'armor_break', cooldown, duration: 8_000 };

    case 'shield':
      return { type: 'shield', cooldown, duration: 3_000 };

    case 'heal':
      return { type: 'heal', cooldown, healPercent: skill.damage_multi || 0.05 };

    case 'drain':
      return { type: 'burn', cooldown, duration: 5_000 };

    case 'enrage':
      return { type: 'enrage', cooldown, duration: 4_000 };

    case 'summon_minion':
      return { type: 'egg', cooldown, duration: 8_000 };

    case 'atk_down':
      return { type: 'gem_lock', cooldown, duration: 5_000 };

    default:
      console.warn(`[SkillMapper] Unknown skill type: ${skill.type}`);
      return null;
  }
}

/**
 * Map array of WorldBossSkill → CampaignBossSkill[]
 */
export function adaptWorldBossSkills(apiSkills: WorldBossSkill[]): CampaignBossSkill[] {
  return apiSkills.map(mapSkill).filter((s): s is CampaignBossSkill => s !== null);
}
