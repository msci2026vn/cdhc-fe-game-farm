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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('waiting')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'waiting'
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(255,255,255,0.04)',
            color: activeTab === 'waiting' ? '#fff' : 'rgba(255,255,255,0.4)',
            fontSize: '13px',
            fontWeight: activeTab === 'waiting' ? 500 : 400,
            cursor: 'pointer',
          }}
        >
          Đang chờ
        </button>
        <button
          onClick={() => setActiveTab('live')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'live'
              ? 'rgba(226,75,74,0.2)'
              : 'rgba(255,255,255,0.04)',
            color: activeTab === 'live' ? '#E24B4A' : 'rgba(255,255,255,0.4)',
            fontSize: '13px',
            fontWeight: activeTab === 'live' ? 500 : 400,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
          }}
        >
          {liveRooms.length > 0 && (
            <span style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: '#E24B4A',
              display: 'inline-block',
            }} />
          )}
          Đang live {liveRooms.length > 0 && `(${liveRooms.length})`}
        </button>
      </div>

      {/* Tab content: Đang chờ */}
      {activeTab === 'waiting' && (
        <div style={{ marginBottom: '16px' }}>
          {waitingLoading && waitingRooms.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '20px' }}>
              Đang tải...
            </div>
          ) : waitingRooms.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '20px' }}>
              Không có phòng nào đang chờ
            </div>
          ) : (
            waitingRooms.map(room => (
              <div key={room.roomId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '8px',
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
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{room.hostName || 'Unknown'}</div>
                    <div style={{ color: '#64748b', fontSize: 11 }}>#{room.roomCode} · {room.clients}/{room.maxClients}</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/pvp-test?roomId=${room.roomId}`)}
                  style={{
                    padding: '6px 16px', borderRadius: 8, border: 'none',
                    background: '#22c55e', color: '#fff',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  Vào ▶
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab content: Đang live */}
      {activeTab === 'live' && (
        <div style={{ marginBottom: '16px' }}>
          {liveLoading && liveRooms.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '20px' }}>
              Đang tải...
            </div>
          ) : liveRooms.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '20px' }}>
              Chưa có trận nào đang diễn ra
            </div>
          ) : (
            liveRooms.map(room => (
              <div key={room.roomId} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ flex: 1, textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#fff' }}>
                    {room.player1Name}
                  </span>
                  <span style={{
                    fontSize: '11px', color: 'rgba(255,255,255,0.4)',
                    padding: '2px 8px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '6px',
                  }}>VS</span>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#fff' }}>
                    {room.player2Name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
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
