// ═══════════════════════════════════════════════════════════════
// API ACHIEVEMENTS — Achievements, login streak, combo leaderboard
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type { Achievement, LoginStreak, ComboLeaderboardEntry, LeaderboardPeriod } from '@/modules/campaign/types/achievement.types';

// ─── Query keys ──────────────────────────────────────────────
const KEYS = {
  achievements: ['achievements'] as const,
  loginStreak: ['loginStreak'] as const,
  comboLeaderboard: (period: LeaderboardPeriod) => ['comboLeaderboard', period] as const,
  myComboRank: (period: LeaderboardPeriod) => ['myComboRank', period] as const,
};

// ─── GET /api/game/achievements ──────────────────────────────
async function getAchievements(): Promise<Achievement[]> {
  const url = API_BASE_URL + '/api/game/achievements';
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('getAchievements');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data?.achievements ?? json.data ?? [];
}

export function useAchievements() {
  return useQuery<Achievement[]>({
    queryKey: KEYS.achievements,
    queryFn: getAchievements,
    staleTime: 60_000,
  });
}

// ─── POST /api/game/achievements/claim ───────────────────────
async function claimAchievement(achievementId: number) {
  const url = API_BASE_URL + '/api/game/achievements/claim';
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ achievementId }),
  });

  if (response.status === 401) {
    handleUnauthorized('claimAchievement');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data;
}

export function useClaimAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (achievementId: number) => claimAchievement(achievementId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.achievements });
      qc.invalidateQueries({ queryKey: ['game', 'profile'] });
    },
  });
}

// ─── POST /api/game/achievements/claim-all ───────────────────
async function claimAllAchievements() {
  const url = API_BASE_URL + '/api/game/achievements/claim-all';
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('claimAllAchievements');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data;
}

export function useClaimAllAchievements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => claimAllAchievements(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.achievements });
      qc.invalidateQueries({ queryKey: ['game', 'profile'] });
    },
  });
}

// ─── GET /api/game/achievements/login-streak ─────────────────
async function getLoginStreak(): Promise<LoginStreak> {
  const url = API_BASE_URL + '/api/game/achievements/login-streak';
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('getLoginStreak');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data;
}

export function useLoginStreak() {
  return useQuery<LoginStreak>({
    queryKey: KEYS.loginStreak,
    queryFn: getLoginStreak,
    staleTime: 5 * 60_000,
  });
}

// ─── GET /api/game/leaderboard/combo?period= ─────────────────
async function getComboLeaderboard(period: LeaderboardPeriod): Promise<ComboLeaderboardEntry[]> {
  const url = API_BASE_URL + `/api/game/leaderboard/combo?period=${period}`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('getComboLeaderboard');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data?.leaderboard ?? json.data ?? [];
}

export function useComboLeaderboard(period: LeaderboardPeriod) {
  return useQuery<ComboLeaderboardEntry[]>({
    queryKey: KEYS.comboLeaderboard(period),
    queryFn: () => getComboLeaderboard(period),
    staleTime: 2 * 60_000,
  });
}

// ─── GET /api/game/leaderboard/combo/me?period= ──────────────
async function getMyComboRank(period: LeaderboardPeriod): Promise<ComboLeaderboardEntry | null> {
  const url = API_BASE_URL + `/api/game/leaderboard/combo/me?period=${period}`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('getMyComboRank');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data ?? null;
}

export function useMyComboRank(period: LeaderboardPeriod) {
  return useQuery<ComboLeaderboardEntry | null>({
    queryKey: KEYS.myComboRank(period),
    queryFn: () => getMyComboRank(period),
    staleTime: 2 * 60_000,
  });
}
