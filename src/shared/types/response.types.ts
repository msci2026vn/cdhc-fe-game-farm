// ═══════════════════════════════════════════════════════════════
// RESPONSE TYPES — ApiResponse<T> wrappers
// ═══════════════════════════════════════════════════════════════

import type { ApiResponse } from './common';
import type { PlayerProfile, AuthStatus, PingResult } from './core.types';
import type { FarmPlotData, PlantResult, WaterResult, HarvestResult, InventoryResponse, SellResult, SellAllResult } from './farming.types';
import type { BossCompleteResult, QuizStartResult, QuizAnswerResult, SyncResult } from './gameplay.types';
import type { FriendsResult, AddFriendResult, ReferralInfoResult, InteractResult, LeaderboardResult } from './social.types';
import type { ShopItemData, BuyResult } from './shop.types';
import type { OgnHistoryResult } from './economy.types';

export type PlayerProfileResponse = ApiResponse<PlayerProfile>;
export type FarmPlotsResponse = ApiResponse<FarmPlotData[]>;
export type PlantResponse = ApiResponse<PlantResult>;
export type WaterResponse = ApiResponse<WaterResult>;
export type HarvestResponse = ApiResponse<HarvestResult>;
export type BossCompleteResponse = ApiResponse<BossCompleteResult>;
export type QuizStartResponse = ApiResponse<QuizStartResult>;
export type QuizAnswerResponse = ApiResponse<QuizAnswerResult>;
export type ShopItemsResponse = ApiResponse<ShopItemData[]>;
export type BuyResponse = ApiResponse<BuyResult>;
export type FriendsResponse = ApiResponse<FriendsResult>;
export type AddFriendResponse = ApiResponse<AddFriendResult>;
export type ReferralInfoResponse = ApiResponse<ReferralInfoResult>;
export type InteractResponse = ApiResponse<InteractResult>;
export type LeaderboardResponse = ApiResponse<LeaderboardResult>;
export type SyncResponse = ApiResponse<SyncResult>;
export type PingResponse = ApiResponse<PingResult>;
export type AuthStatusResponse = ApiResponse<AuthStatus>;

export type InventoryResponseType = ApiResponse<InventoryResponse>;
export type SellResponseType = ApiResponse<SellResult>;
export type SellAllResponseType = ApiResponse<SellAllResult>;

export interface OgnHistoryResponse extends ApiResponse<OgnHistoryResult> { }
