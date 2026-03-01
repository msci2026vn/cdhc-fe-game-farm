// ═══════════════════════════════════════════════════════════════
// Auto-play API — purchase & status endpoints
// Backend routes TBD — stubs ready for integration
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, API_BASE_URL } from './api-utils';

export interface AutoPlayStatus {
  purchasedLevels: number[];
  activeLevel: number;
}

export interface AutoPlayPurchaseResult {
  success: boolean;
  level: number;
  txHash?: string;
}

export const autoPlayApi = {
  getStatus: async (): Promise<AutoPlayStatus> => {
    const response = await fetch(API_BASE_URL + '/api/game/auto-play/status', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) {
      handleUnauthorized('autoPlayStatus');
      throw new Error('Session expired');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error?.message || `Failed: ${response.status}`);
    }
    const json = await response.json();
    return json.data;
  },

  purchase: async (level: number, txHash?: string): Promise<AutoPlayPurchaseResult> => {
    const response = await fetch(API_BASE_URL + '/api/game/auto-play/purchase', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, txHash }),
    });
    if (response.status === 401) {
      handleUnauthorized('autoPlayPurchase');
      throw new Error('Session expired');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error?.message || `Failed: ${response.status}`);
    }
    const json = await response.json();
    return json.data;
  },
};
