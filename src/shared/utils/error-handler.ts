/**
 * Centralized error handler for FARMVERSE
 *
 * Maps BE error codes + HTTP status → user-friendly Vietnamese messages
 * Handles: 401 redirect, network errors, cooldown display
 *
 * FARMVERSE Step 16
 */
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';

// ─── Error code → Vietnamese message map ───
const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  UNAUTHORIZED: 'Phiên đăng nhập hết hạn. Đang chuyển đến trang đăng nhập...',
  FORBIDDEN: 'Tài khoản chưa được duyệt',
  UNAPPROVED: 'Tài khoản chưa được duyệt. Vui lòng chờ admin phê duyệt.',

  // Farm - Plant
  INSUFFICIENT_OGN: 'Không đủ OGN để trồng cây',
  SLOT_OCCUPIED: 'Ô này đã có cây rồi',
  INVALID_PLANT_TYPE: 'Loại cây không hợp lệ',
  INVALID_SLOT: 'Vị trí ô không hợp lệ',
  PLANT_ERROR: 'Lỗi khi trồng cây. Vui lòng thử lại.',

  // Farm - Water
  COOLDOWN_ACTIVE: 'Đang trong thời gian chờ tưới',
  PLOT_NOT_FOUND: 'Không tìm thấy cây',
  PLOT_DEAD: 'Cây đã chết, không thể tưới',
  WATER_ERROR: 'Lỗi khi tưới nước. Vui lòng thử lại.',

  // Farm - Harvest
  NOT_READY: 'Cây chưa lớn xong, chưa thể thu hoạch',
  ALREADY_HARVESTED: 'Cây đã được thu hoạch rồi',
  HARVEST_ERROR: 'Lỗi khi thu hoạch. Vui lòng thử lại.',

  // Validation
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',

  // Network
  NETWORK_ERROR: 'Mất kết nối mạng. Vui lòng kiểm tra internet.',
  TIMEOUT_ERROR: 'Kết nối quá chậm. Vui lòng thử lại.',

  // Server
  SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau.',
};

// ─── Navigate function (set by App) ───
let navigateToLogin: (() => void) | null = null;

export function setNavigateToLogin(fn: () => void) {
  navigateToLogin = fn;
  console.log('[FARM-DEBUG] setNavigateToLogin configured');
}

// ─── Main error handler ───
export function handleGameError(error: any, context?: string): string {
  const code = error?.code || '';
  const message = error?.message || 'Lỗi không xác định';
  const status = error?.status || 0;

  console.log('[FARM-DEBUG] handleGameError()', JSON.stringify({
    context,
    code,
    message,
    status,
    cooldownRemaining: error?.cooldownRemaining,
  }));

  // ─── 401: Session expired ───
  // NOTE: Don't redirect here! The global handleUnauthorized() in game-api.ts
  // is the single source of truth for 401 redirects. Having multiple redirect
  // sources caused race conditions (player kicked to login mid-boss-fight).
  if (status === 401 || code === 'UNAUTHORIZED' || message.includes('401') || message.includes('Unauthorized')) {
    console.log('[FARM-DEBUG] handleGameError() — 401 detected (redirect handled by game-api.ts)');
    return ERROR_MESSAGES.UNAUTHORIZED;
  }

  // ─── Network error ───
  if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch') || !navigator.onLine) {
    console.log('[FARM-DEBUG] handleGameError() — network error');
    useUIStore.getState().setApiDisconnected(true);
    toast.error(ERROR_MESSAGES.NETWORK_ERROR, {
      icon: '📡',
      duration: 5000,
    });
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // ─── 429: Cooldown / Rate limit ───
  if (status === 429 || code === 'COOLDOWN_ACTIVE' || code === 'CAMPAIGN_COOLDOWN'
    || code === 'BOSS_COOLDOWN' || code === 'RATE_LIMITED' || code === 'RATE_LIMIT_EXCEEDED'
    || code === 'CONCURRENT_BATTLE' || code === 'DAILY_WIN_LIMIT' || code === 'BOSS_DAILY_LIMIT') {
    const remaining = error?.cooldownRemaining || error?.remainingSeconds;
    const cooldownMsg = remaining
      ? `Vui lòng chờ ${formatCooldown(remaining)}`
      : error?.message || 'Thao tác quá nhanh, vui lòng thử lại sau';
    console.log('[FARM-DEBUG] handleGameError() — cooldown/rate:', cooldownMsg);
    toast(cooldownMsg, { icon: '⏳', duration: 3000 });
    return cooldownMsg;
  }

  // ─── 403: Forbidden ───
  if (status === 403 || code === 'FORBIDDEN' || code === 'UNAPPROVED') {
    toast.error(ERROR_MESSAGES.FORBIDDEN);
    return ERROR_MESSAGES.FORBIDDEN;
  }

  // ─── 500+: Server error ───
  if (status >= 500) {
    toast.error(ERROR_MESSAGES.SERVER_ERROR, { icon: '🔧' });
    return ERROR_MESSAGES.SERVER_ERROR;
  }

  // ─── Known error code ───
  const knownMsg = ERROR_MESSAGES[code];
  if (knownMsg) {
    toast.error(knownMsg);
    return knownMsg;
  }

  // ─── Fallback: show original message ───
  const finalMsg = message || ERROR_MESSAGES.SERVER_ERROR;
  toast.error(finalMsg);
  return finalMsg;
}

// ─── Format cooldown seconds → human readable ───
export function formatCooldown(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} phút`;
  const h = Math.floor(seconds / 3600);
  const m = Math.ceil((seconds % 3600) / 60);
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

// ─── Success toast helpers ───
export function showPlantSuccess(plantName: string, emoji: string) {
  console.log('[FARM-DEBUG] showPlantSuccess:', plantName, emoji);
  toast.success(`Đã trồng ${plantName} ${emoji}!`, { duration: 2000 });
}

export function showWaterSuccess(message?: string) {
  console.log('[FARM-DEBUG] showWaterSuccess');
  toast.success(message || 'Đã tưới nước! 💧', { duration: 2000 });
}

export function showHarvestSuccess(plantName: string, emoji: string, xp: number) {
  // MỚI — Không hiện OGN, chỉ hiện XP + message vào kho
  const message = `${emoji} ${plantName} +${xp} XP — Vào kho bán!`;
  console.log('[FARM-DEBUG] showHarvestSuccess:', plantName, xp);
  toast.success(message, {
    duration: 3000,
  });
}

export function showLevelUp(newLevel: number) {
  console.log('[FARM-DEBUG] showLevelUp:', newLevel);
  toast('🎉 Level Up! Level ' + newLevel, {
    duration: 4000,
    style: {
      background: '#7c3aed',
      color: '#fff',
      fontWeight: 'bold',
      border: 'none',
    },
  });
}
