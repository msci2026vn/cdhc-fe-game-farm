// ═══════════════════════════════════════════════════════════════
// API FRAGMENTS — Player fragment inventory
// ═══════════════════════════════════════════════════════════════

import { useQuery } from '@tanstack/react-query';
import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type { PlayerFragment } from '@/modules/campaign/types/fragment.types';

export async function getPlayerFragments(): Promise<PlayerFragment[]> {
  const url = API_BASE_URL + '/api/game/fragments';

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('getPlayerFragments');
    throw new Error('Session expired');
  }

  if (!response.ok) {
    await handleApiError(response);
  }

  const json = await response.json();
  return json.data?.fragments ?? json.data ?? [];
}

export function usePlayerFragments() {
  return useQuery<PlayerFragment[]>({
    queryKey: ['playerFragments'],
    queryFn: getPlayerFragments,
    staleTime: 60_000,
    retry: 2,
  });
}
