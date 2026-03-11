// ═══════════════════════════════════════════════════════════════
// CoopScreen — Entry point Co-op Boss, điều phối state machine
//
// State machine:
//   loading  → đang fetch status + setup room
//   waiting  → CoopWaitingRoom (chờ đủ người)
//   active   → CoopBattleView (đang chiến đấu)
//   ended    → CoopResultScreen (xem kết quả)
//
// QUAN TRỌNG: Colyseus chỉ mount sau khi có roomId — tránh connect sớm
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useUIStore } from '@/shared/stores/uiStore';
import type { WorldBossInfo } from '@/modules/world-boss/types/world-boss.types';
import type { CoopInvitePayload } from './types/coop.types';
import { coopApi } from './api/api-coop';
import { useCoopRoom } from './hooks/useCoopRoom';
import { useCoopSSE } from './hooks/useCoopSSE';
import { CoopWaitingRoom } from './CoopWaitingRoom';
import CoopBattleView from './CoopBattleView';
import CoopResultScreen from './CoopResultScreen';
import { CoopInvitePopup } from './components/CoopInvitePopup';

interface Props {
  /** WorldBossInfo đã được WorldBossScreen fetch sẵn */
  worldBoss:        WorldBossInfo;
  onExit:           () => void;
  /** Nếu set → join phòng có sẵn thay vì tạo mới */
  initialRoomCode?: string;
}

