// ═══════════════════════════════════════════════════════════════
// API FARM — Plots, Plant, Water, Harvest, Clear
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type { FarmPlotData, WaterResult, HarvestResult } from '../types/game-api.types';
import type { PlantTypeId } from '../types/game-api.types';

export const farmApi = {
  /**
   * Get all farm plots (bước 12 — real API)
   */
  getPlots: async () => {
    const url = API_BASE_URL + '/api/game/farm/plots';
    console.log('[FARM-DEBUG] gameApi.getPlots: Calling', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getPlots: Response status =', response.status);

    if (response.status === 401) {
      await handleUnauthorized('getPlots');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getPlots: ERROR =', error);
      throw new Error(error?.error?.message || `Failed to fetch plots: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getPlots: Response data =', json);
    return json.data; // { plots: [...], totalSlots: 6 }
  },

  /**
   * Plant a seed in a slot (bước 13 — real API)
   * BE Zod: { plantTypeId: enum['tomato','carrot','chili','wheat'], slotIndex: int 0-5 }
   */
  plantSeed: async (
    slotIndex: number,
    plantTypeId: PlantTypeId
  ): Promise<{ plot: FarmPlotData; ognRemaining: number; plantType: { name: string; emoji: string; growthDurationMs: number } }> => {
    const url = API_BASE_URL + '/api/game/farm/plant';
    console.log('[FARM-DEBUG] gameApi.plantSeed:', { url, slotIndex, plantTypeId });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotIndex, plantTypeId }),
    });

    console.log('[FARM-DEBUG] gameApi.plantSeed status:', response.status);

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.plantSeed data:', json);
    return json.data;
  },

  /**
   * Water a plot (bước 14 — real API)
   * BE Zod: { plotId: string uuid }
   */
  waterPlot: async (plotId: string): Promise<WaterResult> => {
    const url = API_BASE_URL + '/api/game/farm/water';
    const body = { plotId };

    console.log('[FARM-DEBUG] gameApi.waterPlot() — REQUEST', JSON.stringify({ url, plotId }));

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('[FARM-DEBUG] gameApi.waterPlot() — STATUS:', response.status);

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.waterPlot() — SUCCESS:', JSON.stringify(json.data));
    return json.data;
  },

  /**
   * Harvest a plot (bước 15 — real API)
   * BE Zod: { plotId: string uuid }
   */
  harvestPlot: async (plotId: string): Promise<HarvestResult> => {
    const url = API_BASE_URL + '/api/game/farm/harvest';
    const body = { plotId };

    console.log('[FARM-DEBUG] gameApi.harvestPlot() — REQUEST', JSON.stringify({ url, plotId }));

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('[FARM-DEBUG] gameApi.harvestPlot() — STATUS:', response.status);

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.harvestPlot() — SUCCESS:', JSON.stringify(json.data));
    return json.data;
  },

  /**
   * Clear dead plot (bước 23 — real API)
   * BE Zod: { plotId: string uuid }
   */
  clearPlot: async (plotId: string): Promise<{ cleared: boolean; plotId: string; slotIndex: number }> => {
    const url = API_BASE_URL + '/api/game/farm/clear';
    const body = { plotId };

    console.log('[FARM-DEBUG] gameApi.clearPlot() — REQUEST', JSON.stringify({ url, plotId }));

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('[FARM-DEBUG] gameApi.clearPlot() — STATUS:', response.status);

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.clearPlot() — SUCCESS:', JSON.stringify(json.data));
    return json.data;
  },
};
