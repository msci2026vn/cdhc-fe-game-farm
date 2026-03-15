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

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useUIStore } from '@/shared/stores/uiStore';
import type { WorldBossInfo } from '@/modules/world-boss/types/world-boss.types';
import { coopApi } from './api/api-coop';
import { useCoopRoom } from './hooks/useCoopRoom';
import { useCoopSSE } from './hooks/useCoopSSE';
import { CoopWaitingRoom } from './CoopWaitingRoom';
import CoopBattleView from './CoopBattleView';
import CoopResultScreen from './CoopResultScreen';


interface Props {
  /** WorldBossInfo đã được WorldBossScreen fetch sẵn */
  worldBoss:        WorldBossInfo;
  onExit:           () => void;
  /** Nếu set → join phòng có sẵn (Colyseus roomId) thay vì tạo mới */
  initialRoomId?: string;
}

export default function CoopScreen({ worldBoss, onExit, initialRoomId }: Props) {
  const { data: authData } = useAuth();
  const addToast = useUIStore(s => s.addToast);

  // Colyseus room credentials — chỉ set sau khi backend xác nhận room
  const [roomId,  setRoomId]  = useState('');
  const [token,   setToken]   = useState('');
  const [loading, setLoading] = useState(true);

  // Colyseus hook — chỉ kết nối khi roomId + token sẵn sàng (guard bên trong hook)
  const {
    roomState,
    endResult,
    isConnected,
    isReconnecting,
    showReconnectButton,
    sendReady,
    leaveRoom,
    kickPlayer,
    sendDied,
    sendRespawned,
    reconnect,
  } = useCoopRoom({ roomId, token, eventId: worldBoss.id });

  const myUserId = authData?.user?.id ?? '';
  const isHost = roomState.hostId === myUserId;

  // Respawn: key remount + countdown
  const [battleKey, setBattleKey] = useState(0);
  const [respawnCountdown, setRespawnCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // SSE: coop_invite_response only — invite popups handled by global listener in App.tsx
  useCoopSSE(!!authData?.user, (event) => {
    if (event.type === 'coop_invite_response') {
      if (event.action === 'accept') {
        addToast('Bạn bè đã chấp nhận lời mời!', 'success');
      }
    }
  });

  // ── Khởi tạo: join phòng có sẵn (initialRoomCode) hoặc tạo phòng mới ──
  useEffect(() => {
    (async () => {
      try {
        // 1. Lấy token xác thực Colyseus
        const authToken = await coopApi.getToken();

        // 2a. Join phòng có sẵn qua roomId
        if (initialRoomId) {
          setToken(authToken);
          setRoomId(initialRoomId);
          setLoading(false);
          return;
        }

        // 2b. Kiểm tra đang trong session nào không
        const status = await coopApi.getStatus();

        if (status.inSession && status.roomId && status.phase !== 'ended') {
          // Session cũ còn active — hỏi user muốn rejoin không
          const wantRejoin = window.confirm(
            `Bạn đang có phòng co-op đang chờ (${status.roomId ?? ''}). Vào lại phòng cũ?`,
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

  // ── Handler: respawn after death — 3-2-1 countdown then remount engine ──
  const handleRespawn = useCallback(() => {
    sendDied(); // notify server
    setRespawnCountdown(3);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRespawnCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          sendRespawned(); // notify server: HP reset
          setBattleKey(k => k + 1); // remount CoopBattleView with fresh engine
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [sendDied, sendRespawned]);

  // Cleanup countdown on unmount
  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

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
          roomCode={roomState.roomId}
          players={roomState.players}
          teamSize={roomState.teamSize}
          multiplier={roomState.multiplier}
          isHost={isHost}
          lobbyTimeLeft={roomState.lobbyTimeLeft}
          currentUserId={myUserId}
          onStart={handleStart}
          onLeave={handleLeave}
          onKick={kickPlayer}
        />
      )}

      {/* Phase: active — đang chiến đấu */}
      {roomState.phase === 'active' && isConnected && !respawnCountdown && (
        <CoopBattleView
          key={battleKey}
          worldBoss={worldBoss}
          coopRoomCode={roomState.roomId}
          teamSize={roomState.teamSize}
          multiplier={roomState.multiplier}
          teammates={teammates}
          bossHpPercent={roomState.bossHpPercent}
          showReconnectButton={showReconnectButton}
          onReconnect={reconnect}
          onExit={handleLeave}
          onRespawn={handleRespawn}
        />
      )}

      {/* Respawn countdown overlay */}
      {respawnCountdown !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'white',
        }}>
          <div style={{ fontSize: 80, fontWeight: 900, color: '#22c55e', marginBottom: 16 }}>
            {respawnCountdown}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            Chuẩn bị chiến đấu!
          </div>
        </div>
      )}

      {/* Phase: ended — kết quả */}
      {roomState.phase === 'ended' && endResult && (
        <CoopResultScreen
          result={endResult}
          roomCode={roomState.roomId}
          multiplier={roomState.multiplier}
          onPlayAgain={handlePlayAgain}
          onExit={onExit}
        />
      )}

    </>
  );
}
