import { useState, useEffect, useRef, useCallback } from 'react';
import { Client, type Room } from '@colyseus/sdk';
import { useAuth } from '@/shared/hooks/useAuth';

const WS_URL = import.meta.env.DEV
  ? 'ws://localhost:3001'
  : 'wss://sta.cdhc.vn/pvp-ws';

const API_BASE = import.meta.env.VITE_API_URL || 'https://sta.cdhc.vn';

interface PlayerInfo {
  id: string;
  name: string;
  ready: boolean;
}

interface RoomState {
  phase: 'waiting' | 'ready' | 'playing' | 'finished';
  roomCode: string;
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

export default function PvpTestScreen() {
  const { data: auth } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const roomRef = useRef<Room | null>(null);

  const [inRoom, setInRoom] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [roomId, setRoomId] = useState('');      // Colyseus room ID (used to joinById)
  const [roomCode, setRoomCode] = useState('');  // human-friendly code
  const [inputCode, setInputCode] = useState('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState('');

  const addLog = useCallback((msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 25));
  }, []);

  useEffect(() => {
    clientRef.current = new Client(WS_URL);
    addLog(`Client khởi tạo → ${WS_URL}`);
    return () => { roomRef.current?.leave(); };
  }, [addLog]);

  const attachHandlers = useCallback((r: Room) => {
    roomRef.current = r;

    r.onMessage('room_info', (data: { roomId: string; roomCode: string }) => {
      setRoomId(data.roomId);
      setRoomCode(data.roomCode);
      addLog(`Vào phòng thành công | roomCode: ${data.roomCode}`);
    });

    r.onMessage('state_update', (data: RoomState) => {
      setRoomState(data);
      setOpponentLeft(false);
      const names = Object.values(data.players).map(p => p.name).join(', ');
      addLog(`State: [${data.phase}] players: ${names || '(trống)'}`);
    });

    r.onError((code, msg) => {
      addLog(`❌ Lỗi room: ${msg} (${code})`);
      setError(`${code}: ${msg}`);
    });

    r.onLeave((code) => {
      setInRoom(false);
      setRoomState(null);
      setRoomId('');
      setRoomCode('');
      if (code !== 1000) {
        setOpponentLeft(true);
        addLog(`Đối thủ đã rời phòng (code: ${code})`);
      } else {
        addLog('Đã rời phòng');
      }
    });

    setInRoom(true);
    setOpponentLeft(false);
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
      addLog(`Đang join: ${code}...`);
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
    setRoomCode('');
    addLog('Đã rời phòng');
  };

  const players = roomState ? Object.values(roomState.players) : [];

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
      color: '#e0e0e0',
      fontFamily: 'monospace',
      padding: 16,
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e94560', margin: 0 }}>🎮 PVP Test</h1>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#666' }}>{WS_URL}</p>
        </div>

        {/* Status bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#0d0d1a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, border: '1px solid #333',
        }}>
          <span style={{ fontSize: 13, color: '#aaa' }}>👤 {auth?.user?.name || '(guest)'}</span>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
            background: inRoom ? '#1a5c2a' : connecting ? '#5c4a1a' : '#3a1a1a',
            color: inRoom ? '#4caf50' : connecting ? '#ff9800' : '#f44336',
          }}>
            {inRoom ? '● Connected' : connecting ? '◌ Connecting...' : '○ Disconnected'}
          </span>
        </div>

        {/* Opponent left notice */}
        {opponentLeft && !inRoom && (
          <div style={{
            background: '#3a1a1a', border: '1px solid #c62828', borderRadius: 8,
            padding: '12px 14px', marginBottom: 16, color: '#ef9a9a', fontSize: 13, textAlign: 'center',
          }}>
            ⚠️ Đối thủ đã rời phòng
          </div>
        )}

        {/* In-room view */}
        {inRoom && roomState && (
          <div style={{ background: '#0d1b2a', border: '1px solid #1e4d78', borderRadius: 8, padding: '14px', marginBottom: 16 }}>
            {/* Room header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>MÃ PHÒNG (dùng để Join)</div>
                <div style={{
                  fontSize: 20, fontWeight: 800, letterSpacing: 3, color: '#e94560',
                  cursor: 'pointer', userSelect: 'all',
                }} title="Click để copy" onClick={() => { navigator.clipboard?.writeText(roomId); addLog('Đã copy mã phòng'); }}>
                  {roomCode || roomId}
                </div>
                <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>ID: {roomId}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>PHASE</div>
                <div style={{
                  fontSize: 16, fontWeight: 700, textTransform: 'uppercase',
                  color: roomState.phase === 'ready' ? '#4caf50' : roomState.phase === 'waiting' ? '#ff9800' : '#4fc3f7',
                }}>{roomState.phase}</div>
              </div>
            </div>

            {/* Players */}
            <div style={{ borderTop: '1px solid #1e3a5a', paddingTop: 12 }}>
              {[0, 1].map(i => {
                const p = players[i];
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', opacity: p ? 1 : 0.35 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? '#e94560' : '#4fc3f7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>P{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{p ? p.name : 'Đang chờ...'}</div>
                      {p && <div style={{ fontSize: 11, color: p.ready ? '#4caf50' : '#ff9800' }}>
                        {p.ready ? '✓ Sẵn sàng' : '○ Chưa sẵn sàng'}
                      </div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {roomState.phase === 'ready' && (
              <div style={{
                marginTop: 10, padding: '10px', background: '#1a3a2a', borderRadius: 6,
                textAlign: 'center', color: '#4caf50', fontWeight: 700, fontSize: 14,
              }}>✅ 2 người đã kết nối — Sẵn sàng!</div>
            )}

            <button onClick={handleLeave} style={{
              width: '100%', marginTop: 12, padding: '10px',
              background: 'transparent', border: '1px solid #e94560',
              color: '#e94560', borderRadius: 6, fontSize: 14, cursor: 'pointer',
            }}>🚪 Rời Phòng</button>
          </div>
        )}

        {/* Controls — when not in room */}
        {!inRoom && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
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
                  fontSize: 14, outline: 'none',
                }}
              />
              <button onClick={handleJoin} disabled={connecting || !inputCode.trim()} style={{
                padding: '12px 18px', background: inputCode.trim() && !connecting ? '#4fc3f7' : '#333',
                color: '#000', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700, cursor: !inputCode.trim() || connecting ? 'not-allowed' : 'pointer',
                opacity: !inputCode.trim() || connecting ? 0.5 : 1, whiteSpace: 'nowrap',
              }}>Join</button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 12, padding: '10px 14px', background: '#2a0d0d',
            border: '1px solid #c62828', borderRadius: 8, color: '#ef9a9a', fontSize: 13,
          }}>⚠️ {error}</div>
        )}

        {/* Log */}
        <div style={{ background: '#050510', border: '1px solid #1a1a2e', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Log</div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {log.length === 0
              ? <div style={{ fontSize: 12, color: '#333' }}>Chưa có activity...</div>
              : log.map((l, i) => (
                <div key={i} style={{
                  fontSize: 11, padding: '2px 0', borderBottom: '1px solid #0a0a1a',
                  color: l.includes('❌') ? '#ef5350' : '#8bc34a',
                }}>{l}</div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
