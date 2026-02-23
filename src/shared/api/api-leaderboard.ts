// ═══════════════════════════════════════════════════════════════
// API LEADERBOARD
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, API_BASE_URL } from './api-utils';
import type { LeaderboardResult } from '../types/game-api.types';

export const leaderboardApi = {
  /**
   * Get leaderboard (bước 21 — real API)
   */
  getLeaderboard: async (
    sort: 'ogn' | 'xp' | 'level' | 'harvests' = 'ogn',
    page = 1,
    limit = 20
  ): Promise<LeaderboardResult> => {
    const url = `${API_BASE_URL}/api/game/leaderboard?sort=${sort}&page=${page}&limit=${limit}`;
    console.log('[FARM-DEBUG] gameApi.getLeaderboard():', { url, sort, page, limit });

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getLeaderboard() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getLeaderboard');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getLeaderboard() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to fetch leaderboard: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getLeaderboard() SUCCESS:', {
      total: json.data.total,
      myRank: json.data.myRank,
      sort: json.data.sort,
    });
    return json.data;
  },
};
