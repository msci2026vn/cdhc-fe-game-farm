// ═══════════════════════════════════════════════════════════════
// API PVP TEAM — Colyseus + REST helpers cho 3v3 team room
// ═══════════════════════════════════════════════════════════════

import { Client, type Room } from '@colyseus/sdk';
import { API_BASE_URL } from '@/shared/utils/constants';
import { handleUnauthorized } from '@/shared/api/api-utils';
import type { PvpBuildConfig } from '@/shared/api/api-pvp';
import type { TeamRoomState } from './pvp-team.types.client';

// ─── Colyseus WS URL (reuse từ PvpTestScreen pattern) ─────────

const WS_URL = import.meta.env.VITE_WS_URL as string;

// ─── PvP Token (reuse từ PvpTestScreen pattern) ────────────────

async function fetchPvpToken(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/auth/pvp-token`, {
    credentials: 'include',
  });
  if (res.status === 401) {
    handleUnauthorized('pvp-team-token');
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error(`pvp-token error ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? 'pvp-token error');
  return json.data.token as string;
}

// ─── Join options ──────────────────────────────────────────────

export interface TeamJoinOptions {
  username: string;
  picture?: string;
  build: PvpBuildConfig;
}

// ─── Colyseus room helpers ─────────────────────────────────────

export async function createTeamRoom(
  options: TeamJoinOptions,
): Promise<Room<TeamRoomState>> {
  const token = await fetchPvpToken();
  const client = new Client(WS_URL);
  return client.create('team_room', { token, ...options });
}

export async function joinTeamRoom(
  roomCode: string,
  options: TeamJoinOptions,
): Promise<Room<TeamRoomState>> {
  const token = await fetchPvpToken();
  const client = new Client(WS_URL);

  // Find room by short roomCode via available rooms metadata
  const rooms = await client.getAvailableRooms('team_room');
  const target = rooms.find(r => r.metadata?.roomCode === roomCode);
  if (!target) throw new Error('Không tìm thấy phòng');

  return client.joinById(target.roomId, { token, ...options });
}

export async function findTeamRoom(
  options: TeamJoinOptions,
): Promise<Room<TeamRoomState>> {
  const token = await fetchPvpToken();
  const client = new Client(WS_URL);
  return client.joinOrCreate('team_room', { token, ...options });
}

// ─── REST API ──────────────────────────────────────────────────

async function pvpTeamFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api/pvp-team${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (res.status === 401) {
    handleUnauthorized('pvp-team' + path);
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string })?.error ?? `PVP Team API error ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

export const pvpTeamApi = {
  getHistory: (limit = 20) =>
    pvpTeamFetch<{ matches: unknown[] }>(`/history?limit=${limit}`),
};

// ─── Invite System ──────────────────────────────────────────

export async function getOnlineUsers(): Promise<{ id: string; username: string; avatar: string }[]> {
  const data = await pvpTeamFetch<{ users: { id: string; username: string; avatar: string }[] }>('/online-users');
  return data.users ?? [];
}

export async function sendInvite(targetUserId: string, roomCode: string): Promise<void> {
  await pvpTeamFetch<{ ok: boolean }>('/invite', {
    method: 'POST',
    body: JSON.stringify({ targetUserId, roomCode }),
  });
}

export async function checkInvite(): Promise<{
  from: { id: string; username: string; avatar: string };
  roomCode: string;
  expiresAt: number;
} | null> {
  const data = await pvpTeamFetch<{ invite: any }>('/check-invite');
  return data.invite ?? null;
}

export async function pvpPresence(action: 'join' | 'leave'): Promise<void> {
  await pvpTeamFetch<{ ok: boolean }>('/presence', {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}
