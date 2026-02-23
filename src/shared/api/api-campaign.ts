// ═══════════════════════════════════════════════════════════════
// API CAMPAIGN — Campaign zones, bosses, battles, weekly boss
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type { WeeklyBossInfo } from '../types/game-api.types';

export const campaignApi = {
  /**
   * Get all campaign zones with progress
   */
  getCampaignZones: async (): Promise<{ zones: import('@/modules/campaign/types/campaign.types').CampaignZone[] }> => {
    const url = API_BASE_URL + '/api/game/boss/campaign/zones';
    console.log('[FARM-DEBUG] gameApi.getCampaignZones():', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getCampaignZones');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Get bosses for a specific campaign zone
   */
  getZoneBosses: async (zoneNumber: number): Promise<{
    zone: import('@/modules/campaign/types/campaign.types').ZoneInfo;
    bosses: import('@/modules/campaign/types/campaign.types').ZoneBoss[];
  }> => {
    const url = `${API_BASE_URL}/api/game/boss/campaign/zones/${zoneNumber}/bosses`;
    console.log('[FARM-DEBUG] gameApi.getZoneBosses():', { url, zoneNumber });

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getZoneBosses');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Start a campaign battle session
   */
  startCampaignBattle: async (bossId: string): Promise<{ sessionId: string }> => {
    const url = API_BASE_URL + '/api/game/boss/battle/start';
    console.log('[FARM-DEBUG] gameApi.startCampaignBattle():', { url, bossId });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bossId }),
    });

    if (response.status === 401) {
      handleUnauthorized('startCampaignBattle');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Get weekly boss rotation info
   */
  getWeeklyBoss: async (): Promise<WeeklyBossInfo> => {
    const url = API_BASE_URL + '/api/game/boss/weekly';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getWeeklyBoss');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },
};
