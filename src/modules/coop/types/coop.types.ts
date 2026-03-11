// ═══════════════════════════════════════════════════════════════
// Coop Types — Định nghĩa state cho Co-op Boss multiplayer
// ═══════════════════════════════════════════════════════════════

/** CoopPlayer — trạng thái của 1 người chơi trong phòng (hiển thị ở TeammateStatus) */
export interface CoopPlayer {
  /** ID người dùng (từ DB) */
  userId:   string;
  /** Tên hiển thị */
  name:     string;
  /** HP hiện tại của player */
  hp:       number;
  /** HP tối đa (dùng để tính %) */
  maxHp:    number;
  /** true nếu người này là host của phòng */
  isHost:   boolean;
  /** false khi mất kết nối chưa reconnect — tên mờ + icon ⚡ */
  isOnline: boolean;
}

/** CoopRoomState — toàn bộ trạng thái phòng (từ Colyseus + BE) */
export interface CoopRoomState {
  /** Giai đoạn hiện tại: waiting = chờ đủ người, active = đang đánh, ended = xong */
  phase:         'waiting' | 'active' | 'ended';
  /** Mã phòng hiển thị cho người dùng (VD: "A3K7") */
  roomCode:      string;
  /** ID sự kiện World Boss đang chiến */
  eventId:       string;
  /** Số người hiện đang trong phòng */
  teamSize:      number;
  /** Hệ số nhân damage: 1.0 (1 người) → 1.5 (tối đa) */
  multiplier:    number;
  /** % HP boss còn lại trên toàn server (0.0 = chết, 1.0 = đầy) */
  bossHpPercent: number;
  /** Danh sách người chơi trong phòng */
  players:       CoopPlayer[];
  /** userId của host (chỉ host mới thấy nút Bắt Đầu) */
  hostId:        string;
  /** Giây còn lại trong lobby (tối đa 15 phút = 900s, sau đó phòng tự đóng) */
  lobbyTimeLeft: number;
}

/** CoopBattleState — trạng thái chiến đấu cá nhân của player (từ local engine) */
export interface CoopBattleState {
  /** 64 ô của bảng match-3 (8×8) */
  myBoard:   number[];
  /** HP hiện tại */
  myHp:      number;
  /** HP tối đa */
  myMaxHp:   number;
  /** Mana hiện tại */
  myMana:    number;
  /** Điểm tích lũy trong session này */
  myScore:   number;
  /** Damage cá nhân đã gây ra (trước khi nhân multiplier, BE tự tính) */
  myDamage:  number;
}

/** CoopEndResult — kết quả khi nhận message coop_ended từ server */
export interface CoopEndResult {
  /** completed = boss chết, abandoned = tất cả rời phòng trước khi boss chết */
  reason:  'completed' | 'abandoned';
  /** Bảng xếp hạng damage nội bộ team */
  players: Array<{
    /** Tên người chơi */
    name:    string;
    /** Tổng damage đã gây (sau khi BE nhân multiplier) */
    damage:  number;
    /** % đóng góp so với tổng damage cả team */
    percent: number;
    /** true nếu đây là MVP (người có damage cao nhất) */
    isMvp:   boolean;
  }>;
}

/** CoopInvitePayload — payload nhận qua SSE channel coop:invite:{userId} */
export interface CoopInvitePayload {
  /** userId người gửi lời mời */
  fromUserId:    string;
  /** Tên hiển thị của người mời */
  fromUserName:  string;
  /** Mã phòng để join vào */
  roomCode:      string;
  /** Tên boss đang chiến trong phòng */
  bossName:      string;
  /** % HP boss còn lại tại thời điểm gửi lời mời */
  bossHpPercent: number;
  /** Multiplier sẽ áp dụng nếu accept (VD: 1.2 khi đủ 2 người) */
  teamBonus:     number;
}

/** CoopSSEEvent — các loại event nhận từ SSE /api/coop/events */
export type CoopSSEEvent =
  | { type: 'coop_invite';          payload: CoopInvitePayload }
  | { type: 'coop_invite_response'; inviteId: string; action: 'accept' | 'reject'; roomCode?: string; roomId?: string };
