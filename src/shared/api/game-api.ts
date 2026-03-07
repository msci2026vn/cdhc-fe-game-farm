// game-api.ts — barrel file (auto-generated, do not edit directly)
// All functions imported from sub-files, re-exported as gameApi object

import { authApi } from './api-auth';
import { playerApi } from './api-player';
import { farmApi } from './api-farm';
import { bossApi } from './api-boss';
import { quizApi } from './api-quiz';
import { shopApi } from './api-shop';
import { socialApi } from './api-social';
import { leaderboardApi } from './api-leaderboard';
import { weatherApi } from './api-weather';
import { inventoryApi } from './api-inventory';
import { economyApi } from './api-economy';
import { campaignApi } from './api-campaign';
import { conversionApi } from './api-conversion';
import { walletApi } from './api-wallet';
import { vipApi } from './api-vip';
import { telegramApi } from './api-telegram';

// Re-export utils
export { resetRedirectLock } from './api-utils';

// ═══════════════════════════════════════════════════════════════
// MAIN gameApi OBJECT — giữ nguyên public API
// ═══════════════════════════════════════════════════════════════
export const gameApi = {
  ...authApi,
  ...playerApi,
  ...farmApi,
  ...bossApi,
  ...quizApi,
  ...shopApi,
  ...socialApi,
  ...leaderboardApi,
  ...weatherApi,
  ...inventoryApi,
  ...economyApi,
  ...campaignApi,
  ...conversionApi,
  ...walletApi,
  ...vipApi,
  ...telegramApi,
};

// ═══════════════════════════════════════════════════════════════
// STANDALONE EXPORTS — functions exported outside gameApi
// ═══════════════════════════════════════════════════════════════
export { getVipStatus, getVipPlans } from './api-vip';
export {
  getBlockchainStats,
  getBlockchainLogs,
  getSensorLatest,
  getSensorHistory,
  getSensorHourly,
  getSensorDates,
  getIoTDevices,
  getCameraStreamInfo,
  getMyGarden,
  getGardenSummary,
  getDeliveryHistory,
  claimDeliverySlot,
  scanClaimDelivery,
  manualVerifyDelivery,
  getSlotQr,
  getDeliveryProof,
} from './api-rwa';

// ═══════════════════════════════════════════════════════════════
// TYPE RE-EXPORTS — giữ nguyên cho các file import từ đây
// ═══════════════════════════════════════════════════════════════
export type {
  BlockchainStats,
  BlockchainLog,
  SensorReading,
  SensorHourlyRecord,
  SensorHourlyData,
  IoTDevice,
  CameraStreamInfo,
} from './api-rwa';

export type {
  PlayerProfile,
  FarmPlotData,
  WaterResult,
  HarvestResult,
  ClearResult,
  BossFightInput,
  BossCompleteResult,
  QuizStartResult,
  QuizAnswerInput,
  QuizAnswerResult,
  ShopItemData,
  BuyResult,
  FriendData,
  FriendsResult,
  AddFriendResult,
  AddFriendPendingResult,
  FriendStatus,
  FriendRequest,
  FriendRequestsResult,
  UserSearchResult,
  SearchUsersResult,
  FriendActionResult,
  ReferralInfoResult,
  LeaderboardResult,
  SyncAction,
  SyncResult,
  PingResult,
  AuthStatus,
  PlantTypeId,
  QuizAnswer,
  InteractType,
  FriendFarmData,
  LevelInfo,
  LevelUpResult,
  DailyStatus,
  BossStatus,
  StatInfo,
  AllocateStatsRequest,
  AllocateStatsResponse,
  ResetStatsResponse,
  AutoSettingRequest,
  WeeklyBossInfo,
  ConversionStatus,
  ConversionSuccessResult,
  ConversionHistoryResult,
  VipOrder,
  VipVerifyResult,
  VipOrderStatus,
  MyGardenData,
  GardenSummary,
  DeliveryHistoryDay,
  DeliverySlotStatus,
  DeliverySlot,
  ClaimSlotRequest,
  ClaimSlotResult,
  ScanClaimRequest,
  ScanClaimResult,
  RecipientInfo,
  VerifyOtpResult,
  SlotQrData,
  DeliveryProof,
  BatchInfo,
} from '../types/game-api.types';
