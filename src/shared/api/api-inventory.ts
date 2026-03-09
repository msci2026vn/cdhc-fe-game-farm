// ═══════════════════════════════════════════════════════════════
// API INVENTORY — Kho đồ, bán nông sản, OGN history
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type { InventoryResponse, SellResult, SellAllResult } from '../types/game-api.types';
import type { OgnHistoryResult } from '../types/game-api.types';

export const inventoryApi = {
  /**
   * Xem kho đồ — danh sách nông sản đã thu hoạch
   */
  getInventory: async (): Promise<InventoryResponse> => {
    const url = API_BASE_URL + '/api/game/inventory';
    console.log('[FARM-DEBUG] gameApi.getInventory():', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getInventory() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getInventory');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getInventory() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to fetch inventory: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getInventory() SUCCESS:', json);
    return json.data;
  },

  /**
   * Bán 1 nông sản — truyền UUID của inventory record
   */
  sellInventoryItem: async (id: string): Promise<SellResult> => {
    const url = API_BASE_URL + '/api/game/inventory/sell';
    console.log('[FARM-DEBUG] gameApi.sellInventoryItem():', { url, id });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    console.log('[FARM-DEBUG] gameApi.sellInventoryItem() status:', response.status);

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.sellInventoryItem() SUCCESS:', json);
    return json.data;
  },

  /**
   * Bán hết tất cả nông sản chưa hết hạn
   */
  sellAllInventory: async (): Promise<SellAllResult> => {
    const url = API_BASE_URL + '/api/game/inventory/sell-all';
    console.log('[FARM-DEBUG] gameApi.sellAllInventory():', url);

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.sellAllInventory() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('sellAllInventory');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.sellAllInventory() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to sell all: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.sellAllInventory() SUCCESS:', json);
    return json.data;
  },

  /**
   * Get OGN transaction history
   */
  getOgnHistory: async (limit = 50, offset = 0): Promise<OgnHistoryResult> => {
    const url = `${API_BASE_URL}/api/game/ogn/history?limit=${limit}&offset=${offset}`;
    console.log('[FARM-DEBUG] gameApi.getOgnHistory():', { url, limit, offset });

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getOgnHistory() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getOgnHistory');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getOgnHistory() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to fetch OGN history: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getOgnHistory() SUCCESS:', json);
    return json.data;
  },
};
