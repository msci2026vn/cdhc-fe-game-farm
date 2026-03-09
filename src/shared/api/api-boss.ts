// ═══════════════════════════════════════════════════════════════
// API BOSS — Boss fights, progress, status
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type { BossFightInput, BossCompleteResult } from '../types/game-api.types';
import type { BossStatus } from '../types/game-api.types';

export const bossApi = {
  /**
   * Complete boss fight (bước 17 — real API)
   * BE Zod: { bossId: string, won: boolean, totalDamage: int 0-100000, durationSeconds: 0-3600 }
   */
  completeBoss: async (data: BossFightInput): Promise<BossCompleteResult> => {
    const url = API_BASE_URL + '/api/game/boss/complete';
    const timestamp = new Date().toISOString();
    console.log('[FARM-DEBUG] gameApi.completeBoss() — START', JSON.stringify({
      url,
      bossId: data.bossId,
      won: data.won,
      damage: data.totalDamage,
      timestamp,
      credentials: 'include',
      documentCookie: document.cookie || '(empty - httpOnly)',
    }));

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    console.log('[FARM-DEBUG] gameApi.completeBoss() status:', response.status);
    console.log('[FARM-DEBUG] gameApi.completeBoss() response headers:', {
      'set-cookie': response.headers.get('set-cookie'),
      'content-type': response.headers.get('content-type'),
    });

    if (response.status === 401) {
      handleUnauthorized('completeBoss');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.completeBoss() ERROR:', error);
      const err = new Error(error?.error?.message || `Failed to complete boss: ${response.status}`);
      (err as any).status = response.status;
      (err as any).code = error?.error?.code;
      throw err;
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.completeBoss() SUCCESS:', json);
    return json.data;
  },

  /**
   * Get boss progress (bước 17 — real API)
   */
  getBossProgress: async () => {
    const url = API_BASE_URL + '/api/game/boss/progress';
    console.log('[FARM-DEBUG] gameApi.getBossProgress():', url);

    const response = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getBossProgress() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getBossProgress');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getBossProgress() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to get boss progress: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getBossProgress() SUCCESS:', json);
    return json.data;
  },

  /**
   * Get boss status — cooldown, daily fights remaining
   */
  getBossStatus: async (): Promise<BossStatus> => {
    const url = API_BASE_URL + '/api/game/boss/status';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getBossStatus');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },
};
