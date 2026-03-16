import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RoomInfo } from './pvp-lobby.types';

const API_BASE = import.meta.env.VITE_API_URL || 'https://sta.cdhc.vn';

export function RoomListModal({
  onClose,
  onJoin,
}: {
  onClose: () => void;
  onJoin: (roomId: string, roomCode: string) => void;
}) {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation('pvp');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/pvp/rooms`, { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as { rooms?: RoomInfo[] };
        setRooms(data.rooms ?? []);
      }
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchRooms(); }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 250,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg,#1a1a2e,#0f1624)',
          border: '1px solid #1e4d78',
          borderRadius: '16px 16px 0 0',
          width: '100%', maxWidth: 480,
          maxHeight: '75vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid #1e3a5a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>📋 {t('room.waiting')}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: 40, fontSize: 14 }}>{t('common.loading')}</div>
          ) : rooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏜️</div>
              <div style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{t('room.noRooms')}</div>
              <button
                onClick={() => { onClose(); navigate('/pvp-test'); }}
                style={{
                  padding: '10px 28px', borderRadius: 10, border: 'none',
                  background: '#b45309', color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {t('room.createNew')}
              </button>
            </div>
          ) : (
            rooms.map(room => (
              <div
                key={room.roomId}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 20px', borderBottom: '1px solid #0f1e30',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: '#7c3aed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#fff',
                  }}>
                    {(room.hostName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{room.hostName || 'Unknown'}</div>
                    <div style={{ color: '#64748b', fontSize: 11 }}>
                      #{room.roomCode} · {t('room.players', { current: room.clients, max: room.maxClients })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onJoin(room.roomId, room.roomCode)}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: '#22c55e', color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {t('room.join')} ▶
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer refresh */}
        <button
          onClick={fetchRooms}
          style={{
            padding: '12px', background: 'none', border: 'none',
            color: '#64748b', fontSize: 13, cursor: 'pointer',
            borderTop: '1px solid #0f1e30', flexShrink: 0,
          }}
        >
          {t('room.refresh')}
        </button>
      </div>
    </div>
  );
}
