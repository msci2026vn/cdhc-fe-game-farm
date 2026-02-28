// ═══════════════════════════════════════════════════════════════
// Recipe types — craft, sell, use recipes from fragments
// ═══════════════════════════════════════════════════════════════

import type { FragmentTier } from './fragment.types';

export interface RecipeIngredient {
  fragmentKey: string;
  name: string;
  tier: FragmentTier;
  zoneNumber: number;
  amount: number;
  isSameZone: boolean;
}

export interface RecipeDefinition {
  id: number;
  recipeKey: string;
  name: string;
  zoneNumber: number;
  tier: FragmentTier;
  yieldBonus: number;      // e.g. 0.1 = +10%
  timeReduction: number;   // e.g. 0.1 = -10%
  duration: number;        // buff duration in hours
  sellPrice: number;       // OGN
  ingredients: RecipeIngredient[];
}

export interface PlayerRecipe {
  recipeId: number;
  recipeKey: string;
  name: string;
  tier: FragmentTier;
  zoneNumber: number;
  quantity: number;
}

export interface ActiveFarmBuff {
  id: number;
  recipeKey: string;
  name: string;
  tier: FragmentTier;
  yieldBonus: number;
  timeReduction: number;
  expiresAt: string;       // ISO date
  remainingMs: number;
}

export const MAX_BUFF_SLOTS = 3;

export const TIER_CRAFT_LABELS: Record<FragmentTier, string> = {
  common: 'Thường',
  rare: 'Hiếm',
  legendary: 'Huyền Thoại',
};
