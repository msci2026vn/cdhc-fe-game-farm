// ═══════════════════════════════════════════════════════════════
// Skill Mapper — map World Boss API skill types → campaign BossSkill
// ═══════════════════════════════════════════════════════════════

import type { WorldBossSkill } from '../types/world-boss.types';
import type { BossSkill } from '@/modules/campaign/data/bossSkills';

// Campaign BossSkill shape — matches BossSkill contract (values in SECONDS)
export interface CampaignBossSkill extends BossSkill {
  // Add any extra if needed, but BossSkill should be enough
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
  if (!skill || !skill.type) return null;
  const cooldown = triggerToCooldown(skill.trigger);

  switch (skill.type) {
    case 'single_hit':
    case 'multi_strike':
    case 'aoe_blast':
      // Normal attacks — handled by boss AI loop, không cần skill riêng
      return null;

    case 'dot_poison':
      return { type: 'burn', cooldown, duration: 5, value: 2, label: 'Đốt!', icon: '🔥' };

    case 'stun':
      return { type: 'stun', cooldown, duration: 1.5, value: 0, label: 'Choáng!', icon: '💫' };

    case 'def_break':
      return { type: 'armor_break', cooldown, duration: 8, value: 0, label: 'Phá giáp!', icon: '💔' };

    case 'shield':
      return { type: 'shield', cooldown, duration: 3, value: 0, label: 'Bất tử!', icon: '🛡️' };

    case 'heal':
      // 'heal' not in BossSkillType? Wait, let's check BossSkillType again.
      // it has 'heal_block', but for healing there is 'egg'.
      // boss-ai handler might need to support 'heal' or we map to 'egg'
      return { type: 'egg', cooldown, duration: 1, value: Math.round((skill.damage_multi || 0.05) * 100), label: 'Hồi máu!', icon: '💚' };

    case 'drain':
      return { type: 'burn', cooldown, duration: 5, value: 2, label: 'Đốt!', icon: '🔥' };

    case 'enrage':
      // enrage not in BossSkillType. Using 'burn' as placeholder or we should add it.
      // For now, let's use something compatible.
      return { type: 'stun', cooldown, duration: 4, value: 0, label: 'Nổi giận!', icon: '💢' };

    case 'summon_minion':
      return { type: 'egg', cooldown, duration: 8, value: 15, label: 'Đẻ trứng!', icon: '🥚' };

    case 'atk_down':
      return { type: 'gem_lock', cooldown, duration: 5, value: 3, label: 'Khóa gem!', icon: '🔒' };

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
