import { useState, useEffect, useRef, useCallback } from 'react';
import { Client, type Room } from '@colyseus/sdk';
import { useAuth } from '@/shared/hooks/useAuth';

const WS_URL = import.meta.env.DEV
  ? 'ws://localhost:3001'
  : 'wss://sta.cdhc.vn/pvp-ws';

const API_BASE = import.meta.env.VITE_API_URL || 'https://sta.cdhc.vn';

// 4 gem colours: 0=red 1=blue 2=yellow 3=green
const GEM_COLORS = ['#e53935', '#1e88e5', '#fdd835', '#43a047'];
const GEM_LABELS = ['🔴', '🔵', '🟡', '🟢'];

interface PlayerInfo {
  id: string;
  name: string;
  ready: boolean;
}

interface RoomStateBroadcast {
  phase: 'waiting' | 'ready' | 'playing' | 'finished';
  roomCode: string;
  hostId: string;
  countdown: number;
  players: Record<string, PlayerInfo>;
}

async function fetchPvpToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/pvp-token`, { credentials: 'include' });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Chưa đăng nhập');
    throw new Error(`Lấy token thất bại: HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'pvp-token error');
  return json.data.token;
}

// ─── Mini Board (opponent, 20px cells) ────────────────────────────────────────
function MiniBoard({ tiles }: { tiles: number[] }) {
  if (!tiles.length) return null;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(8, 20px)',
      gap: 1, background: '#111',
    }}>
      {tiles.map((gem, i) => (
        <div key={i} style={{
          width: 20, height: 20, borderRadius: 3,
          background: GEM_COLORS[gem] ?? '#333',
        }} />
      ))}
    </div>
  );
}

// ─── Main Board (my board, 40px cells) ────────────────────────────────────────
function MainBoard({ tiles }: { tiles: number[] }) {
  if (!tiles.length) return null;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(8, 40px)',
      gap: 2, background: '#0d1b2a', padding: 4, borderRadius: 8,
      border: '1px solid #1e4d78',
    }}>
      {tiles.map((gem, i) => (
        <div key={i} style={{
          width: 40, height: 40, borderRadius: 6,
          background: GEM_COLORS[gem] ?? '#333',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, userSelect: 'none',
          boxShadow: `0 2px 6px ${GEM_COLORS[gem] ?? '#000'}66`,
        }}>
          {GEM_LABELS[gem]}
        </div>
      ))}
    </div>
  );
}

