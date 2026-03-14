// pvp-board.adapter.ts
// Convert PVP server tile data (number[]) → Gem-like array for CampaignMatch3Board
// Server types: 0=atk ⚔️  1=hp 💚  2=def 🛡️  3=star ⭐  4=junk 🪨  -1=empty

import { GEM_META } from '@/shared/match3/board.utils';

// Extend campaign GEM_META with junk (type 4) and fallback for -1 (empty)
// GEM_META prop on CampaignMatch3Board is typed `any` — safe to extend
export const PVP_GEM_META = {
  ...GEM_META,
  junk:  { emoji: '🪨', css: 'gem-junk' },
  empty: { emoji: '',   css: 'gem-empty' },
} as const;

const TILE_TO_TYPE: Record<number, string> = {
  0: 'atk',
  1: 'hp',
  2: 'def',
  3: 'star',
  4: 'junk',
};

// PvpGem — Gem-like shape accepted by CampaignMatch3Board (grid: any[])
export interface PvpGem {
  id: number;
  type: string;    // 'atk' | 'hp' | 'def' | 'star' | 'junk'
  special: undefined;
}

// Convert server number[] → PvpGem[] for CampaignMatch3Board
// id = stable flat index (0-63) so React key is stable even after cascade
export function tilesToGems(tiles: number[]): PvpGem[] {
  return tiles.map((value, index) => ({
    id: index,
    type: TILE_TO_TYPE[value] ?? 'atk',
    special: undefined,
  }));
}
