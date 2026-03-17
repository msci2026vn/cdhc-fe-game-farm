import { useState, useEffect } from 'react';
import { getOnlineUsers, sendInvite } from './api-pvp-team';

interface InvitePanelProps {
  roomCode: string;
  onClose: () => void;
}

export function InvitePanel({ roomCode, onClose }: InvitePanelProps) {
  const [users, setUsers] = useState<{ id: string; username: string; avatar: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await getOnlineUsers();
        if (!cancelled) setUsers(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleInvite = async (userId: string) => {
    await sendInvite(userId, roomCode);
    setInvitedIds(prev => new Set([...prev, userId]));
  };

  return (
    <div style={{
      background: 'rgba(15,15,30,0.95)',
      border: '1px solid rgba(124,58,237,0.4)',
      borderRadius: 14,
      padding: '14px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>👥 Mời vào phòng</span>
          <span style={{
            background: 'rgba(124,58,237,0.25)',
            border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 11,
            color: '#c4b5fd',
          }}>
            #{roomCode}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#94a3b8',
            fontSize: 18, cursor: 'pointer', padding: '0 4px',
          }}
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 12 }}>
          Đang tải...
        </div>
      ) : users.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 12 }}>
          Không có ai đang online ở PvP Arena
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
          {users.map(u => (
            <div
              key={u.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              <img
                src={u.avatar || '/default-avatar.png'}
                alt=""
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{u.username}</span>
              <button
                onClick={() => void handleInvite(u.id)}
                disabled={invitedIds.has(u.id)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: invitedIds.has(u.id) ? 'default' : 'pointer',
                  background: invitedIds.has(u.id) ? 'rgba(34,197,94,0.15)' : 'rgba(124,58,237,0.2)',
                  border: `1px solid ${invitedIds.has(u.id) ? 'rgba(34,197,94,0.3)' : 'rgba(124,58,237,0.4)'}`,
                  color: invitedIds.has(u.id) ? '#86efac' : '#c4b5fd',
                }}
              >
                {invitedIds.has(u.id) ? '✅ Đã mời' : 'Mời'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
