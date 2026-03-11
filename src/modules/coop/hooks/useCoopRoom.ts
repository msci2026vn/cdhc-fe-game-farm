// ═══════════════════════════════════════════════════════════════
// useCoopRoom — Quản lý Colyseus WS cho Co-op Boss room
// Pattern: fork từ Colyseus client setup trong PvpTestScreen.tsx
// Xử lý: room state sync, boss HP poll, reconnect logic
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import { Client, type Room } from '@colyseus/sdk';
import type { CoopRoomState, CoopEndResult } from '@/modules/coop/types/coop.types';
import { useUIStore } from '@/shared/stores/uiStore';

// WS URL cho Colyseus co-op server
// DEV: coop server chạy port 3002 (riêng với pvp port 3001)
// PROD: wss://sta.cdhc.vn/coop-ws
const COOP_WS_URL = import.meta.env.DEV
  ? 'ws://localhost:3002'
  : 'wss://sta.cdhc.vn/coop-ws';

// Số lần retry tối đa khi mất kết nối không chủ ý
const MAX_RETRY = 3;

// Progressive backoff delays (ms): 3s → 6s → 10s
// 3s: đủ để server detect disconnect, không quá lâu để UX gián đoạn
// 6s: buffer cho mạng chậm
// 10s: lần cuối trước khi hiện nút manual reconnect
const RETRY_DELAYS = [3000, 6000, 10000];

const DEFAULT_ROOM_STATE: CoopRoomState = {
  phase:         'waiting',
  roomCode:      '',
  eventId:       '',
  teamSize:      1,
  multiplier:    1.0,
  bossHpPercent: 1.0,
  players:       [],
  hostId:        '',
  lobbyTimeLeft: 900,  // 15 phút tối đa
};

export interface UseCoopRoomReturn {
  roomState:           CoopRoomState;
  endResult:           CoopEndResult | null;
  isConnected:         boolean;
  /** true khi đang trong quá trình auto-retry sau disconnect */
  isReconnecting:      boolean;
  /** hiện sau 3 lần auto-retry thất bại — cho phép user bấm nút "Vào Lại" */
  showReconnectButton: boolean;

  sendReady:  () => void;
  sendTaunt:  (emoji: string) => void;
  leaveRoom:  () => void;
  kickPlayer: (targetUserId: string) => void;
  /** Manual reconnect — gọi khi showReconnectButton = true */
  reconnect:  () => Promise<void>;
}

interface UseCoopRoomOptions {
  /** roomId Colyseus (từ coopApi.createRoom() hoặc getRoom()) */
  roomId:  string;
  /** Token xác thực (từ coopApi.getToken()) */
  token:   string;
  /** eventId World Boss đang chiến */
  eventId: string;
}