// ─── Countdown overlay ─────────────────────────────────────────────────────────
function CountdownOverlay({ count }: { count: number }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
    }}>
      <div key={count} style={{
        fontSize: 120, fontWeight: 900, color: '#e94560',
        animation: 'cdPop 0.85s ease-out forwards',
        textShadow: '0 0 40px #e9456088',
      }}>
        {count}
      </div>
      <style>{`
        @keyframes cdPop {
          0%   { transform: scale(2.2); opacity: 1; }
          100% { transform: scale(0.7); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function PvpTestScreen() {
  const { data: auth } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const roomRef = useRef<Room | null>(null);

  const [inRoom, setInRoom] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [roomState, setRoomState] = useState<RoomStateBroadcast | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [mySessionId, setMySessionId] = useState('');
  const [myReady, setMyReady] = useState(false);
  const [myBoard, setMyBoard] = useState<number[]>([]);
  const [opponentBoard, setOpponentBoard] = useState<number[]>([]);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState('');

  const addLog = useCallback((msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  }, []);

  useEffect(() => {
    clientRef.current = new Client(WS_URL);
    addLog(`Client → ${WS_URL}`);
    return () => { roomRef.current?.leave(); };
  }, [addLog]);

  const attachHandlers = useCallback((r: Room) => {
    roomRef.current = r;

    r.onMessage('room_info', (data: {
      roomId: string; roomCode: string; isHost: boolean; mySessionId: string; myOrder: 1 | 2;
    }) => {
      setRoomId(data.roomId);
      setIsHost(data.isHost);
      setMySessionId(data.mySessionId);
      addLog(`Vào phòng | id: ${data.roomId} | host: ${data.isHost}`);
    });

    r.onMessage('state_update', (data: RoomStateBroadcast) => {
      setRoomState(data);
      setOpponentLeft(false);
      const names = Object.values(data.players).map(p => p.name).join(', ');
      addLog(`State: [${data.phase}] cd:${data.countdown} | ${names || '(trống)'}`);
    });

    r.onMessage('game_start', (data: { myBoard: number[]; opponentBoard: number[] }) => {
      setMyBoard(data.myBoard);
      setOpponentBoard(data.opponentBoard);
      addLog('Board nhận thành công → Game bắt đầu!');
    });

    r.onError((code, msg) => {
      addLog(`❌ Lỗi room: ${msg} (${code})`);
      setError(`${code}: ${msg}`);
    });

    r.onLeave((code) => {
      setInRoom(false);
      setRoomState(null);
      setRoomId('');
      setIsHost(false);
      setMySessionId('');
      setMyReady(false);
      setMyBoard([]);
      setOpponentBoard([]);
      if (code === 4001) {
        setOpponentLeft(false);
        setError('Bạn đã bị đuổi khỏi phòng!');
        addLog('⚠️ Bị kick khỏi phòng');
      } else if (code !== 1000) {
        setOpponentLeft(true);
        addLog(`Đối thủ rời phòng (code: ${code})`);
      } else {
        addLog('Đã rời phòng');
      }
    });

    setInRoom(true);
    setOpponentLeft(false);
    setMyReady(false);
  }, [addLog]);

  const handleCreate = async () => {
    if (!clientRef.current) return;
    setError('');
    setConnecting(true);
    try {
      const token = await fetchPvpToken();
      addLog('Đang tạo phòng...');
      const r = await clientRef.current.create('pvp_room', { token });
      attachHandlers(r);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      addLog(`❌ Tạo phòng thất bại: ${msg}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleJoin = async () => {
    if (!clientRef.current) return;
    const code = inputCode.trim();
    if (!code) return;
    setError('');
    setConnecting(true);
    try {
      const token = await fetchPvpToken();
      addLog(`Join: ${code}...`);
      const r = await clientRef.current.joinById(code, { token });
      attachHandlers(r);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('INVALID_TOKEN') || msg.includes('NO_TOKEN')) {
        setError('Token không hợp lệ — thử đăng nhập lại');
      } else if (msg.includes('not found') || msg.includes('404')) {
        setError(`Không tìm thấy phòng: ${code}`);
      } else if (msg.includes('full') || msg.includes('maxClients')) {
        setError('Phòng đã đủ 2 người');
      } else {
        setError(msg);
      }
      addLog(`❌ Join thất bại: ${msg}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleLeave = () => {
    roomRef.current?.leave();
    setInRoom(false);
    setRoomState(null);
    setRoomId('');
    setIsHost(false);
    setMySessionId('');
    setMyReady(false);
    setMyBoard([]);
    setOpponentBoard([]);
    addLog('Đã rời phòng');
  };

  const handleReady = () => {
    if (!roomRef.current) return;
    roomRef.current.send('ready');
    setMyReady(true);
    addLog('Gửi: Sẵn sàng');
  };

  const handleStart = () => {
    if (!roomRef.current) return;
    roomRef.current.send('start');
    addLog('Gửi: Bắt Đầu');
  };

  const handleKick = (sessionId: string) => {
    if (!roomRef.current) return;
    roomRef.current.send('kick', { sessionId });
    addLog(`Gửi: Kick ${sessionId.slice(0, 6)}...`);
  };

  // ── Derived state ──
  const phase = roomState?.phase ?? 'waiting';
  const countdown = roomState?.countdown ?? -1;
  const playersArr = roomState ? Object.entries(roomState.players) : [];
  const hostSessionId = roomState?.hostId ?? '';

  // Find opponent sessionId
  const opponentEntry = playersArr.find(([sid]) => sid !== mySessionId);
  const opponentSessionId = opponentEntry?.[0] ?? '';
  const opponentPlayer = opponentEntry?.[1];

  // My player info
  const myPlayer = mySessionId ? roomState?.players[mySessionId] : undefined;

  // Can host start? all non-host players must be ready
  const canStart = isHost && playersArr.length === 2 &&
    playersArr.every(([sid, p]) => sid === hostSessionId || p.ready);

  // Is board visible?
  const showBoard = phase === 'playing' && myBoard.length === 64;
  const showCountdown = phase === 'playing' && countdown > 0;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
      color: '#e0e0e0',
      fontFamily: 'monospace',
      padding: 16,
    }}>
      {/* Countdown overlay */}
      {showCountdown && <CountdownOverlay count={countdown} />}

      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e94560', margin: 0 }}>🎮 PVP Arena</h1>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: '#555' }}>{WS_URL}</p>
        </div>

        {/* Status bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#0d0d1a', borderRadius: 8, padding: '8px 14px', marginBottom: 12,
          border: '1px solid #222',
        }}>
          <span style={{ fontSize: 12, color: '#aaa' }}>👤 {auth?.user?.name || '(guest)'}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
            background: inRoom ? '#1a5c2a' : connecting ? '#5c4a1a' : '#3a1a1a',
            color: inRoom ? '#4caf50' : connecting ? '#ff9800' : '#f44336',
          }}>
            {inRoom ? '● Connected' : connecting ? '◌ ...' : '○ Off'}
          </span>
        </div>

        {/* Opponent left notice */}
        {opponentLeft && !inRoom && (
          <div style={{
            background: '#3a1a1a', border: '1px solid #c62828', borderRadius: 8,
            padding: '10px 14px', marginBottom: 12, color: '#ef9a9a', fontSize: 13, textAlign: 'center',
          }}>
            ⚠️ Đối thủ đã rời phòng
          </div>
        )}

        {/* ── BOARD VIEW (phase=playing, board loaded) ── */}
        {inRoom && showBoard && (
          <div style={{ marginBottom: 16 }}>
            {/* Player HUDs */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginBottom: 8,
              background: '#0d1b2a', borderRadius: 8, padding: '8px 12px',
              border: '1px solid #1e4d78',
            }}>
              <div>
                <div style={{ fontSize: 12, color: '#aaa' }}>⚔️ {myPlayer?.name ?? 'Tôi'}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#4caf50' }}>0</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#aaa' }}>{opponentPlayer?.name ?? 'Đối thủ'} 🛡️</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#e94560' }}>0</div>
              </div>
            </div>

            {/* My board (big) */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>BOARD CỦA BẠN</div>
              <MainBoard tiles={myBoard} />
            </div>

            {/* Opponent board (mini) */}
            <div>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>BOARD ĐỐI THỦ (preview)</div>
              <MiniBoard tiles={opponentBoard} />
            </div>

            {/* Leave button */}
            <button onClick={handleLeave} style={{
              width: '100%', marginTop: 12, padding: '10px',
              background: 'transparent', border: '1px solid #555',
              color: '#999', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            }}>🚪 Rời Phòng</button>
          </div>
        )}

        {/* ── LOBBY VIEW (not playing, or playing but board not ready yet) ── */}
        {inRoom && !showBoard && roomState && (
          <div style={{ background: '#0d1b2a', border: '1px solid #1e4d78', borderRadius: 8, padding: 14, marginBottom: 12 }}>

            {/* Room header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>MÃ PHÒNG (join)</div>
                <div style={{
                  fontSize: 13, fontWeight: 800, letterSpacing: 1, color: '#e94560',
                  cursor: 'pointer', wordBreak: 'break-all',
                }} title="Click copy" onClick={() => { navigator.clipboard?.writeText(roomId); addLog('Copied room ID'); }}>
                  {roomId}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>PHASE</div>
                <div style={{
                  fontSize: 15, fontWeight: 700, textTransform: 'uppercase',
                  color: phase === 'ready' ? '#4caf50' : phase === 'waiting' ? '#ff9800' : '#4fc3f7',
                }}>{phase}</div>
              </div>
            </div>

            {/* Player slots */}
            <div style={{ borderTop: '1px solid #1e3a5a', paddingTop: 10, marginBottom: 10 }}>
              {[0, 1].map(i => {
                const [sid, p] = playersArr[i] ?? ['', undefined];
                const isThisHost = sid === hostSessionId;
                const isMe = sid === mySessionId;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 0', opacity: p ? 1 : 0.35,
                    borderBottom: i === 0 ? '1px solid #1e3a5a' : 'none',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? '#e94560' : '#4fc3f7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>P{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {p ? p.name : 'Đang chờ...'}
                        {p && isThisHost && <span style={{ fontSize: 10, color: '#fdd835', marginLeft: 6 }}>👑HOST</span>}
                        {p && isMe && <span style={{ fontSize: 10, color: '#aaa', marginLeft: 4 }}>(bạn)</span>}
                      </div>
                      {p && (
                        <div style={{ fontSize: 11, color: (isThisHost || p.ready) ? '#4caf50' : '#ff9800' }}>
                          {isThisHost ? '✓ Host' : p.ready ? '✅ Sẵn sàng' : '○ Chưa sẵn sàng'}
                        </div>
                      )}
                    </div>
                    {/* Kick button — only host sees, only for opponent */}
                    {p && isHost && sid !== mySessionId && (
                      <button onClick={() => handleKick(sid)} style={{
                        padding: '4px 10px', background: '#5c1a1a', border: '1px solid #c62828',
                        color: '#ef9a9a', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                      }}>Đuổi</button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Non-host: Ready button */}
              {!isHost && (
                <button onClick={handleReady} disabled={myReady} style={{
                  padding: '11px', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: myReady ? 'default' : 'pointer',
                  background: myReady ? '#1a5c2a' : '#1e88e5',
                  color: '#fff', border: 'none', opacity: myReady ? 0.7 : 1,
                }}>
                  {myReady ? '✅ Đã sẵn sàng' : '🙌 Sẵn Sàng'}
                </button>
              )}

              {/* Host: Start button */}
              {isHost && (
                <button onClick={handleStart} disabled={!canStart} style={{
                  padding: '11px', borderRadius: 6, fontSize: 14, fontWeight: 700,
                  cursor: canStart ? 'pointer' : 'not-allowed',
                  background: canStart ? '#e94560' : '#333',
                  color: '#fff', border: 'none', opacity: canStart ? 1 : 0.5,
                }}>
                  {canStart ? '🚀 Bắt Đầu!' : '⏳ Chờ đối thủ sẵn sàng...'}
                </button>
              )}

              {/* Leave */}
              <button onClick={handleLeave} style={{
                padding: '10px', background: 'transparent', border: '1px solid #e94560',
                color: '#e94560', borderRadius: 6, fontSize: 13, cursor: 'pointer',
              }}>🚪 Rời Phòng</button>
            </div>
          </div>
        )}

        {/* ── ENTRY VIEW (not in room) ── */}
        {!inRoom && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            <button onClick={handleCreate} disabled={connecting} style={{
              padding: '14px', background: connecting ? '#333' : '#e94560',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 16, fontWeight: 700, cursor: connecting ? 'not-allowed' : 'pointer',
              opacity: connecting ? 0.7 : 1,
            }}>
              {connecting ? '⏳ Đang xử lý...' : '🏠 Tạo Phòng Mới'}
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Nhập Room ID để join..."
                style={{
                  flex: 1, padding: '12px 14px', background: '#0d0d1a',
                  border: '1px solid #444', color: '#fff', borderRadius: 8,
                  fontSize: 13, outline: 'none',
                }}
              />
              <button onClick={handleJoin} disabled={connecting || !inputCode.trim()} style={{
                padding: '12px 18px', background: inputCode.trim() && !connecting ? '#4fc3f7' : '#333',
                color: '#000', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700,
                cursor: !inputCode.trim() || connecting ? 'not-allowed' : 'pointer',
                opacity: !inputCode.trim() || connecting ? 0.5 : 1, whiteSpace: 'nowrap',
              }}>Join</button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 10, padding: '10px 14px', background: '#2a0d0d',
            border: '1px solid #c62828', borderRadius: 8, color: '#ef9a9a', fontSize: 13,
          }}>
            ⚠️ {error}
            <button onClick={() => setError('')} style={{
              float: 'right', background: 'none', border: 'none', color: '#ef9a9a', cursor: 'pointer', fontSize: 14,
            }}>✕</button>
          </div>
        )}

        {/* Log */}
        <div style={{ background: '#050510', border: '1px solid #1a1a2e', borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ fontSize: 10, color: '#444', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Log</div>
          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {log.length === 0
              ? <div style={{ fontSize: 11, color: '#333' }}>Chưa có activity...</div>
              : log.map((l, i) => (
                <div key={i} style={{
                  fontSize: 10, padding: '2px 0', borderBottom: '1px solid #0a0a1a',
                  color: l.includes('❌') || l.includes('⚠️') ? '#ef5350' : '#8bc34a',
                }}>{l}</div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
