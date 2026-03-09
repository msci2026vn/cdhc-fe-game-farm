// ═══════════════════════════════════════════════════════════════
// SHOP TYPES — Shop Items, Buy
// ═══════════════════════════════════════════════════════════════

export interface ShopItemData {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  price: number;
  category: 'seed' | 'tool' | 'card' | 'nft';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  owned: number;
  seasonStatus?: 'in_season' | 'off_season';
}

export interface BuyResult {
  item: {
    id: string;
    name: string;
    emoji: string;
    price: number;
  };
  quantityBought: number;
  totalOwned: number;
  ognSpent: number;
  ognRemaining: number;
}
