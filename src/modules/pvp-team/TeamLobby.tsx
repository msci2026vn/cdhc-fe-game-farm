import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Room } from '@colyseus/sdk';
import { useAuth } from '@/shared/hooks/useAuth';
import { pvpApi } from '@/shared/api/api-pvp';
import { createTeamRoom, joinTeamRoom, findTeamRoom } from './api-pvp-team';
import { TeamDraftPhase } from './TeamDraftPhase';
import type { TeamRoomState, TeamId, ClientPlayerState } from './pvp-team.types.client';

type LobbyStep = 'menu' | 'waiting' | 'draft';

// ─── PlayerSlot ────────────────────────────────────────────────

interface PlayerSlotProps {
  player: (ClientPlayerState & { sessionId: string }) | undefined;
}

function PlayerSlot({ player }: PlayerSlotProps) {
  if (!player) {
    return (
      <div style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px dashed rgba(255,255,255,0.12)',
        color: '#475569',
        fontSize: 13,
        textAlign: 'center',
      }}>
        Đang chờ...
      </div>
    );
  }
  return (
    <div style={{
      padding: '10px 14px',
      borderRadius: 8,
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.15)',
      fontSize: 13,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>{player.name}</span>
        {player.isReady && (
          <span style={{ color: '#22c55e', fontSize: 12 }}>✅ Sẵn sàng</span>
        )}
      </div>
      <div style={{ marginTop: 4, display: 'flex', gap: 8, color: '#94a3b8', fontSize: 11 }}>
        <span>⚔️{player.str}</span>
        <span>❤️{player.vit}</span>
        <span>💜{player.wis}</span>
        <span>🛡️{player.arm}</span>
        <span>⭐{player.mana}</span>
      </div>
    </div>
  );
}

// ─── Main TeamLobby ────────────────────────────────────────────

interface TeamLobbyProps {
  onBattleStart?: (room: Room<TeamRoomState>, myTeam: TeamId) => void;
}

