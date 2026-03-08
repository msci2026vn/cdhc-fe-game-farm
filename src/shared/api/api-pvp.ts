// ═══════════════════════════════════════════════════════════════
// API PVP — Invite, Matchmaking, History, Rating, Leaderboard
// ═══════════════════════════════════════════════════════════════

import { API_BASE_URL, handleUnauthorized } from './api-utils';

async function pvpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE_URL + '/api/pvp' + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (res.status === 401) {
    handleUnauthorized('pvp' + path);
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string })?.error || `PVP API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type PvpRating = {
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  rank: number | null;
};

export type PvpMatch = {
  id: string;
  room_code: string;
  created_at: string;
  duration_seconds: number;
  my_score: number;
  opp_score: number;
  result: 'win' | 'loss' | 'draw';
  opponent_name: string;
  opponent_avatar: string | null;
};

export type PvpLeaderboardEntry = {
  user_id: string;
  name: string;
  picture: string | null;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  rank: number;
};

export type PvpInvite = {
  id: string;
  roomCode: string;
  expiresAt: string;
  createdAt: string;
  fromName: string | null;
  fromAvatar: string | null;
  fromUserId: string;
};

export type PvpEvent =
  | { type: 'pvp_invite'; inviteId: string; fromUserId: string; fromName: string; fromAvatar: string | null; roomCode: string; expiresAt: string }
  | { type: 'pvp_invite_response'; inviteId: string; action: 'accept' | 'reject'; roomCode: string | null; fromUserId: string }
  | { type: 'pvp_matched'; roomCode: string; opponentId: string };

export const pvpApi = {
  getRating: () => pvpFetch<PvpRating>('/rating'),

  getHistory: (limit = 20) =>
    pvpFetch<{ matches: PvpMatch[] }>(`/history?limit=${limit}`),

  getLeaderboard: (limit = 20) =>
    pvpFetch<{ leaderboard: PvpLeaderboardEntry[] }>(`/leaderboard?limit=${limit}`),

  getHeadToHead: (opponentId: string) =>
    pvpFetch<{ stats: Record<string, unknown> | null; recent: PvpMatch[] }>(
      `/head-to-head/${opponentId}`,
    ),

  getPendingInvites: () => pvpFetch<{ invites: PvpInvite[] }>('/invite/pending'),

  sendInvite: (toUserId: string) =>
    pvpFetch<{ ok: boolean; inviteId: string; roomCode: string }>('/invite', {
      method: 'POST',
      body: JSON.stringify({ toUserId }),
    }),

  respondInvite: (inviteId: string, action: 'accept' | 'reject') =>
    pvpFetch<{ ok: boolean; action: string; roomCode: string | null }>('/invite/respond', {
      method: 'POST',
      body: JSON.stringify({ inviteId, action }),
    }),

  joinQueue: () =>
    pvpFetch<{ matched: boolean; roomCode?: string; opponent?: { id: string; name: string; rating: number }; message?: string }>(
      '/find-match',
      { method: 'POST', body: '{}' },
    ),

  leaveQueue: () =>
    pvpFetch<{ ok: boolean }>('/find-match', { method: 'DELETE' }),

  getQueueStatus: () =>
    pvpFetch<{ inQueue: boolean; matched?: boolean; roomCode?: string; waitSeconds?: number }>(
      '/find-match/status',
    ),
};
