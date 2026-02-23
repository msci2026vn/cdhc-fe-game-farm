// ═══════════════════════════════════════════════════════════════
// FARMING TYPES — Plants, Plots, Inventory
// ═══════════════════════════════════════════════════════════════

export interface PlantTypeInfo {
  id: string;
  name: string;
  emoji: string;
  growthDurationMs: number;
  rewardOGN: number;
  rewardXP: number;
  shopPrice: number;
}

export interface FarmPlotData {
  id: string;
  slotIndex: number;
  plantType: PlantTypeInfo;
  plantedAt: number;
  happiness: number;
  lastWateredAt: number | null;
  isDead: boolean;
  diedAt: string | null;
}

export interface PlantResult {
  plot: FarmPlotData;
  ognRemaining: number;
  xpGained: number;
}

export interface WaterResult {
  cooldownRemaining: number;
  happinessGain: number;
  xpGained: number;
  newHappiness: number;
}

// MỚI — Harvest KHÔNG trả OGN, trả inventory info
export interface HarvestResult {
  ognEarned: number;
  xpGained: number;
  newOgn: number;
  newXp: number;
  newLevel: number;
  totalHarvests: number;
  leveledUp: boolean;
  plantName: string;
  plantEmoji: string;
  message: string;
}

export interface ClearResult {
  cleared: boolean;
  plotId: string;
  slotIndex: number;
}

// ═════════════════════════════════════════════════════════════
// INVENTORY — Kho đồ nông sản
// ═════════════════════════════════════════════════════════════

export interface InventoryItem {
  id: string;               // UUID — dùng để bán
  itemId: string;            // plant type: 'tomato', 'carrot', 'chili', 'wheat'
  plantName: string;
  plantEmoji: string;
  quantity: number;
  harvestedAt: string;
  expiresAt: string | null;
  freshnessPercent: number;  // 0-100
  freshnessLabel: string;    // 'Tươi 🟢', 'Sắp héo 🟡', 'Gần hỏ 🔴', 'Hết hạn 🥀'
  sellPrice: number;         // OGN nhận được khi bán
  seasonTag: string;         // 'Đúng vụ ✅' hoặc 'Trái vụ ⚠️'
}

export interface InventoryResponse {
  items: InventoryItem[];
  expiredItems?: Array<{
    id: string;
    itemId: string;
    plantName: string;
    plantEmoji: string;
    message: string;
  }>;
}

export interface SellResult {
  sold: {
    plantName: string;
    plantEmoji: string;
    sellPrice: number;
    freshnessLabel: string;
    seasonTag: string;
  };
  message: string;
  newOgn: number;
}

export interface SellAllResult {
  soldItems: Array<{
    plantName: string;
    plantEmoji: string;
    sellPrice: number;
  }>;
  totalOgn: number;
  expiredItems?: Array<{ plantName: string; message: string }>;
  message: string;
}

export interface InventoryRequest {
  id: string;
}
