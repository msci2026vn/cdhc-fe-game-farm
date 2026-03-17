import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkInvite } from './api-pvp-team';

export function InviteNotification() {
  const navigate = useNavigate();
  const [invite, setInvite] = useState<{
    from: { id: string; username: string; avatar: string };
    roomCode: string;
    expiresAt: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const inv = await checkInvite();
        if (!cancelled && inv) setInvite(inv);
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 5_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (!invite) return null;

  const handleAccept = () => {
    navigate(`/pvp-team?join=${invite.roomCode}`);
    setInvite(null);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 90,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: 380,
      background: 'rgba(15,15,30,0.95)',
      border: '1px solid rgba(124,58,237,0.5)',
      borderRadius: 14,
      padding: '14px 16px',
      zIndex: 500,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <img
          src={invite.from.avatar || '/default-avatar.png'}
          alt=""
          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
            {invite.from.username}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            mời bạn vào trận 3v3!
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleAccept}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 10,
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
            border: 'none',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Vào Phòng →
        </button>
        <button
          onClick={() => setInvite(null)}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Từ chối
        </button>
      </div>
    </div>
  );
}
