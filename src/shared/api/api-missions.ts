// ═══════════════════════════════════════════════════════════════
// API MISSIONS — Daily/weekly quests
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type { PlayerMission } from '@/modules/campaign/types/mission.types';

// ─── Query keys ──────────────────────────────────────────────
const KEYS = {
  daily: ['missions', 'daily'] as const,
  weekly: ['missions', 'weekly'] as const,
};

// ─── GET /api/game/missions/daily ────────────────────────────
async function getDailyMissions(): Promise<PlayerMission[]> {
  const url = API_BASE_URL + '/api/game/missions/daily';
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('getDailyMissions');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data?.missions ?? json.data ?? [];
}

export function useDailyMissions() {
  return useQuery<PlayerMission[]>({
    queryKey: KEYS.daily,
    queryFn: getDailyMissions,
    staleTime: 60_000,
  });
}

// ─── GET /api/game/missions/weekly ───────────────────────────
async function getWeeklyMissions(): Promise<PlayerMission[]> {
  const url = API_BASE_URL + '/api/game/missions/weekly';
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('getWeeklyMissions');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data?.missions ?? json.data ?? [];
}

export function useWeeklyMissions() {
  return useQuery<PlayerMission[]>({
    queryKey: KEYS.weekly,
    queryFn: getWeeklyMissions,
    staleTime: 60_000,
  });
}

// ─── POST /api/game/missions/claim ───────────────────────────
async function claimMission(missionId: number) {
  const url = API_BASE_URL + '/api/game/missions/claim';
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missionId }),
  });

  if (response.status === 401) {
    handleUnauthorized('claimMission');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data;
}

export function useClaimMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (missionId: number) => claimMission(missionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['missions'] });
      qc.invalidateQueries({ queryKey: ['game', 'profile'] });
    },
  });
}

// ─── POST /api/game/missions/claim-all ───────────────────────
async function claimAllMissions() {
  const url = API_BASE_URL + '/api/game/missions/claim-all';
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('claimAllMissions');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data;
}

export function useClaimAllMissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => claimAllMissions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['missions'] });
      qc.invalidateQueries({ queryKey: ['game', 'profile'] });
    },
  });
}
