import { API_BASE_URL, handleUnauthorized } from './api-utils';
import type {
  WorldBossData,
  WorldBossAttackPayload,
  WorldBossAttackResult,
  WorldBossLiteData,
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

  attack: async (data: WorldBossAttackPayload): Promise<WorldBossAttackResult> => {
    const response = await fetch(API_BASE_URL + '/api/world-boss/attack', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: data.eventId,
        damageDelta: data.damageDelta,
        hits: data.hits,
        maxCombo: data.maxCombo,
        final: data.final ?? false,
        username: data.username,
      }),
    });
    if (response.status === 401) {
      handleUnauthorized('worldBoss.attack');
      throw new Error('Session expired');
    }
    // 429 on_cooldown — đọc retryAfter thay vì throw
    // Cho phép sendBatch tích lũy damage và thử lại ở interval tiếp theo
    if (response.status === 429) {
      const errData = await response.json().catch(() => ({}));
      return { ok: false, error: 'on_cooldown', retryAfter: errData.retryAfter ?? 2.5 } as WorldBossAttackResult;
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}`);
    }
    const json = await response.json();
    return json.data ?? json;
  },

  getLite: async (): Promise<WorldBossLiteData> => {
    const response = await fetch(API_BASE_URL + '/api/world-boss/current/lite', {
      credentials: 'include',
    });
    if (response.status === 401) {
      handleUnauthorized('worldBoss.getLite');
      throw new Error('Session expired');
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.json();
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
