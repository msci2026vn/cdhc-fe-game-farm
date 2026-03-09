// ═══════════════════════════════════════════════════════════════
// API VIP — VIP plans, orders, payments
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type {
  VipPlan,
  VipStatus,
  VipOrder,
  VipVerifyResult,
  VipOrderStatus,
} from '../types/game-api.types';

export const vipApi = {
  createVipOrder: async (planId: string): Promise<VipOrder> => {
    const url = API_BASE_URL + '/api/vip/orders';

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });

    if (response.status === 401) {
      handleUnauthorized('createVipOrder');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  verifyVipPayment: async (orderId: string, txHash: string): Promise<VipVerifyResult> => {
    const url = `${API_BASE_URL}/api/vip/orders/${orderId}/verify`;

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash }),
    });

    if (response.status === 401) {
      handleUnauthorized('verifyVipPayment');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  getVipOrders: async (): Promise<VipOrderStatus[]> => {
    const url = API_BASE_URL + '/api/vip/orders';

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      handleUnauthorized('getVipOrders');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  payVipCustodial: async (orderId: string): Promise<{ txHash: string; from: string; to: string; amount: string; status: string; orderId?: string; blockNumber?: number; subscription?: { id: string; tier: string; expiresAt: string }; explorerUrl?: string }> => {
    const url = `${API_BASE_URL}/api/vip/orders/${orderId}/pay-custodial`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('payVipCustodial'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },
};

// ═══ Standalone VIP functions (exported outside gameApi) ═══

export const getVipStatus = async (): Promise<VipStatus> => {
  const url = API_BASE_URL + '/api/vip/status';
  console.log('[FARM-DEBUG] gameApi.getVipStatus():', url);

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('getVipStatus');
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[FARM-DEBUG] gameApi.getVipStatus() ERROR:', error);
    throw new Error(error?.error?.message || `Failed to fetch VIP status: ${response.status}`);
  }

  const json = await response.json();
  return json.data;
};

export const getVipPlans = async (): Promise<VipPlan[]> => {
  const url = API_BASE_URL + '/api/vip/plans';
  console.log('[FARM-DEBUG] gameApi.getVipPlans():', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[FARM-DEBUG] gameApi.getVipPlans() ERROR:', error);
    throw new Error(error?.error?.message || `Failed to fetch VIP plans: ${response.status}`);
  }

  const json = await response.json();
  return json.data;
};