export default function CoopScreen({ worldBoss, onExit, initialRoomCode }: Props) {
  const { data: authData } = useAuth();
  const addToast = useUIStore(s => s.addToast);

  // Colyseus room credentials — chỉ set sau khi backend xác nhận room
  const [roomId,  setRoomId]  = useState('');
  const [token,   setToken]   = useState('');
  const [loading, setLoading] = useState(true);

  // SSE invite popup — nhận lời mời từ người khác trong khi ở màn này
  const [invitePayload, setInvitePayload] = useState<CoopInvitePayload | null>(null);

  // Colyseus hook — chỉ kết nối khi roomId + token sẵn sàng (guard bên trong hook)
  const {
    roomState,
    endResult,
    isConnected,
    isReconnecting,
    showReconnectButton,
    sendReady,
    leaveRoom,
    reconnect,
  } = useCoopRoom({ roomId, token, eventId: worldBoss.id });

  const myUserId = authData?.user?.id ?? '';
  const isHost = roomState.hostId === myUserId;

  // SSE: nhận coop_invite và coop_invite_response
  useCoopSSE(!!authData?.user, (event) => {
    if (event.type === 'coop_invite') {
      // Chỉ hiện popup khi user không đang trong session active
      if (roomState.phase !== 'active') {
        setInvitePayload(event.payload);
      }
    }
    // coop_invite_response: thông báo cho host biết bạn đã accept/reject
    if (event.type === 'coop_invite_response') {
      if (event.action === 'accept') {
        addToast('Bạn đã chấp nhận lời mời!', 'success');
      }
    }
  });

  // ── Khởi tạo: join phòng có sẵn (initialRoomCode) hoặc tạo phòng mới ──
  useEffect(() => {
    (async () => {
      try {
        // 1. Lấy token xác thực Colyseus
        const authToken = await coopApi.getToken();

        // 2a. Join phòng có sẵn qua mã phòng
        if (initialRoomCode) {
          const roomInfo = await coopApi.getRoom(initialRoomCode);
          if (!roomInfo || roomInfo.phase === 'ended') {
            addToast('Phòng không tồn tại hoặc đã kết thúc', 'error');
            onExit();
            return;
          }
          setToken(authToken);
          setRoomId(roomInfo.roomId);
          setLoading(false);
          return;
        }

        // 2b. Kiểm tra đang trong session nào không
        const status = await coopApi.getStatus();

        if (status.inSession && status.roomId && status.phase !== 'ended') {
          // Session cũ còn active — hỏi user muốn rejoin không
          const wantRejoin = window.confirm(
            `Bạn đang có phòng co-op đang chờ (${status.roomCode ?? ''}). Vào lại phòng cũ?`,
          );

          if (wantRejoin && status.roomId) {
            setToken(authToken);
            setRoomId(status.roomId);
            setLoading(false);
            return;
          }
        }

        // 3. Tạo phòng mới
        const { roomId: newRoomId } = await coopApi.createRoom(worldBoss.id);
        setToken(authToken);
        setRoomId(newRoomId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Không thể tạo phòng co-op';
        addToast(msg, 'error');
        onExit();
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handler: chấp nhận lời mời từ người khác ──
  const handleAcceptInvite = useCallback(async () => {
    if (!invitePayload) return;
    setInvitePayload(null);

    try {
      const authToken = await coopApi.getToken();
      const roomInfo = await coopApi.getRoom(invitePayload.roomCode);
      if (!roomInfo || roomInfo.phase === 'ended') {
        addToast('Phòng không còn tồn tại', 'error');
        return;
      }
      // Rời phòng cũ (nếu đang trong phòng) rồi join phòng mới
      if (isConnected) leaveRoom();
      setToken(authToken);
      setRoomId(roomInfo.roomId);
    } catch {
      addToast('Không thể vào phòng được mời', 'error');
    }
  }, [invitePayload, isConnected, leaveRoom, addToast]);

  // ── Handler: host bấm "Bắt Đầu" ──
  // sendReady() → server chuyển phase sang 'active' khi đủ điều kiện
  const handleStart = useCallback(() => {
    sendReady();
  }, [sendReady]);

  // ── Handler: rời phòng và thoát ──
  const handleLeave = useCallback(() => {
    leaveRoom();
    onExit();
  }, [leaveRoom, onExit]);

  // ── Handler: chơi lại (tạo phòng mới) ──
  const handlePlayAgain = useCallback(async () => {
    leaveRoom();
    try {
      const [authToken, { roomId: newRoomId }] = await Promise.all([
        coopApi.getToken(),
        coopApi.createRoom(worldBoss.id),
      ]);
      setToken(authToken);
      setRoomId(newRoomId);
    } catch {
      addToast('Không thể tạo phòng mới', 'error');
      onExit();
    }
  }, [leaveRoom, worldBoss.id, addToast, onExit]);

  // ── Loading: đang tạo phòng / kết nối ──
  if (loading || (!isConnected && !showReconnectButton && roomId)) {
    return (
      <div style={{
        position:       'fixed',
        inset:          0,
        background:     '#111827',
        color:          'white',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            16,
        zIndex:         20,
      }}>
        <div style={{ fontSize: 36 }}>⚔️</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          {isReconnecting ? 'Đang kết nối lại...' : 'Đang tạo phòng co-op...'}
        </div>
        <div style={{
          width:        40,
          height:       40,
          border:       '3px solid #374151',
          borderTop:    '3px solid #f59e0b',
          borderRadius: '50%',
          animation:    'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <button
          onClick={onExit}
          style={{
            marginTop:    8,
            padding:      '8px 20px',
            background:   'transparent',
            color:        '#6b7280',
            border:       '1px solid #374151',
            borderRadius: 8,
            cursor:       'pointer',
            fontSize:     13,
          }}
        >
          Huỷ
        </button>
      </div>
    );
  }

  // ── State machine: hiển thị màn hình theo phase ──
  const teammates = roomState.players.filter(p => p.userId !== myUserId);

  return (
    <>
      {/* Phase: waiting — chờ đủ người */}
      {(roomState.phase === 'waiting' || roomState.phase === 'active' && !isConnected) && (
        <CoopWaitingRoom
          roomCode={roomState.roomCode}
          players={roomState.players}
          teamSize={roomState.teamSize}
          multiplier={roomState.multiplier}
          isHost={isHost}
          lobbyTimeLeft={roomState.lobbyTimeLeft}
          onStart={handleStart}
          onLeave={handleLeave}
        />
      )}

      {/* Phase: active — đang chiến đấu */}
      {roomState.phase === 'active' && isConnected && (
        <CoopBattleView
          worldBoss={worldBoss}
          coopRoomCode={roomState.roomCode}
          teamSize={roomState.teamSize}
          multiplier={roomState.multiplier}
          teammates={teammates}
          bossHpPercent={roomState.bossHpPercent}
          showReconnectButton={showReconnectButton}
          onReconnect={reconnect}
          onExit={handleLeave}
        />
      )}

      {/* Phase: ended — kết quả */}
      {roomState.phase === 'ended' && endResult && (
        <CoopResultScreen
          result={endResult}
          roomCode={roomState.roomCode}
          multiplier={roomState.multiplier}
          onPlayAgain={handlePlayAgain}
          onExit={onExit}
        />
      )}

      {/* SSE Invite Popup — hiện khi nhận lời mời co-op từ bạn */}
      {invitePayload && (
        <CoopInvitePopup
          payload={invitePayload}
          onAccept={handleAcceptInvite}
          onDecline={() => setInvitePayload(null)}
        />
      )}
    </>
  );
}
