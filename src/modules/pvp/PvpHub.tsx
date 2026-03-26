import { useEffect } from 'react';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pvpApi } from '@/shared/api/api-pvp';
import { PvpBotDifficultyPicker } from './PvpBotDifficultyPicker';
import { PvpRatingCard } from './PvpRatingCard';
import { InviteNotification } from '@/modules/pvp-team/InviteNotification';
import { pvpPresence } from '@/modules/pvp-team/api-pvp-team';

export default function PvpHub() {
  const navigate = useNavigate();
  const [showBotPicker, setShowBotPicker] = useState(false);
  const [botLoading, setBotLoading] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const handlePlayBot = async (tier: string) => {
    setBotLoading(true);
    setShowBotPicker(false);
    try {
      const data = await pvpApi.playBot(tier);
      if (data.ok && data.roomId) {
        navigate(`/pvp-test?roomId=${data.roomId}`);
      } else {
        showToast(`❌ ${data.error || 'Failed'}`);
      }
    } catch (e) {
      showToast(`❌ ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setBotLoading(false);
    }
  };

  // Track PvP presence for invite system
  useEffect(() => {
    pvpPresence('join').catch(() => { });
    return () => { pvpPresence('leave').catch(() => { }); };
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      overflowY: 'auto',
      background: "url('/assets/pvp/bg_pvp.png') no-repeat center top / 100% 100%",
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: '40px 16px 80px',
    }}>
      <div style={{ maxWidth: 320, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: 60,
          minHeight: 32,
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              position: 'absolute',
              left: 0,
              top: 58,
              background: "url('/assets/pvp_1vs1_arena/btn_back.png') no-repeat center center / contain",
              border: 'none',
              width: 86,
              height: 38,
              cursor: 'pointer',
              color: 'transparent',
              padding: 0,
              transition: 'transform 0.1s',
            }}
            onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
            onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Back
          </button>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 900,
            color: '#FFFEA3',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontFamily: "'Fredoka One', 'Nunito', sans-serif",
            textShadow: '2px 2px 0 #1a0a00, -2px 2px 0 #1a0a00, 2px -2px 0 #1a0a00, -2px -2px 0 #1a0a00, 3px 0 0 #1a0a00, -3px 0 0 #1a0a00, 0 3px 0 #1a0a00, 0 -3px 0 #1a0a00',
          }}>
            PVP Arena
          </h1>

        </div>

        {/* Rank card — reuse from 1v1 */}
        <PvpRatingCard />

        {/* Mode label */}
        <div style={{
          textAlign: 'center',
          margin: '-22px 0 10px',
        }}>
          <span style={{
            fontSize: 24,
            fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5,
            fontWeight: 900,
            color: '#FFFEA3',
            textTransform: 'uppercase',
            WebkitTextStroke: '1px #3b1e0a',
            textShadow: `
              1px 1px 0 #3b1e0a,
              -1px -1px 0 #3b1e0a,
              1px -1px 0 #3b1e0a,
              -1px 1px 0 #3b1e0a,
              0 2px 4px rgba(0,0,0,0.6)
            `,
          }}>
            Chọn chế độ đấu
          </span>
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
              padding: '10px 24px',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              background: "url('/assets/pvp/wooden_frame_3.png') no-repeat center center / 100% 100%",
              transition: 'transform 0.15s, opacity 0.15s',
              position: 'relative',
              minHeight: 100,
            }}
            onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <img
              src="/assets/pvp/pvp_1vs1.png"
              alt="1v1-icon"
              style={{ width: 64, height: 64, objectFit: 'contain', flexShrink: 0 }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 19, fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)', fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5 }}>
                1 vs 1
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                Dau solo — Leo rank canh gioi
              </span>
            </div>
          </button>

          {/* 3v3 Team Battle */}
          <button
            onClick={() => navigate('/pvp-team')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '10px 24px',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              background: "url('/assets/pvp/wooden_frame_3.png') no-repeat center center / 100% 100%",
              transition: 'transform 0.15s, opacity 0.15s',
              position: 'relative',
              minHeight: 100,
            }}
            onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <img
              src="/assets/pvp/pvp_3vs3.png"
              alt="3v3-icon"
              style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 19, fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)', fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5 }}>
                3 vs 3
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                Team Battle — HP pool chung
              </span>
            </div>
          </button>

        </div>

      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 25,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 420,
        height: 90,
        background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.6))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 20px 10px',
        zIndex: 100,
      }}>
        {[
          { icon: 'btn_home.png', label: 'Home', path: '/' },
          { icon: 'btn_pvp.png', label: 'Bot' },
          { icon: 'btn_friend.png', label: 'Friends', path: '/friends' },
          { icon: 'btn_build.png', label: 'Build', path: '/pvp/build' }
        ].map((btn, index) => (
          <button
            key={index}
            onClick={() => {
              if (btn.label === 'Bot') {
                setShowBotPicker(true);
              } else {
                navigate(btn.path || '/');
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              gap: 2,
              transition: 'transform 0.15s',
            }}
            onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
            onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <img
              src={`/assets/pvp/${btn.icon}`}
              alt={btn.label}
              style={{ width: 36, height: 36, objectFit: 'contain' }}
            />
            <span style={{
              fontSize: 11,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              color: '#FFFEA3',
              textShadow: '1px 1.5px 0 #3b1e0a, -1px -1.5px 0 #3b1e0a, 1px -1.5px 0 #3b1e0a, -1px 1.5px 0 #3b1e0a',
            }}>
              {btn.label}
            </span>
          </button>
        ))}
      </div>

      {/* Bot Difficulty Picker */}
      {showBotPicker && (
        <PvpBotDifficultyPicker
          onClose={() => setShowBotPicker(false)}
          onSelect={handlePlayBot}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#1e3a5a', border: '1px solid #3b82f6',
          borderRadius: 10, padding: '10px 20px',
          color: '#e2e8f0', fontSize: 14, fontWeight: 600,
          zIndex: 400, whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
