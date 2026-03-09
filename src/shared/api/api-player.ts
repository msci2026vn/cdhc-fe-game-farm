// ═══════════════════════════════════════════════════════════════
// API PLAYER — Profile
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, API_BASE_URL } from './api-utils';
import type { PlayerProfile } from '../types/game-api.types';

export const playerApi = {
  /**
   * Get player profile (bước 9 — real API)
   */
  getProfile: async (): Promise<PlayerProfile | null> => {
    try {
      const response = await fetch(API_BASE_URL + '/api/game/player/profile', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        // Session expired — redirect to login
        handleUnauthorized('getProfile');
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      return json.data; // { userId, xp, level, ogn, ... }
    } catch (error) {
      console.error('[GameAPI] getProfile failed:', error);
      return null;
    }
  },
};
