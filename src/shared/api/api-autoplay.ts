// ═══════════════════════════════════════════════════════════════
// Auto-play API — rent/buy/status endpoints (B3 real API)
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, API_BASE_URL } from './api-utils';

export interface AutoPlayStatus {
  effectiveLevel: number;         // 1-5 (max of purchased, rented)
  purchasedLevel: number | null;  // Permanent purchase
  rentedLevel: number | null;     // Temporary rent
  rentExpiresAt: string | null;   // ISO timestamp
  daysUntilExpiry: number | null; // null if not rented
}

export interface AutoPlayPrices {
  rent: Record<number, number>;    // { 2: 1000, 3: 2500, 4: 5000, 5: 10000 } — OGN
  buy: Record<number, string>;     // { 2: '0.015', 3: '0.016', 4: '0.018', 5: '0.020' } — AVAX
  receiverAddress?: string;        // AVAX receiver for external wallet payments
}

// ─── internal fetch helper ───────────────────────────────────────

async function apFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(API_BASE_URL + path, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (response.status === 401) {
    handleUnauthorized('autoPlay');
    throw new Error('Session expired');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body?.error?.message || `Failed: ${response.status}`);
    (err as any).data = body?.error;
    throw err;
  }
  const json = await response.json();
  return json.data as T;
}

// ─── API object ───────────────────────────────────────────────────

export const autoPlayApi = {
  getStatus: (): Promise<AutoPlayStatus> =>
    apFetch('/api/game/auto-play/status'),

  getPrices: (): Promise<AutoPlayPrices> =>
    apFetch('/api/game/auto-play/prices'),

  rent: (level: number): Promise<{ status: AutoPlayStatus; ognRemaining: number }> =>
    apFetch('/api/game/auto-play/rent', {
      method: 'POST',
      body: JSON.stringify({ level }),
    }),

  buy: (level: number, txHash?: string): Promise<{ status: AutoPlayStatus }> =>
    apFetch('/api/game/auto-play/buy', {
      method: 'POST',
      body: JSON.stringify({ level, ...(txHash ? { txHash } : {}) }),
    }),

  cancelRent: (): Promise<{ status: AutoPlayStatus }> =>
    apFetch('/api/game/auto-play/cancel-rent', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};
