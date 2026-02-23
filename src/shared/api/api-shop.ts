// ═══════════════════════════════════════════════════════════════
// API SHOP — Shop items, buy
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type { ShopItemData, BuyResult } from '../types/game-api.types';

export const shopApi = {
  /**
   * Get shop items and inventory (bước 19 — real API)
   */
  getShopItems: async (): Promise<{ items: ShopItemData[] }> => {
    const url = API_BASE_URL + '/api/game/shop/items';
    console.log('[FARM-DEBUG] gameApi.getShopItems():', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getShopItems() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getShopItems');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getShopItems() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to fetch shop items: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getShopItems() SUCCESS:', json);
    return json.data;
  },

  /**
   * Buy an item from shop (bước 19 — real API)
   * BE Zod: { itemId: string, quantity?: int 1-99, default 1 }
   */
  buyItem: async (itemId: string, quantity?: number): Promise<BuyResult> => {
    const url = API_BASE_URL + '/api/game/shop/buy';
    console.log('[FARM-DEBUG] gameApi.buyItem():', { url, itemId, quantity });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, quantity: quantity || 1 }),
    });

    console.log('[FARM-DEBUG] gameApi.buyItem() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('buyItem');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.buyItem() ERROR:', error);
      const err = new Error(error?.error?.message || `Failed to buy item: ${response.status}`);
      (err as any).code = error?.error?.code;
      throw err;
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.buyItem() SUCCESS:', json);
    return json.data;
  },
};
