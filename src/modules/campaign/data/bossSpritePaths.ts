// ═══════════════════════════════════════════════════════════════
// BOSS_SPRITE_PATHS — Lookup for bosses with multi-state SVG sprites
// Key: globalBossNumber (1-40)
// Value: base path without -idle/-attack/-dead.svg suffix
// Bosses NOT in this map fall back to /assets/campaign-bosses/boss-N.svg
// ═══════════════════════════════════════════════════════════════

export const BOSS_SPRITE_PATHS: Record<number, string> = {
  1: '/assets/bosses/ruong-lua/rep-con/boss-1',
  2: '/assets/bosses/ruong-lua/rep-linh/boss-2',
  3: '/assets/bosses/ruong-lua/rep-canh/boss-3',
  4: '/assets/bosses/ruong-lua/rep-chua/boss-4',
};

/**
 * Get the best available boss image src for display (idle sprite or fallback).
 * Use this in map nodes, detail sheets, and anywhere showing the boss visually.
 */
export function getBossImageSrc(globalBossNumber: number): string {
  const spritePath = BOSS_SPRITE_PATHS[globalBossNumber];
  if (spritePath) return `${spritePath}-idle.svg`;
  return `/assets/campaign-bosses/boss-${globalBossNumber}.svg`;
}
