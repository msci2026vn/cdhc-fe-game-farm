// ═══════════════════════════════════════════════════════════════
// API WALLET — Smart wallet + Custodial wallet + Security
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';

export const walletApi = {
  // ═══ SMART WALLET ═══

  createSmartWallet: async (): Promise<{ address: string; isDeployed: boolean; alreadyExists: boolean }> => {
    const url = API_BASE_URL + '/api/smart-wallet/create';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('createSmartWallet'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  getSmartWalletStatus: async (): Promise<{
    hasWallet: boolean;
    address: string | null;
    isDeployed: boolean;
    balance: string;
    chainId: number;
  }> => {
    const url = API_BASE_URL + '/api/smart-wallet/status';
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('getSmartWalletStatus'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  prepareUserOp: async (calls: Array<{ to: string; value: string; data?: string }>): Promise<{ userOpHash: string; expiresAt: number; expiresIn: number }> => {
    const url = API_BASE_URL + '/api/smart-wallet/prepare-op';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calls }),
    });
    if (response.status === 401) { handleUnauthorized('prepareUserOp'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  submitSignedOp: async (payload: {
    userOpHash: string;
    assertion: { authenticatorData: string; clientDataJSON: string; signature: string };
  }): Promise<{ txHash: string }> => {
    const url = API_BASE_URL + '/api/smart-wallet/submit-op';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.status === 401) { handleUnauthorized('submitSignedOp'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  getOpReceipt: async (hash: string): Promise<{ txHash: string; status: string; blockNumber: number }> => {
    const url = `${API_BASE_URL}/api/smart-wallet/receipt/${hash}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('getOpReceipt'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  // ═══ CUSTODIAL WALLET ═══

  getCustodialWalletStatus: async (): Promise<{
    address: string;
    balance: string;
    balanceWei: string;
    chainId: number;
    isActive: boolean;
  } | null> => {
    const url = API_BASE_URL + '/api/custodial-wallet/status';
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('getCustodialWalletStatus'); throw new Error('Session expired'); }
    if (response.status === 404) return null;
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  createCustodialWallet: async (): Promise<{ address: string; isNew: boolean }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/create';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('createCustodialWallet'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  sendCustodialTransaction: async (to: string, amount: string, pin?: string): Promise<{ txHash: string; from: string; to: string; amount: string }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/send';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, amount, ...(pin ? { pin } : {}) }),
    });
    if (response.status === 401) { handleUnauthorized('sendCustodialTransaction'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  exportCustodialKey: async (pin?: string): Promise<{ privateKey: string }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/export';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pin ? { pin } : {}),
    });
    if (response.status === 401) { handleUnauthorized('exportCustodialKey'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  // ═══ CUSTODIAL WALLET SECURITY ═══

  getSecurityStatus: async (): Promise<{ hasPin: boolean; pinSetAt: string | null; hasPasskey: boolean; passkeyCount: number }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/security-status';
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('getSecurityStatus'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  setWalletPin: async (pin: string): Promise<{ success: boolean; message: string }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/set-pin';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (response.status === 401) { handleUnauthorized('setWalletPin'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    return response.json();
  },

  verifyWalletPin: async (pin: string): Promise<{ valid: boolean; attemptsRemaining: number; blocked: boolean }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/verify-pin';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (response.status === 401) { handleUnauthorized('verifyWalletPin'); throw new Error('Session expired'); }
    if (response.status === 429) {
      return { valid: false, attemptsRemaining: 0, blocked: true };
    }
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      return { valid: false, attemptsRemaining: json.attemptsRemaining ?? 0, blocked: json.blocked ?? false };
    }
    const json = await response.json();
    return json.data;
  },

  changeWalletPin: async (oldPin: string, newPin: string): Promise<{ success: boolean; message: string }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/change-pin';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPin, newPin }),
    });
    if (response.status === 401) { handleUnauthorized('changeWalletPin'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    return response.json();
  },

  resetWalletPin: async (): Promise<{ success: boolean; message: string }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/reset-pin';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('resetWalletPin'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    return response.json();
  },

  getPasskeyTxOptions: async (): Promise<any> => {
    const url = API_BASE_URL + '/api/custodial-wallet/passkey/tx-options';
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('getPasskeyTxOptions'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  verifyPasskeyTx: async (assertion: any): Promise<{ verified: boolean }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/passkey/tx-verify';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assertion }),
    });
    if (response.status === 401) { handleUnauthorized('verifyPasskeyTx'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },
};
