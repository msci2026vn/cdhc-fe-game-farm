// ═══════════════════════════════════════════════════════════════
// usePlayerSkills — TanStack Query hooks for player skills
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsApi } from '@/shared/api/api-skills';
import type { PlayerSkill, SkillId, PlayerSkillLevels } from '@/modules/campaign/types/skill.types';

const PLAYER_SKILLS_KEY = ['playerSkills'] as const;

/**
 * Fetch all player skills
 */
export function usePlayerSkills() {
  return useQuery<PlayerSkill[]>({
    queryKey: PLAYER_SKILLS_KEY,
    queryFn: () => skillsApi.getPlayerSkills(),
    staleTime: 60_000,
    retry: 2,
  });
}

/**
 * Quick selector: get skill levels as { sam_dong, ot_hiem, rom_boc }
 */
export function useSkillLevels(): PlayerSkillLevels {
  const { data } = usePlayerSkills();
  if (!data) return { sam_dong: 1, ot_hiem: 0, rom_boc: 0 };

  const levels: PlayerSkillLevels = { sam_dong: 1, ot_hiem: 0, rom_boc: 0 };
  for (const s of data) {
    if (s.skillId in levels) {
      levels[s.skillId] = s.level;
    }
  }
  return levels;
}

/**
 * Upgrade a skill mutation
 */
export function useUpgradeSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (skillId: SkillId) => skillsApi.upgradeSkill(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYER_SKILLS_KEY });
      // Also refresh profile (OGN may have changed)
      queryClient.invalidateQueries({ queryKey: ['playerProfile'] });
    },
  });
}
