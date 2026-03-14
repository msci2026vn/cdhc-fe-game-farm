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
  | { type: 'pvp_invite_response'; inviteId: string; action: 'accept' | 'reject'; roomCode: string | null; roomId?: string; fromUserId: string }
  | { type: 'pvp_matched'; roomCode: string; roomId?: string; opponentId: string }
  | { type: 'pvp_challenge'; roomCode: string; hostId: string; hostName: string; hostRating: number; timeoutMs: number }
  | { type: 'challenge_accepted'; targetUserId: string; roomCode: string; roomId?: string }
  | { type: 'challenge_failed'; reason: string }
  | { type: 'quick_match_joined'; userId: string; roomCode: string; roomId?: string };

// ── Build Config types ──

export interface PvpBuildConfig {
  str: number;
  vit: number;
  wis: number;
  arm: number;
  mana: number;
  skillA: string | null;
  skillB: string | null;
  skillC: string | null;
}

export const SKILL_GROUPS = {
  A: [
    { id: 'sam_dong',    name: 'Sấm Đồng',   icon: '⚡', desc: 'Gây 300 sát thương xuyên giáp', manaCost: 200 },
    { id: 'mua_da',     name: 'Mưa Đá',     icon: '🧊', desc: 'Chèn 6 junk vào board đối thủ', manaCost: 120 },
    { id: 'man_dem',    name: 'Màn Đêm',     icon: '🌑', desc: 'Ẩn board đối thủ 5 giây', manaCost: 200 },
    { id: 'phong_an',   name: 'Phong Ấn',    icon: '🔒', desc: 'Khoá vùng 3×3 board đối thủ 8s', manaCost: 180 },
    { id: 'thien_thach', name: 'Thiên Thạch', icon: '☄️', desc: 'Xoá 1 hàng board đối thủ', manaCost: 160 },
  ],
  B: [
    { id: 'ot_hiem',    name: 'Ớt Hiểm',    icon: '🌶️', desc: 'Giảm 50% giáp đối thủ 10s', manaCost: 80 },
    { id: 'troi_buoc',  name: 'Trói Buộc',   icon: '⛓️', desc: 'Chậm swap đối thủ 8s', manaCost: 120 },
    { id: 'hon_loan',   name: 'Hỗn Loạn',    icon: '🌀', desc: 'Xáo trộn board đối thủ', manaCost: 100 },
    { id: 'hoan_doi',   name: 'Hoán Đổi',    icon: '🔄', desc: 'Đổi gem ATK↔DEF trên board mình', manaCost: 80 },
    { id: 'ho_den',     name: 'Hố Đen',      icon: '🕳️', desc: 'Xoá STAR gem đối thủ + hút mana', manaCost: 140 },
  ],
  C: [
    { id: 'rom_boc',    name: 'Rơm Bọc',     icon: '🛡️', desc: 'Tăng 200 giáp', manaCost: 100 },
    { id: 'tang_toc',   name: 'Tăng Tốc',    icon: '⚡', desc: 'Swap nhanh gấp đôi 8s', manaCost: 150 },
    { id: 'trieu_hoi',  name: 'Triệu Hồi',   icon: '✨', desc: 'Kéo STAR gem về hàng cuối', manaCost: 80 },
    { id: 'thien_nhan', name: 'Thiên Nhãn',   icon: '👁️', desc: 'Xem board đối thủ 5s', manaCost: 60 },
    { id: 'tai_sinh',   name: 'Tái Sinh',     icon: '💚', desc: 'Hồi 600 HP', manaCost: 120 },
  ],
} as const;

export const SKILL_COOLDOWNS: Record<string, number> = {
  sam_dong: 40000, mua_da: 25000, man_dem: 45000, phong_an: 40000, thien_thach: 35000,
  ot_hiem: 20000, troi_buoc: 25000, hon_loan: 30000, hoan_doi: 20000, ho_den: 35000,
  rom_boc: 20000, tang_toc: 30000, trieu_hoi: 15000, thien_nhan: 10000, tai_sinh: 25000,
};

export const STAT_DEFS = [
  { key: 'str' as const, name: 'SỨC MẠNH',  icon: '⚔️', color: '#ef4444', desc: 'Tăng sát thương ATK gem',     formula: (v: number) => `${40 + v * 8} dmg/gem` },
  { key: 'vit' as const, name: 'SINH LỰC',   icon: '❤️', color: '#22c55e', desc: 'Tăng HP tối đa',              formula: (v: number) => `${2500 + v * 120} HP` },
  { key: 'wis' as const, name: 'TRÍ TUỆ',    icon: '💜', color: '#a855f7', desc: 'Tăng hồi HP & mana/star',     formula: (v: number) => `${25 + v * 3} heal/gem, +${8 + v * 2} mana/star` },
  { key: 'arm' as const, name: 'PHÒNG THỦ',   icon: '🛡️', color: '#3b82f6', desc: 'Tăng giáp từ DEF gem',        formula: (v: number) => `${20 + v * 5} armor/gem` },
  { key: 'mana' as const, name: 'NĂNG LƯỢNG', icon: '⭐', color: '#eab308', desc: 'Tăng mana tối đa',            formula: (v: number) => `${100 + v * 20} max mana` },
] as const;

export const STAT_TOTAL = 30;

// ── Rank Tier System (FE mirror of BE RANK_TIERS) ──