export function useCoopRoom({ roomId, token, eventId }: UseCoopRoomOptions): UseCoopRoomReturn {
  const addToast = useUIStore(s => s.addToast);

  const [roomState,           setRoomState]           = useState<CoopRoomState>(DEFAULT_ROOM_STATE);
  const [endResult,           setEndResult]           = useState<CoopEndResult | null>(null);
  const [isConnected,         setIsConnected]         = useState(false);
  const [isReconnecting,      setIsReconnecting]      = useState(false);
  const [showReconnectButton, setShowReconnectButton] = useState(false);

  const clientRef           = useRef<Client | null>(null);
  const roomRef             = useRef<Room | null>(null);
  // intentionalLeaveRef: true khi user chủ động rời — không trigger retry
  const intentionalLeaveRef = useRef(false);

  // Attach tất cả message handlers vào room instance
  const attachHandlers = useCallback((r: Room) => {
    roomRef.current = r;

    // room_info: nhận ngay sau join — lưu roomCode + hostId
    r.onMessage('room_info', (data: { roomCode: string; hostId: string }) => {
      setRoomState(prev => ({
        ...prev,
        roomCode: data.roomCode,
        hostId:   data.hostId ?? prev.hostId,
      }));
    });

    // player_list_update: danh sách đầy đủ sau mỗi join/leave — nguồn dữ liệu chính cho player slots
    r.onMessage('player_list_update', (data: {
      players:    Array<{ userId: string; name: string; hp: number; maxHp: number; isHost: boolean }>;
      hostId:     string;
      teamSize:   number;
      multiplier: number;
      phase:      string;
    }) => {
      setRoomState(prev => ({
        ...prev,
        players:    data.players.map(p => ({ ...p, isOnline: true })),
        hostId:     data.hostId,
        teamSize:   data.teamSize,
        multiplier: data.multiplier,
        phase:      data.phase as CoopRoomState['phase'],
      }));
    });

    // kicked: bị host đuổi — rời phòng + toast
    r.onMessage('kicked', () => {
      addToast('Bạn đã bị đuổi khỏi phòng', 'warning');
      intentionalLeaveRef.current = true;
      r.leave();
      setIsConnected(false);
    });

    // lobby_tick: cập nhật đếm ngược lobby
    r.onMessage('lobby_tick', (data: { timeLeft: number }) => {
      setRoomState(prev => ({ ...prev, lobbyTimeLeft: data.timeLeft }));
    });

    // state_update: sync toàn bộ CoopRoomState — gửi sau mỗi sự kiện quan trọng
    r.onMessage('state_update', (data: CoopRoomState) => {
      setRoomState(data);
    });

    // boss_hp_update: % HP boss cập nhật 3s/lần từ BE CoopRoom batchSender
    r.onMessage('boss_hp_update', (data: { hpPercent: number }) => {
      setRoomState(prev => ({ ...prev, bossHpPercent: data.hpPercent }));
    });

    // player_joined: có người mới vào → update teamSize + multiplier
    r.onMessage('player_joined', (data: { name: string; teamSize: number; multiplier: number }) => {
      setRoomState(prev => ({ ...prev, teamSize: data.teamSize, multiplier: data.multiplier }));
      addToast(`${data.name} vào phòng! Hệ số ×${data.multiplier}`, 'success');
    });

    // player_left: có người rời → update teamSize + multiplier
    r.onMessage('player_left', (data: { name: string; teamSize: number; multiplier: number }) => {
      setRoomState(prev => ({ ...prev, teamSize: data.teamSize, multiplier: data.multiplier }));
      addToast(`${data.name} đã rời phòng`, 'warning');
    });

    // player_reconnected: đồng đội kết nối lại sau khi offline
    r.onMessage('player_reconnected', (data: { name: string }) => {
      addToast(`${data.name} đã kết nối lại ✅`, 'info');
      // state_update sẽ sync isOnline = true ngay sau
    });

    // coop_ended: boss chết hoặc tất cả rời — chuyển sang CoopResultScreen
    r.onMessage('coop_ended', (data: CoopEndResult) => {
      setEndResult(data);
      setRoomState(prev => ({ ...prev, phase: 'ended' }));
    });

    // need_more_players: server cảnh báo chưa đủ người để start
    r.onMessage('need_more_players', () => {
      addToast('Cần ít nhất 2 người để bắt đầu!', 'warning');
    });

    // onLeave: xử lý disconnect — auto-retry 3 lần với progressive backoff
    // code 1000 = intentional close → KHÔNG retry
    r.onLeave((code) => {
      setIsConnected(false);
      if (intentionalLeaveRef.current || code === 1000) return;

      setIsReconnecting(true);

      const tryReconnect = async (attempt: number) => {
        if (attempt >= MAX_RETRY) {
          setIsReconnecting(false);
          setShowReconnectButton(true);
          addToast('Mất kết nối. Bấm "Vào Lại Phòng" để thử lại.', 'error');
          return;
        }

        const delay = RETRY_DELAYS[attempt];
        addToast(`Mất kết nối. Đang thử lại (${attempt + 1}/${MAX_RETRY})...`, 'warning', undefined, delay - 500);

        await new Promise<void>(resolve => setTimeout(resolve, delay));

        try {
          if (!clientRef.current) return;
          const newRoom = await clientRef.current.joinById(roomId, { token, eventId });
          attachHandlers(newRoom);
          setIsConnected(true);
          setIsReconnecting(false);
          addToast('Đã kết nối lại ✅', 'success');
        } catch {
          tryReconnect(attempt + 1);
        }
      };

      tryReconnect(0);
    });

    setIsConnected(true);
    setIsReconnecting(false);
    setShowReconnectButton(false);

    // Fix race condition: room_info + player_list_update được server gửi trong onJoin
    // nhưng tới client TRƯỚC khi attachHandlers() đăng ký handlers → bị drop.
    // Gửi get_state để server replay lại state hiện tại cho client này.
    r.send('get_state', {});
  }, [roomId, token, eventId, addToast]);

  // Khởi tạo Colyseus client + join room khi roomId/token sẵn sàng
  useEffect(() => {
    if (!roomId || !token) return;

    const client = new Client(COOP_WS_URL);
    clientRef.current = client;
    intentionalLeaveRef.current = false;

    (async () => {
      try {
        const room = await client.joinById(roomId, { token, eventId });
        attachHandlers(room);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Không thể kết nối phòng';
        addToast(`Lỗi kết nối: ${msg}`, 'error');
        setShowReconnectButton(true);
      }
    })();

    // Cleanup: rời phòng khi component unmount
    return () => {
      intentionalLeaveRef.current = true;
      roomRef.current?.leave();
    };
  }, [roomId, token, eventId, attachHandlers, addToast]);

  const sendReady = useCallback(() => {
    roomRef.current?.send('ready', {});
  }, []);

  const sendTaunt = useCallback((emoji: string) => {
    roomRef.current?.send('taunt', { emoji });
  }, []);

  const kickPlayer = useCallback((targetUserId: string) => {
    roomRef.current?.send('kick', { targetUserId });
  }, []);

  const leaveRoom = useCallback(() => {
    intentionalLeaveRef.current = true;
    roomRef.current?.leave();
    setIsConnected(false);
  }, []);

  // Manual reconnect — gọi sau khi 3 lần auto-retry đều thất bại
  const reconnect = useCallback(async () => {
    if (!clientRef.current) return;
    setShowReconnectButton(false);
    setIsReconnecting(true);

    try {
      const newRoom = await clientRef.current.joinById(roomId, { token, eventId });
      attachHandlers(newRoom);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối';
      addToast(`Kết nối thất bại: ${msg}`, 'error');
      setShowReconnectButton(true);
      setIsReconnecting(false);
    }
  }, [roomId, token, eventId, attachHandlers, addToast]);

  return {
    roomState,
    endResult,
    isConnected,
    isReconnecting,
    showReconnectButton,
    sendReady,
    sendTaunt,
    leaveRoom,
    kickPlayer,
    reconnect,
  };
}