export default function TeamLobby({ onBattleStart }: TeamLobbyProps = {}) {
  const navigate = useNavigate();
  const { data: auth } = useAuth();

  const [step, setStep] = useState<LobbyStep>('menu');
  const [room, setRoom] = useState<Room<TeamRoomState> | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [players, setPlayers] = useState<(ClientPlayerState & { sessionId: string })[]>([]);
  const [myTeam, setMyTeam] = useState<TeamId>('team_a');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const username = auth?.user?.name ?? 'Player';
  const picture = auth?.user?.picture ?? '';

  const { data: buildData } = useQuery({
    queryKey: ['pvp', 'build'],
    queryFn: pvpApi.getBuild,
    staleTime: 60_000,
  });

  const currentBuild = buildData?.build ?? {
    str: 10, vit: 10, wis: 10, arm: 10, mana: 10,
    skillA: null, skillB: null, skillC: null,
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  // Cleanup khi unmount
  useEffect(() => {
    return () => { room?.leave(); };
  }, [room]);

  // Lắng nghe state updates từ Colyseus
  useEffect(() => {
    if (!room) return;

    const unsub = room.onStateChange((state: TeamRoomState) => {
      // Sync players list
      const list: (ClientPlayerState & { sessionId: string })[] = [];
      state.players.forEach((p: ClientPlayerState, sid: string) => {
        list.push({ ...p, sessionId: sid });
      });
      setPlayers(list);

      // Cập nhật myTeam từ server
      const me = state.players.get(room.sessionId);
      if (me) setMyTeam(me.team);

      // Chuyển sang draft khi đủ 6 người
      if (state.phase === 'draft') setStep('draft');

      // Chuyển sang battle khi countdown hoặc playing bắt đầu
      if (
        (state.phase === 'countdown' || state.phase === 'playing') &&
        room && onBattleStart
      ) {
        const currentTeam = state.players.get(room.sessionId)?.team ?? myTeam;
        onBattleStart(room, currentTeam);
      }
    });

    room.onMessage('player_joined', (data: { username: string; team: TeamId }) => {
      showToast(`${data.username} đã vào ${data.team === 'team_a' ? 'Đội A' : 'Đội B'}`);
    });

    room.onError((_code: number, message: string) => {
      setError(`Lỗi kết nối: ${message}`);
      setStep('menu');
    });

    room.onLeave(() => {
      if (step === 'waiting') {
        setError('Mất kết nối phòng.');
        setStep('menu');
      }
    });

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  // ─── Handlers ──────────────────────────────────────────────

  const handleCreate = async () => {
    if (!currentBuild) return;
    setLoading(true);
    setError('');
    try {
      const r = await createTeamRoom({ username, picture, build: currentBuild });
      setRoom(r);
      setRoomCode(r.id);
      setStep('waiting');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tạo phòng. Thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inputCode.trim() || !currentBuild) return;
    setLoading(true);
    setError('');
    try {
      const r = await joinTeamRoom(inputCode.trim(), { username, picture, build: currentBuild });
      setRoom(r);
      setRoomCode(r.id);
      setStep('waiting');
    } catch {
      setError('Không tìm thấy phòng. Kiểm tra lại mã.');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchmaking = async () => {
    if (!currentBuild) return;
    setLoading(true);
    setError('');
    setStep('waiting');
    try {
      const r = await findTeamRoom({ username, picture, build: currentBuild });
      setRoom(r);
      setRoomCode(r.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Matchmaking thất bại. Thử lại.');
      setStep('menu');
    } finally {
      setLoading(false);
    }
  };

  const handleReady = () => {
    if (!room || isReady) return;
    room.send('ready', {});
    setIsReady(true);
  };

  const handleSwitchTeam = (team: TeamId) => {
    if (!room) return;
    room.send('set_team', { team });
    setMyTeam(team);
  };

  const handleLeave = () => {
    room?.leave();
    setRoom(null);
    setRoomCode('');
    setPlayers([]);
    setIsReady(false);
    setStep('menu');
    setError('');
  };

  // ─── Render: Draft Phase ───────────────────────────────────

  if (step === 'draft' && room) {
    return (
      <TeamDraftPhase
        room={room}
        mySessionId={room.sessionId}
        myTeam={myTeam}
      />
    );
  }

  // ─── Render: Waiting Room ──────────────────────────────────

  if (step === 'waiting') {
    const teamAPlayers = players.filter(p => p.team === 'team_a');
    const teamBPlayers = players.filter(p => p.team === 'team_b');
    const slots = [0, 1, 2];

    return (
      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0f3460 100%)',
        color: '#e0e0e0',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        padding: '16px 16px 80px',
      }}>
        {toast && (
          <div style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: '#1e3a5a', border: '1px solid #3b82f6',
            borderRadius: 10, padding: '10px 20px',
            color: '#e2e8f0', fontSize: 14, fontWeight: 600,
            zIndex: 400, whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            {toast}
          </div>
        )}

        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>⚔️ PvP 3v3 — Phòng Chờ</h2>
          </div>

          {/* Room code */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>Mã phòng:</span>
            <strong style={{ fontSize: 15, letterSpacing: 2 }}>{roomCode}</strong>
            <button
              onClick={() => { navigator.clipboard.writeText(roomCode); showToast('Đã copy!'); }}
              style={{
                marginLeft: 'auto', background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6,
                padding: '4px 10px', color: '#93c5fd', fontSize: 12, cursor: 'pointer',
              }}
            >
              📋 Copy
            </button>
          </div>

          {/* Team slots */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginBottom: 16 }}>
            {/* Team A */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginBottom: 6 }}>
                ⚔️ Đội A
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {slots.map(i => (
                  <PlayerSlot key={i} player={teamAPlayers[i]} />
                ))}
              </div>
              <button
                onClick={() => handleSwitchTeam('team_a')}
                disabled={myTeam === 'team_a'}
                style={{
                  marginTop: 8, width: '100%',
                  padding: '8px', borderRadius: 8,
                  background: myTeam === 'team_a' ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.4)', color: '#93c5fd',
                  fontSize: 12, cursor: myTeam === 'team_a' ? 'default' : 'pointer',
                  opacity: myTeam === 'team_a' ? 0.6 : 1,
                }}
              >
                {myTeam === 'team_a' ? '✓ Đội của bạn' : 'Vào Đội A'}
              </button>
            </div>

            {/* VS */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: '#e94560',
              padding: '0 4px',
            }}>
              VS
            </div>

            {/* Team B */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>
                🛡️ Đội B
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {slots.map(i => (
                  <PlayerSlot key={i} player={teamBPlayers[i]} />
                ))}
              </div>
              <button
                onClick={() => handleSwitchTeam('team_b')}
                disabled={myTeam === 'team_b'}
                style={{
                  marginTop: 8, width: '100%',
                  padding: '8px', borderRadius: 8,
                  background: myTeam === 'team_b' ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5',
                  fontSize: 12, cursor: myTeam === 'team_b' ? 'default' : 'pointer',
                  opacity: myTeam === 'team_b' ? 0.6 : 1,
                }}
              >
                {myTeam === 'team_b' ? '✓ Đội của bạn' : 'Vào Đội B'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleReady}
              disabled={isReady}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 12,
                background: isReady
                  ? 'rgba(34,197,94,0.25)'
                  : 'linear-gradient(135deg,#16a34a,#15803d)',
                border: `1px solid ${isReady ? '#22c55e' : 'transparent'}`,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: isReady ? 'default' : 'pointer',
              }}
            >
              {isReady ? '✅ Đã Sẵn Sàng' : 'Sẵn Sàng'}
            </button>
            <button
              onClick={handleLeave}
              style={{
                padding: '14px 20px',
                borderRadius: 12,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Thoát
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Menu ──────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0f3460 100%)',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: '16px 16px 80px',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: 4 }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#e94560' }}>
            ⚔️ PvP 3v3 Team
          </h1>
        </div>

        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28, textAlign: 'center' }}>
          Kết hợp sức mạnh 3 người — Hạ gục team địch!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Matchmaking */}
          <button
            onClick={() => void handleMatchmaking()}
            disabled={loading}
            style={{
              padding: '16px',
              borderRadius: 14,
              background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
              border: 'none',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            🔍 Tìm Trận (Matchmaking)
          </button>

          {/* Tạo phòng */}
          <button
            onClick={() => void handleCreate()}
            disabled={loading}
            style={{
              padding: '16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#e2e8f0',
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            ➕ Tạo Phòng
          </button>

          {/* Vào phòng bằng mã */}
          <div style={{
            display: 'flex',
            gap: 8,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 14,
            padding: '8px',
          }}>
            <input
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã phòng..."
              maxLength={24}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#e2e8f0',
                fontSize: 15,
                padding: '8px 10px',
              }}
            />
            <button
              onClick={() => void handleJoin()}
              disabled={!inputCode.trim() || loading}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                background: inputCode.trim()
                  ? 'linear-gradient(135deg,#1d4ed8,#1e40af)'
                  : 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: inputCode.trim() && !loading ? 'pointer' : 'default',
                opacity: inputCode.trim() && !loading ? 1 : 0.5,
              }}
            >
              Vào Phòng
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
