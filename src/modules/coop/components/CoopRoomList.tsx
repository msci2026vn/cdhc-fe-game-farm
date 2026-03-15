// ═══════════════════════════════════════════════════════════════
// CoopRoomList — Browse & join waiting co-op rooms
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import type { CoopRoomSummary } from '@/modules/coop/api/api-coop';
import { coopApi } from '@/modules/coop/api/api-coop';

interface Props {
  onJoin:  (roomId: string) => void;
  onClose: () => void;
}

export function CoopRoomList({ onJoin, onClose }: Props) {
  const [rooms, setRooms]     = useState<CoopRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { rooms: data } = await coopApi.getRooms();
      setRooms(data);
    } catch {
      setError('Không thể tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const handleJoin = async (room: CoopRoomSummary) => {
    setJoiningId(room.roomId);
    try {
      const info = await coopApi.getRoom(room.roomId);
      if (!info || info.phase !== 'waiting') {
        setError('Phòng đã bắt đầu hoặc đã đóng');
        setJoiningId(null);
        fetchRooms();
        return;
      }
      onJoin(room.roomId);
    } catch {
      setError('Không thể vào phòng');
      setJoiningId(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1f2937', borderRadius: 16, padding: 20,
          width: '100%', maxWidth: 380, maxHeight: '75vh',
          display: 'flex', flexDirection: 'column', color: 'white',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            👥 Phòng Đang Chờ
          </h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={fetchRooms}
              disabled={loading}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#9ca3af',
                borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
              }}
            >
              {loading ? '...' : '🔄'}
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Room list */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
              Đang tải...
            </div>
          ) : rooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏚️</div>
              <div style={{ fontSize: 14 }}>Chưa có phòng nào</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Hãy tạo phòng mới!</div>
            </div>
          ) : (
            rooms.map(room => (
              <div
                key={room.roomId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
                  borderRadius: 10, marginBottom: 8,
                  border: '1px solid #374151',
                }}
              >
                {/* Host info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {room.hostName}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {room.teamSize}/{room.maxSize} người
                    {room.multiplier > 1 && (
                      <span style={{ color: '#f59e0b', marginLeft: 6 }}>×{room.multiplier.toFixed(1)}</span>
                    )}
                  </div>
                </div>
                {/* Join button */}
                <button
                  onClick={() => handleJoin(room)}
                  disabled={joiningId === room.roomId}
                  style={{
                    padding: '6px 16px', background: '#1d4ed8', color: 'white',
                    fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 8,
                    cursor: joiningId === room.roomId ? 'not-allowed' : 'pointer',
                    opacity: joiningId === room.roomId ? 0.6 : 1,
                    flexShrink: 0,
                  }}
                >
                  {joiningId === room.roomId ? '...' : 'Vào'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
