// ═══════════════════════════════════════════════════════════════
// REQUEST TYPES — match BE Zod schemas
// ═══════════════════════════════════════════════════════════════

import type { SyncAction } from './gameplay.types';

export type PlantTypeId = 'tomato' | 'carrot' | 'chili' | 'wheat';
export type InteractType = 'water' | 'like' | 'comment' | 'gift';

export interface PlantRequest {
  plantTypeId: PlantTypeId;
  slotIndex: number;
}

export interface WaterRequest {
  plotId: string;
}

export interface HarvestRequest {
  plotId: string;
}

export interface BuyRequest {
  itemId: string;
  quantity?: number;
}

export interface InteractRequest {
  friendId: string;
  type: InteractType;
  data?: {
    comment?: string;
    giftId?: string;
  };
}

export interface SyncRequest {
  actions: SyncAction[];
}

export interface AllocateStatsRequest {
  atk: number;
  hp: number;
  def: number;
  mana: number;
}

export interface AutoSettingRequest {
  preset: 'attack' | 'defense' | 'balance';
  enabled: boolean;
}
