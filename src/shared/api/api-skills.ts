// ═══════════════════════════════════════════════════════════════
// API SKILLS — Player skills: get levels, upgrade
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type { PlayerSkill, UpgradeSkillResult, SkillId } from '@/modules/campaign/types/skill.types';

export const skillsApi = {
  /**
   * Get all player skills with levels and upgrade info
   */
  getPlayerSkills: async (): Promise<PlayerSkill[]> => {
    const url = API_BASE_URL + '/api/game/skills';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getPlayerSkills');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data?.skills ?? json.data ?? [];
  },

  /**
   * Upgrade a skill to the next level
   */
  upgradeSkill: async (skillId: SkillId): Promise<UpgradeSkillResult> => {
    const url = API_BASE_URL + '/api/game/skills/upgrade';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId }),
    });

    if (response.status === 401) {
      handleUnauthorized('upgradeSkill');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },
};
