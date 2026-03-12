// ═══════════════════════════════════════════════════════════════
// Skill Mapper — map World Boss API skill types → campaign BossSkill
// ═══════════════════════════════════════════════════════════════

import type { WorldBossSkill } from '../types/world-boss.types';

// Campaign BossSkill shape — matches BossSkill contract (values in SECONDS)
export interface CampaignBossSkill {
  type: 'burn' | 'stun' | 'armor_break' | 'shield' | 'heal' | 'enrage' | 'egg' | 'gem_lock';
  cooldown: number;     // s (giây) — setupBossSkillsInterval nhân * 1000 nội bộ
  duration?: number;    // s (giây) — setupBossSkillsInterval nhân * 1000 nội bộ
  healPercent?: number; // fraction: 0.05 = 5%
}

/**
 * Map trigger string → cooldown in SECONDS
 */
function triggerToCooldown(trigger: string): number {
  switch (trigger) {
    case 'first_turn':    return 5;
    case 'every_2_turns': return 15;
    case 'every_3_turns': return 25;
    case 'hp_below_75':   return 30;
    case 'hp_below_50':   return 25;
    case 'hp_below_30':   return 20;
    case 'hp_below_10':   return 15;
    default:              return 20;
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
      return { type: 'burn', cooldown, duration: 5 };

    case 'stun':
      return { type: 'stun', cooldown, duration: 1.5 };

    case 'def_break':
      return { type: 'armor_break', cooldown, duration: 8 };

    case 'shield':
      return { type: 'shield', cooldown, duration: 3 };

    case 'heal':
      return { type: 'heal', cooldown, healPercent: skill.damage_multi || 0.05 };

    case 'drain':
      return { type: 'burn', cooldown, duration: 5 };

    case 'enrage':
      return { type: 'enrage', cooldown, duration: 4 };

    case 'summon_minion':
      return { type: 'egg', cooldown, duration: 8 };

    case 'atk_down':
      return { type: 'gem_lock', cooldown, duration: 5 };

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
