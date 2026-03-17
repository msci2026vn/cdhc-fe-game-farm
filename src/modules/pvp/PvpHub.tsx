import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PvpRatingCard } from './PvpRatingCard';
import { InviteNotification } from '@/modules/pvp-team/InviteNotification';
import { pvpPresence } from '@/modules/pvp-team/api-pvp-team';

export default function PvpHub() {
  const navigate = useNavigate();

  // Track PvP presence for invite system
  useEffect(() => {
    pvpPresence('join').catch(() => {});
    return () => { pvpPresence('leave').catch(() => {}); };
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0f3460 100%)',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: '16px 16px 80px',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: 4 }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#e94560' }}>
            PVP Arena
          </h1>
          <button
            onClick={() => navigate('/pvp/history?tab=leaderboard')}
            style={{
              marginLeft: 'auto',
              background: 'rgba(255,255,255,0.08)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#FAC775',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
            }}
          >
            BXH
          </button>
        </div>

        {/* Rank card — reuse from 1v1 */}
        <PvpRatingCard />

        {/* Mode label */}
        <div style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.45)',
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginBottom: 14,
          fontWeight: 600,
        }}>
          Chon che do dau
        </div>

        {/* Mode buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* 1v1 Arena */}
          <button
            onClick={() => navigate('/pvp/arena')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '20px',
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              background: 'linear-gradient(135deg,#b45309,#d97706)',
              transition: 'transform 0.15s, opacity 0.15s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span style={{ fontSize: 32, width: 48, textAlign: 'center', flexShrink: 0 }}>
              &#x2694;&#xFE0F;
            </span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>
                1 vs 1
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                Dau solo — Leo rank canh gioi
              </span>
            </div>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>→</span>
          </button>

          {/* 3v3 Team Battle */}
          <button
            onClick={() => navigate('/pvp-team')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '20px',
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              transition: 'transform 0.15s, opacity 0.15s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span style={{ fontSize: 32, width: 48, textAlign: 'center', flexShrink: 0 }}>
              &#x1F6E1;&#xFE0F;
            </span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>
                3 vs 3
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                Team Battle — HP pool chung
              </span>
            </div>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>→</span>
          </button>

        </div>

      </div>

      {/* Invite notification popup */}
      <InviteNotification />
    </div>
  );
}
