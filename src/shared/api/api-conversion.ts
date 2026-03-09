// ═══════════════════════════════════════════════════════════════
// API CONVERSION — Seed ↔ OGN conversion
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type { ConversionStatus, ConversionSuccessResult, ConversionHistoryResult } from '../types/game-api.types';

export const conversionApi = {
  getConversionTiers: async (): Promise<ConversionStatus> => {
    const url = API_BASE_URL + '/api/conversion/tiers';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getConversionTiers');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  convertSeedToOgn: async (tierId: number): Promise<ConversionSuccessResult> => {
    const url = API_BASE_URL + '/api/conversion/seed-to-ogn';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId }),
    });

    if (response.status === 401) {
      handleUnauthorized('convertSeedToOgn');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json;
  },

  convertOgnToSeed: async (tierId: number): Promise<ConversionSuccessResult> => {
    const url = API_BASE_URL + '/api/conversion/ogn-to-seed';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId }),
    });

    if (response.status === 401) {
      handleUnauthorized('convertOgnToSeed');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json;
  },

  getConversionHistory: async (page = 1, limit = 5): Promise<ConversionHistoryResult> => {
    const url = `${API_BASE_URL}/api/conversion/history?page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getConversionHistory');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },
};
