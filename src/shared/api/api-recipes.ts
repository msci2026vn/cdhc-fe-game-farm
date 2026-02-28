// ═══════════════════════════════════════════════════════════════
// API RECIPES — Craft, sell, use recipes from fragments
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type { RecipeDefinition, PlayerRecipe, ActiveFarmBuff } from '@/modules/campaign/types/recipe.types';

// ─── Query keys ──────────────────────────────────────────────
const KEYS = {
  definitions: ['recipeDefinitions'] as const,
  inventory: ['recipeInventory'] as const,
  buffs: ['farmBuffs'] as const,
};

// ─── GET /api/game/recipes — All recipe definitions ──────────
async function getRecipeDefinitions(): Promise<RecipeDefinition[]> {
  const url = API_BASE_URL + '/api/game/recipes';
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('getRecipeDefinitions');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data?.recipes ?? json.data ?? [];
}

export function useRecipeDefinitions() {
  return useQuery<RecipeDefinition[]>({
    queryKey: KEYS.definitions,
    queryFn: getRecipeDefinitions,
    staleTime: 5 * 60_000, // 5 min — definitions rarely change
  });
}

// ─── GET /api/game/recipes/inventory — Player crafted recipes ─
async function getRecipeInventory(): Promise<PlayerRecipe[]> {
  const url = API_BASE_URL + '/api/game/recipes/inventory';
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('getRecipeInventory');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data?.recipes ?? json.data ?? [];
}

export function useRecipeInventory() {
  return useQuery<PlayerRecipe[]>({
    queryKey: KEYS.inventory,
    queryFn: getRecipeInventory,
    staleTime: 30_000,
  });
}

// ─── GET /api/game/recipes/buffs — Active farm buffs ─────────
async function getActiveFarmBuffs(): Promise<ActiveFarmBuff[]> {
  const url = API_BASE_URL + '/api/game/recipes/buffs';
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 401) {
    handleUnauthorized('getActiveFarmBuffs');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data?.buffs ?? json.data ?? [];
}

export function useActiveFarmBuffs() {
  return useQuery<ActiveFarmBuff[]>({
    queryKey: KEYS.buffs,
    queryFn: getActiveFarmBuffs,
    staleTime: 30_000,
    refetchInterval: 60_000, // refresh every minute for countdown
  });
}

// ─── POST /api/game/recipes/craft ────────────────────────────
async function craftRecipe(recipeKey: string) {
  const url = API_BASE_URL + '/api/game/recipes/craft';
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipeKey }),
  });

  if (response.status === 401) {
    handleUnauthorized('craftRecipe');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data;
}

export function useCraftRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipeKey: string) => craftRecipe(recipeKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.inventory });
      qc.invalidateQueries({ queryKey: ['playerFragments'] });
    },
  });
}

// ─── POST /api/game/recipes/sell ─────────────────────────────
async function sellRecipe(recipeKey: string) {
  const url = API_BASE_URL + '/api/game/recipes/sell';
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipeKey }),
  });

  if (response.status === 401) {
    handleUnauthorized('sellRecipe');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data;
}

export function useSellRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipeKey: string) => sellRecipe(recipeKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.inventory });
      qc.invalidateQueries({ queryKey: ['game', 'profile'] });
    },
  });
}

// ─── POST /api/game/recipes/use ──────────────────────────────
async function useRecipe(recipeKey: string) {
  const url = API_BASE_URL + '/api/game/recipes/use';
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipeKey }),
  });

  if (response.status === 401) {
    handleUnauthorized('useRecipe');
    throw new Error('Session expired');
  }
  if (!response.ok) await handleApiError(response);

  const json = await response.json();
  return json.data;
}

export function useUseRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipeKey: string) => useRecipe(recipeKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.inventory });
      qc.invalidateQueries({ queryKey: KEYS.buffs });
    },
  });
}
