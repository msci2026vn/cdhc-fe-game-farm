// ============================================================
// API Guild — REST endpoints cho Guild system
// Pattern: fetch wrapper, credentials: 'include'
// ============================================================
import { API_BASE_URL, handleUnauthorized } from '@/shared/api/api-utils';

export interface Guild {
  id: number;
  name: string;
  owner: string;
  stakedAmount: string;
  createdAt: number;
  active: boolean;
  memberCount: number;
}

export interface GuildConfig {
  creationFee: string;
  joinFee: string;
  earlyExitFeePercent: number;
  maxMembers: number;
}

async function guildFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE_URL + '/api/guild' + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (res.status === 401) {
    handleUnauthorized('guild' + path);
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const guildApi = {
  getConfig: () =>
    guildFetch<{ success: boolean; data: GuildConfig }>('/config'),

  getList: (offset = 0, limit = 20) =>
    guildFetch<{ success: boolean; data: Guild[] }>(`/list?offset=${offset}&limit=${limit}`),

  getMy: () =>
    guildFetch<{ success: boolean; data: Guild | null }>('/my'),

  getSubnetBalance: () =>
    guildFetch<{ success: boolean; data: { balance: string; address: string } }>('/wallet/subnet-balance'),

  create: (name: string) =>
    guildFetch<{ success: boolean; data: { guildId: number; name: string; txHash: string; stakedAmount: string } }>(
      '/create',
      { method: 'POST', body: JSON.stringify({ name }) }
    ),

  join: (guildId: number) =>
    guildFetch<{ success: boolean; data: { guildId: number; txHash: string; stakedAmount: string } }>(
      `/${guildId}/join`,
      { method: 'POST' }
    ),

  leave: () =>
    guildFetch<{ success: boolean; data: { txHash: string } }>(
      '/leave',
      { method: 'POST' }
    ),
};
