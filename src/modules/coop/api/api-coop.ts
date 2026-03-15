// ═══════════════════════════════════════════════════════════════
// API Coop — REST endpoints cho Co-op Boss sessions
// Pattern: follow api-pvp.ts (pvpFetch wrapper)
// ═══════════════════════════════════════════════════════════════

import { API_BASE_URL, handleUnauthorized } from '@/shared/api/api-utils';
import type { WorldBossAttackPayload, WorldBossAttackResult } from '@/modules/world-boss/types/world-boss.types';

/** Lịch sử một session co-op đã tham gia */
/** Phòng co-op đang chờ trong room list */
export interface CoopRoomSummary {
  roomId:     string;
  eventId:    string;
  hostId:     string;
  hostName:   string;
  teamSize:   number;
  maxSize:    number;
  multiplier: number;
  createdAt:  number;
}

export interface CoopHistoryItem {
  sessionId:   string;
  eventId:     string;
  bossName:    string;
  completedAt: string;
  reason:      'completed' | 'abandoned';
  myDamage:    number;
  teamSize:    number;
  multiplier:  number;
}

async function coopFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE_URL + '/api/coop' + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (res.status === 401) {
    handleUnauthorized('coop' + path);
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string })?.error || `Coop API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const coopApi = {
  /** Danh sách phòng co-op đang waiting */
  getRooms: () =>
    coopFetch<{ rooms: CoopRoomSummary[] }>('/rooms'),

  /**
   * Tạo phòng Co-op mới cho World Boss event.
   * Gọi khi host bấm nút "Co-op" trên WorldBossScreen.
   */
  createRoom: (eventId: string) =>
    coopFetch<{ roomId: string }>('/create', {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    }),

  /**
   * Lấy thông tin phòng theo Colyseus roomId.
   * Dùng để FE kiểm tra phòng còn tồn tại không trước khi join.
   */
  getRoom: (roomId: string) =>
    coopFetch<{
      roomId:    string;
      phase:     'waiting' | 'active' | 'ended';
      teamSize:  number;
      eventId:   string;
    } | null>(`/room/${roomId}`),

  /**
   * Mời bạn vào phòng Co-op.
   * Bạn sẽ nhận lời mời qua SSE channel coop:invite:{toUserId}.
   */
  inviteToRoom: (toUserId: string, roomId: string) =>
    coopFetch<{ ok: boolean }>('/invite', {
      method: 'POST',
      body: JSON.stringify({ toUserId, roomId }),
    }),

  /**
   * Kiểm tra player có đang trong session co-op không.
   * Gọi khi CoopScreen mount: hỏi "Vào lại phòng cũ?" hay "Tạo phòng mới?"
   */
  getStatus: () =>
    coopFetch<{
      inSession: boolean;
      roomId?:   string;
      phase?:    'waiting' | 'active' | 'ended';
    }>('/status'),

  /**
   * Lấy lịch sử các session co-op đã tham gia.
   * Có thể hiển thị ở profile hoặc history tab.
   */
  getHistory: (limit = 10, offset = 0) =>
    coopFetch<{ sessions: CoopHistoryItem[] }>(`/history?limit=${limit}&offset=${offset}`),

  /**
   * Lấy token xác thực để kết nối Colyseus coop room.
   * Reuse pvp-token endpoint — cùng loại JWT, server phân biệt qua room type.
   */
  getToken: async (): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/auth/pvp-token`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Token error: ${res.status}`);
    const json = await res.json() as { success: boolean; data?: { token: string }; error?: { message?: string } };
    if (!json.success) throw new Error(json.error?.message || 'coop-token error');
    return json.data!.token;
  },

  /**
   * Gửi damage batch lên server cho Co-op mode.
   * Thêm coopRoomCode để BE tự nhân multiplier từ Redis — FE không tính.
   * Anti-cheat: server đọc multiplier từ Redis, không tin vào FE.
   */
  attack: async (data: WorldBossAttackPayload & { coopRoomCode: string }): Promise<WorldBossAttackResult> => {
    const res = await fetch(API_BASE_URL + '/api/world-boss/attack', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId:      data.eventId,
        damageDelta:  data.damageDelta,
        hits:         data.hits,
        maxCombo:     data.maxCombo,
        final:        data.final ?? false,
        username:     data.username,
        coopRoomCode: data.coopRoomCode,
      }),
    });
    if (res.status === 401) {
      handleUnauthorized('coop.attack');
      throw new Error('Session expired');
    }
    // 429 on_cooldown — tích lũy damage và thử lại ở interval tiếp theo (không throw)
    if (res.status === 429) {
      const errData = await res.json().catch(() => ({})) as { retryAfter?: number };
      return { ok: false, error: 'on_cooldown', retryAfter: errData.retryAfter ?? 2.5 } as WorldBossAttackResult;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `HTTP ${res.status}`);
    }
    const json = await res.json() as { data?: WorldBossAttackResult } & WorldBossAttackResult;
    return json.data ?? json;
  },
};
