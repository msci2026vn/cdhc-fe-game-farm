// ═══════════════════════════════════════════════════════════════
// API ECONOMY — Level, daily status, stats, auto-allocate
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type {
  LevelInfo,
  LevelUpResult,
  DailyStatus,
  StatInfo,
  AllocateStatsResponse,
  ResetStatsResponse,
} from '../types/game-api.types';
import type { AllocateStatsRequest, AutoSettingRequest } from '../types/game-api.types';

export const economyApi = {
  // ═══ LEVEL SYSTEM (Economy v2) ═══

  /**
   * Get level info — tier progress, fees, can level up
   */
  getLevelInfo: async (): Promise<LevelInfo> => {
    const url = API_BASE_URL + '/api/game/player/level-info';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getLevelInfo');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Manual level-up — pay OGN fee to level up
   */
  levelUp: async (): Promise<LevelUpResult> => {
    const url = API_BASE_URL + '/api/game/player/level-up';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('levelUp');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Get daily status — XP cap, boss fights, sync caps
   */
  getDailyStatus: async (): Promise<DailyStatus> => {
    const url = API_BASE_URL + '/api/game/player/daily-status';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getDailyStatus');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  // ═══ STAT SYSTEM (Phase 2) ═══

  /**
   * Get stat info — stats, effective stats, free points, milestones, reset info
   */
  getStatInfo: async (): Promise<StatInfo> => {
    const url = API_BASE_URL + '/api/game/stat/info';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getStatInfo');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Allocate stat points manually
   */
  allocateStats: async (allocation: AllocateStatsRequest): Promise<AllocateStatsResponse> => {
    const url = API_BASE_URL + '/api/game/stat/allocate';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allocation),
    });

    if (response.status === 401) {
      handleUnauthorized('allocateStats');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Auto-allocate stat points by preset
   */
  autoAllocateStats: async (preset: 'attack' | 'defense' | 'balance'): Promise<AllocateStatsResponse> => {
    const url = API_BASE_URL + '/api/game/stat/auto-allocate';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset }),
    });

    if (response.status === 401) {
      handleUnauthorized('autoAllocateStats');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Reset all stats — costs OGN, increases weekly
   */
  resetStats: async (): Promise<ResetStatsResponse> => {
    const url = API_BASE_URL + '/api/game/stat/reset';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.status === 401) {
      handleUnauthorized('resetStats');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Update auto-allocation setting (preset + enabled)
   */
  updateAutoSetting: async (setting: AutoSettingRequest): Promise<{ success: boolean }> => {
    const url = API_BASE_URL + '/api/game/stat/auto-setting';

    const response = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setting),
    });

    if (response.status === 401) {
      handleUnauthorized('updateAutoSetting');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json;
  },
};
