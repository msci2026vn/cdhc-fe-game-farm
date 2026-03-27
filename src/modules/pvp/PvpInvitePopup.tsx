import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { PvpEvent } from '@/shared/api/api-pvp';

export function InvitePopup({
  invite,
  onAccept,
  onReject,
}: {
  invite: PvpEvent & { type: 'pvp_invite' };
  onAccept: () => void;
  onReject: () => void;
}) {
  const { t } = useTranslation('pvp');
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(invite.expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (secondsLeft <= 0) { onReject(); return; }
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(t); onReject(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
        border: '2px solid #e94560',
        borderRadius: 16, padding: 24, maxWidth: 320, width: '90%',
        textAlign: 'center', color: '#fff',
        boxShadow: '0 0 40px rgba(233,69,96,0.3)',
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>⚔️</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          {t('invite.title')}
        </div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>
            {invite.fromName || t('invite.someone')}
          </span>{' '}
          {t('invite.from')}
        </div>

        {/* Countdown ring */}
        <div style={{
          fontSize: 28, fontWeight: 900,
          color: secondsLeft <= 10 ? '#ef4444' : '#22c55e',
          marginBottom: 20,
        }}>
          {secondsLeft}s
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onAccept}
            style={{
              flex: 1, padding: '12px', borderRadius: 8, border: 'none',
              background: '#22c55e', color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('invite.accept')}
          </button>
          <button
            onClick={onReject}
            style={{
              flex: 1, padding: '12px', borderRadius: 8,
              border: '1px solid #ef4444', background: 'transparent',
              color: '#ef4444', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t('invite.reject')}
          </button>
        </div>
      </div>
    </div>
  );
}
