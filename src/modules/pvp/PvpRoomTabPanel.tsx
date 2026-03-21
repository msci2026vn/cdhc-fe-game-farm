import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RoomInfo, LiveRoomInfo } from './pvp-lobby.types';

const API_BASE = import.meta.env.VITE_API_URL || 'https://sta.cdhc.vn';

export function PvpRoomTabPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'waiting' | 'live'>('waiting');
  const [liveRooms, setLiveRooms] = useState<LiveRoomInfo[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [waitingRooms, setWaitingRooms] = useState<RoomInfo[]>([]);
  const [waitingLoading, setWaitingLoading] = useState(false);

  const fetchLiveRooms = useCallback(async () => {
    setLiveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/pvp/live`);
      if (res.ok) {
        const data = (await res.json()) as LiveRoomInfo[];
        setLiveRooms(Array.isArray(data) ? data : []);
      }
    } catch {
      // fail silently
    } finally {
      setLiveLoading(false);
    }
  }, []);

  const fetchWaitingRooms = useCallback(async () => {
    setWaitingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/pvp/rooms`, { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as { rooms?: RoomInfo[] };
        setWaitingRooms(data.rooms ?? []);
      }
    } catch {
      setWaitingRooms([]);
    } finally {
      setWaitingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'live') {
      void fetchLiveRooms();
      const interval = setInterval(() => { void fetchLiveRooms(); }, 5000);
      return () => clearInterval(interval);
    } else {
      void fetchWaitingRooms();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <>
      {/* Tab bar: Đang chờ / Đang live */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'center' }}>
        <button
          onClick={() => setActiveTab('waiting')}
          style={{
            width: 90, height: 32, flexShrink: 0,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            opacity: activeTab === 'waiting' ? 1 : 0.6,
            transition: 'opacity 0.2s, transform 0.1s',
          }}
          onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <img 
            src="/assets/pvp_1vs1_arena/btn_waiting.png" 
            alt="Đang chờ"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </button>
        <button
          onClick={() => setActiveTab('live')}
          style={{
            width: 90, height: 32, flexShrink: 0,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            opacity: activeTab === 'live' ? 1 : 0.6,
            transition: 'opacity 0.2s, transform 0.1s',
            position: 'relative',
          }}
          onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <img 
            src="/assets/pvp_1vs1_arena/btn_is_live.png" 
            alt="Đang live"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
          {liveRooms.length > 0 && (
            <div style={{
              position: 'absolute', top: '-4px', right: '-4px',
              background: '#E24B4A', color: '#fff',
              fontSize: '10px', fontWeight: 800,
              padding: '2px 6px', borderRadius: '10px',
              border: '1px solid #fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              fontFamily: "'Fredoka One', 'Nunito', sans-serif"
            }}>
              {liveRooms.length}
            </div>
          )}
        </button>
      </div>

      {/* Tab content: Đang chờ */}
      {activeTab === 'waiting' && (
        <div style={{ marginBottom: '8px' }}>
          {waitingLoading && waitingRooms.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.85)', fontSize: '12px', padding: '10px', fontWeight: 600 }}>
              Đang tải...
            </div>
          ) : waitingRooms.length === 0 ? (
            <div style={{
              textAlign: 'center', color: '#5c3a21', fontSize: '13px', padding: '10px',
              fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5,
              textShadow: '0 1px 1px rgba(255,255,255,0.4)',
            }}>
              Không có phòng nào đang chờ
            </div>
          ) : (
            waitingRooms.map(room => (
              <div key={room.roomId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: "url('/assets/pvp_1vs1_arena/frame_wood_7.png') no-repeat center center / 100% 100%",
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '8px',
                minHeight: '64px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: '#7c3aed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                  }}>
                    {(room.hostName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ 
                      color: '#FFFEA3', fontWeight: 900, fontSize: 14, 
                      fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5,
                      textShadow: '1px 1px 0 #1a0a00, -1px 1px 0 #1a0a00, 1px -1px 0 #1a0a00, -1px -1px 0 #1a0a00' 
                    }}>{room.hostName || 'Unknown'}</div>
                    <div style={{ 
                      color: '#fff', fontSize: 11, fontWeight: 500, marginTop: 2,
                      fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5,
                      textShadow: '1px 1px 0 #1a0a00, -1px 1px 0 #1a0a00, 1px -1px 0 #1a0a00, -1px -1px 0 #1a0a00' 
                    }}>#{room.roomCode} · {room.clients}/{room.maxClients}</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/pvp-test?roomId=${room.roomId}`)}
                  style={{
                    padding: 0, border: 'none', background: 'none',
                    cursor: 'pointer', flexShrink: 0,
                    transition: 'transform 0.1s',
                  }}
                  onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <img src="/assets/pvp_1vs1_arena/btn_enter.png" alt="Vào" style={{ width: 80, height: 32, objectFit: 'contain', display: 'block' }} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab content: Đang live */}
      {activeTab === 'live' && (
        <div style={{ marginBottom: '8px' }}>
          {liveLoading && liveRooms.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: '10px' }}>
              Đang tải...
            </div>
          ) : liveRooms.length === 0 ? (
            <div style={{
              textAlign: 'center', color: '#5c3a21', fontSize: '13px', padding: '10px',
              fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5,
              textShadow: '0 1px 1px rgba(255,255,255,0.4)',
            }}>
              Chưa có trận nào đang diễn ra
            </div>
          ) : (
            liveRooms.map(room => (
              <div key={room.roomId} style={{
                background: "url('/assets/pvp_1vs1_arena/frame_wood_7.png') no-repeat center center / 100% 100%",
                borderRadius: '12px',
                padding: '16px 16px',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ 
                    flex: 1, textAlign: 'right', fontSize: '14px', fontWeight: 900, color: '#FFFEA3',
                    fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5,
                    textShadow: '1px 1px 0 #1a0a00, -1px 1px 0 #1a0a00, 1px -1px 0 #1a0a00, -1px -1px 0 #1a0a00'
                  }}>
                    {room.player1Name}
                  </span>
                  <span style={{
                    fontSize: '11px', color: '#ff4c4c', fontWeight: 900,
                    padding: '2px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px',
                    fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5,
                    textShadow: '1px 1px 0 #1a0a00, -1px 1px 0 #1a0a00, 1px -1px 0 #1a0a00, -1px -1px 0 #1a0a00'
                  }}>VS</span>
                  <span style={{ 
                    flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 900, color: '#FFFEA3',
                    fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5,
                    textShadow: '1px 1px 0 #1a0a00, -1px 1px 0 #1a0a00, 1px -1px 0 #1a0a00, -1px -1px 0 #1a0a00'
                  }}>
                    {room.player2Name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ 
                    fontSize: '12px', color: '#fff', fontWeight: 500,
                    fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5,
                    textShadow: '1px 1px 0 #1a0a00, -1px 1px 0 #1a0a00, 1px -1px 0 #1a0a00, -1px -1px 0 #1a0a00' 
                  }}>
                    👁 {room.spectatorCount} đang xem
                  </span>
                  <button
                    onClick={() => navigate(`/pvp/game/${room.roomId}?mode=spectator&code=${room.roomCode}`)}
                    style={{
                      background: 'rgba(226,75,74,0.15)',
                      border: '0.5px solid rgba(226,75,74,0.3)',
                      borderRadius: '8px',
                      padding: '5px 14px',
                      color: '#E24B4A',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Xem trực tiếp →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
