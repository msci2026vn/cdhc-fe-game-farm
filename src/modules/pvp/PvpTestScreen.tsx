import { useState, useRef } from 'react';
import * as Colyseus from '@colyseus/sdk';

const WS_URL = import.meta.env.VITE_PVP_WS_URL || 'wss://sta.cdhc.vn/pvp-ws';

interface PlayerInfo {
  id: string;
  name: string;
  ready: boolean;
}

interface RoomState {
  phase: string;
  roomCode: string;
  players: Record<string, PlayerInfo>;
}

export default function PvpTestScreen() {
  const clientRef = useRef<Colyseus.Client | null>(null);
  const [room, setRoom] = useState<Colyseus.Room | null>(null);
  const [roomId, setRoomId] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [state, setState] = useState<RoomState>({ phase: 'disconnected', roomCode: '', players: {} });
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState('');

  const addLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));

  const getClient = () => {
    if (!clientRef.current) {
      clientRef.current = new Colyseus.Client(WS_URL);
    }
    return clientRef.current;
  };

  const getToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Chưa đăng nhập — không có access_token trong localStorage');
    return token;
  };

  const applyState = (s: any) => {
    const players: Record<string, PlayerInfo> = {};
    if (s.players) {
      s.players.forEach((v: PlayerInfo, k: string) => {
        players[k] = { id: v.id, name: v.name, ready: v.ready };
      });
    }
    setState({ phase: s.phase ?? '?', roomCode: s.roomCode ?? '', players });
  };

  const createRoom = async () => {
    setError('');
    try {
      const token = getToken();
      const r = await getClient().create('pvp_room', {}, { token });
      r.onStateChange(applyState);
      r.onLeave((code) => {
        addLog(`Rời phòng (code: ${code})`);
        setRoom(null);
        setState({ phase: 'disconnected', roomCode: '', players: {} });
      });
      r.onError((code, msg) => {
        addLog(`Lỗi: ${code} - ${msg}`);
        setError(`${code}: ${msg}`);
      });
      setRoom(r);
      setRoomId(r.roomId);
      addLog(`Đã tạo phòng: ${r.roomId}`);
    } catch (e: any) {
      setError(e.message || String(e));
      addLog(`Lỗi tạo phòng: ${e.message}`);
    }
  };

  const joinRoom = async () => {
    setError('');
    const code = inputCode.trim().toUpperCase();
    if (!code) return;
    try {
      const token = getToken();
      const r = await getClient().joinById(code, {}, { token });
      r.onStateChange(applyState);
      r.onLeave((code) => {
        addLog(`Rời phòng (code: ${code})`);
        setRoom(null);
        setState({ phase: 'disconnected', roomCode: '', players: {} });
      });
      r.onError((code, msg) => {
        addLog(`Lỗi: ${code} - ${msg}`);
        setError(`${code}: ${msg}`);
      });
      setRoom(r);
      setRoomId(code);
      addLog(`Đã join phòng: ${code}`);
    } catch (e: any) {
      setError(e.message || String(e));
      addLog(`Lỗi join: ${e.message}`);
    }
  };

  const leaveRoom = () => {
    room?.leave();
    setRoom(null);
    setState({ phase: 'disconnected', roomCode: '', players: {} });
    setRoomId('');
    addLog('Đã rời phòng');
  };

  const playerCount = Object.keys(state.players).length;

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 16 }}>🎮 PVP Test — Colyseus</h2>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>Server: {WS_URL}</p>

      {!room ? (
        <div>
          <button
            onClick={createRoom}
            style={{ padding: '10px 20px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginBottom: 12, width: '100%' }}
          >
            🏠 Tạo Phòng Mới
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinRoom()}
              placeholder="Nhập mã phòng (4 ký tự)"
              maxLength={6}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #ccc', borderRadius: 6, fontFamily: 'monospace', fontSize: 16, letterSpacing: 2 }}
            />
            <button
              onClick={joinRoom}
              style={{ padding: '10px 16px', background: '#2196f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              🚪 Join
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', letterSpacing: 4, textAlign: 'center', marginBottom: 8 }}>
              {roomId}
            </div>
            <div style={{ textAlign: 'center', color: '#666', marginBottom: 8 }}>
              Phase: <b style={{ color: state.phase === 'ready' ? '#4caf50' : '#ff9800' }}>{state.phase}</b>
            </div>
            <div style={{ textAlign: 'center', color: '#888' }}>
              👥 {playerCount}/2 người chơi
            </div>
          </div>

          {playerCount > 0 && (
            <div style={{ marginBottom: 12 }}>
              {Object.entries(state.players).map(([sid, p]) => (
                <div key={sid} style={{ padding: '8px 12px', background: '#e8f5e9', borderRadius: 6, marginBottom: 4 }}>
                  👤 <b>{p.name || p.id}</b> <span style={{ color: '#888', fontSize: 12 }}>({sid.slice(0, 8)}...)</span>
                </div>
              ))}
            </div>
          )}

          {state.phase === 'ready' && (
            <div style={{ padding: 12, background: '#e8f5e9', borderRadius: 8, textAlign: 'center', marginBottom: 12, color: '#2e7d32', fontWeight: 'bold' }}>
              ✅ 2 người đã kết nối — Sẵn sàng!
            </div>
          )}

          <button
            onClick={leaveRoom}
            style={{ width: '100%', padding: '10px 20px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            ❌ Rời Phòng
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, padding: 10, background: '#ffebee', borderRadius: 6, color: '#c62828', fontSize: 12 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Log:</div>
        <div style={{ background: '#1e1e1e', color: '#00e676', padding: 10, borderRadius: 6, fontSize: 11, maxHeight: 200, overflowY: 'auto' }}>
          {log.length === 0 ? <span style={{ color: '#555' }}>Chưa có sự kiện</span> : log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}
