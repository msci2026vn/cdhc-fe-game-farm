import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function ChallengePopup({
  data,
  pending,
  onAccept,
  onDecline,
  onTimeout,
}: {
  data: { hostName: string; hostRating: number; timeoutMs: number };
  pending: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onTimeout: () => void;
}) {
  const { t } = useTranslation('pvp');
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil(data.timeoutMs / 1000));

  useEffect(() => {
    if (secondsLeft <= 0) { onTimeout(); return; }
    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timer); onTimeout(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
        border: '2px solid #3b82f6',
        borderRadius: 16, padding: 28, maxWidth: 340, width: '100%',
        textAlign: 'center', color: '#fff',
        boxShadow: '0 0 60px rgba(59,130,246,0.3)',
        animation: 'challengeSlideIn 0.3s ease-out',
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⚔️</div>
        <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
          {t('challenge.title')}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{data.hostName}</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
          Rating: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{data.hostRating}</span> · {t('challenge.from')}
        </div>

        {/* Countdown */}
        <div style={{
          fontSize: 28, fontWeight: 900,
          color: secondsLeft <= 10 ? '#ef4444' : '#3b82f6',
          marginBottom: 20,
          transition: 'color 0.3s',
        }}>
          {secondsLeft}s
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onDecline}
            disabled={pending}
            style={{
              flex: 1, padding: '12px', borderRadius: 10,
              border: '1px solid #64748b', background: 'transparent',
              color: '#94a3b8', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t('challenge.decline')}
          </button>
          <button
            onClick={onAccept}
            disabled={pending}
            style={{
              flex: 1, padding: '12px', borderRadius: 10,
              border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: pending ? 'not-allowed' : 'pointer',
              opacity: pending ? 0.7 : 1,
            }}
          >
            {t('challenge.accept')}
          </button>
        </div>
      </div>
      <style>{`@keyframes challengeSlideIn { from { transform: translateY(20px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }`}</style>
    </div>
  );
}