export const RANK_TIERS_FE = [
  { id: 'dong',      name: '\u0110\u1ED3ng',     icon: '\u{1F949}', minElo: 0,    maxElo: 1199 },
  { id: 'bac',       name: 'B\u1EA1c',           icon: '\u{1F948}', minElo: 1200, maxElo: 1599 },
  { id: 'vang',      name: 'V\u00E0ng',          icon: '\u{1F947}', minElo: 1600, maxElo: 1999 },
  { id: 'kim_cuong', name: 'Kim C\u01B0\u01A1ng', icon: '\u{1F48E}', minElo: 2000, maxElo: 2399 },
  { id: 'cao_thu',   name: 'Cao Th\u1EE7',       icon: '\u{1F451}', minElo: 2400, maxElo: 99999 },
] as const;

export function getTierFromElo(elo: number) {
  return RANK_TIERS_FE.find(t => elo >= t.minElo && elo <= t.maxElo) || RANK_TIERS_FE[0];
}

export function getSubTier(elo: number) {
  const tier = getTierFromElo(elo);
  const range = tier.maxElo - tier.minElo + 1;
  const progress = elo - tier.minElo;
  const subSize = range / 3;
  const idx = Math.min(2, Math.floor(progress / subSize));
  const names = ['S\u01A1 K\u1EF3', 'Trung K\u1EF3', 'H\u1EADu K\u1EF3'];
  const subProgress = Math.min(100, Math.floor(((progress - idx * subSize) / subSize) * 100));
  return { name: names[idx], progress: subProgress };
}

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

  sendInvite: (toUserId: string, roomCode?: string) =>
    pvpFetch<{ ok: boolean; inviteId: string; roomCode: string }>('/invite', {
      method: 'POST',
      body: JSON.stringify({ toUserId, ...(roomCode ? { roomCode } : {}) }),
    }),

  respondInvite: (inviteId: string, action: 'accept' | 'reject') =>
    pvpFetch<{ ok: boolean; action: string; roomCode: string | null; roomId?: string }>('/invite/respond', {
      method: 'POST',
      body: JSON.stringify({ inviteId, action }),
    }),

  joinQueue: () =>
    pvpFetch<{ matched: boolean; roomCode?: string; roomId?: string; opponent?: { id: string; name: string; rating: number }; message?: string }>(
      '/find-match',
      { method: 'POST', body: '{}' },
    ),

  leaveQueue: () =>
    pvpFetch<{ ok: boolean }>('/find-match', { method: 'DELETE' }),

  getQueueStatus: () =>
    pvpFetch<{
      inQueue: boolean;
      matched?: boolean;
      roomCode?: string;
      roomId?: string;
      waitSeconds?: number;
      triggerBoss?: boolean;
      isBossGame?: boolean;
      isBotGame?: boolean;
      isStealth?: boolean;
      boss?: { id: string; name: string; avatar: string; greeting: string; hp: number };
    }>('/find-match/status'),

  playBot: (tier = 'medium') =>
    pvpFetch<{ ok: boolean; roomId?: string; roomCode?: string; error?: string }>(
      '/play-bot',
      { method: 'POST', body: JSON.stringify({ tier }) },
    ),

  bossChallenge: () =>
    pvpFetch<{ ok: boolean; roomId?: string; roomCode?: string; boss?: Record<string, unknown>; error?: string }>(
      '/boss-challenge',
      { method: 'POST' },
    ),

  createOpenRoom: () =>
    pvpFetch<{ ok: boolean; roomCode: string; roomId: string }>(
      '/create-open-room',
      { method: 'POST', body: '{}' },
    ),

  closeOpenRoom: (roomCode: string) =>
    pvpFetch<{ ok: boolean }>('/close-open-room', {
      method: 'POST',
      body: JSON.stringify({ roomCode }),
    }),

  challengeRespond: (accept: boolean) =>
    pvpFetch<{ ok: boolean; roomCode?: string; roomId?: string; error?: string }>('/challenge-respond', {
      method: 'POST',
      body: JSON.stringify({ accept }),
    }),

  startChallenge: (roomCode: string) =>
    pvpFetch<{ ok: boolean; error?: string }>('/start-challenge', {
      method: 'POST',
      body: JSON.stringify({ roomCode }),
    }),

  getRooms: () =>
    pvpFetch<{ rooms: { roomId: string; roomCode: string; hostName: string; clients: number; maxClients: number; createdAt: string | null }[] }>('/rooms'),

  createInviteLink: (roomCode: string) =>
    pvpFetch<{ inviteUrl: string; token: string; expiresAt: number }>('/create-invite-link', {
      method: 'POST',
      body: JSON.stringify({ roomCode }),
    }),

  validateInviteLink: (token: string): Promise<{ valid: boolean; roomCode?: string; hostName?: string; reason?: string }> =>
    fetch(`${API_BASE_URL}/api/pvp/validate-invite/${token}`)
      .then(res => res.json() as Promise<{ valid: boolean; roomCode?: string; hostName?: string; reason?: string }>),

  saveBuild: (build: PvpBuildConfig) =>
    pvpFetch<{ ok: boolean }>('/build', {
      method: 'POST',
      body: JSON.stringify(build),
    }),

  getBuild: () =>
    pvpFetch<{ build: PvpBuildConfig | null }>('/build'),
};
