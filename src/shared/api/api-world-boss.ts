import { API_BASE_URL, handleUnauthorized } from './api-utils';
import type {
  WorldBossData,
  WorldBossAttackData,
  WorldBossAttackResult,
  WorldBossMyRewards,
  WorldBossHistoryResponse,
  WorldBossHistoryLeaderboard,
} from '@/modules/world-boss/types/world-boss.types';

export const worldBossApi = {
  getCurrent: async (): Promise<WorldBossData> => {
    const response = await fetch(API_BASE_URL + '/api/world-boss/current', {
      credentials: 'include',
    });
    if (response.status === 401) {
      handleUnauthorized('worldBoss.getCurrent');
      throw new Error('Session expired');
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.json();
  },

  attack: async (data: WorldBossAttackData): Promise<WorldBossAttackResult> => {
    const response = await fetch(API_BASE_URL + '/api/world-boss/attack', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (response.status === 401) {
      handleUnauthorized('worldBoss.attack');
      throw new Error('Session expired');
    }
    // 429 cooldown and 410 boss dead — parse body instead of throwing
    if (response.status === 429 || response.status === 410) {
      const json = await response.json().catch(() => ({}));
      return { success: false, damage: 0, isCrit: false, bossHp: 0, bossDefeated: false, ...json };
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}`);
    }
    const json = await response.json();
    return json.data ?? json;
  },

  getMyRewards: async (eventId: string): Promise<WorldBossMyRewards> => {
    const response = await fetch(API_BASE_URL + `/api/world-boss/my-rewards/${eventId}`, {
      credentials: 'include',
    });
    if (response.status === 401) {
      handleUnauthorized('worldBoss.getMyRewards');
      throw new Error('Session expired');
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.json();
  },

  getHistory: async (limit = 10): Promise<WorldBossHistoryResponse> => {
    const response = await fetch(API_BASE_URL + `/api/world-boss/history?limit=${limit}`, {
      credentials: 'include',
    });
    if (response.status === 401) {
      handleUnauthorized('worldBoss.getHistory');
      throw new Error('Session expired');
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.json();
  },

  getHistoryLeaderboard: async (eventId: string): Promise<WorldBossHistoryLeaderboard> => {
    const response = await fetch(API_BASE_URL + `/api/world-boss/leaderboard/${eventId}`, {
      credentials: 'include',
    });
    if (response.status === 401) {
      handleUnauthorized('worldBoss.getHistoryLeaderboard');
      throw new Error('Session expired');
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.json();
  },
};
