// ═══════════════════════════════════════════════════════════════
// CoopInvitePopup — Popup lời mời vào Co-op Boss
// Pattern: fork từ InvitePopup trong PvpLobby.tsx — KHÔNG sửa gốc
// Auto-dismiss sau 30s (invite hết hạn ở BE sau 30s)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import type { CoopInvitePayload } from '@/modules/coop/types/coop.types';

interface Props {
  payload:   CoopInvitePayload;
  onAccept:  () => void;
  onDecline: () => void;
}

// Thời gian tồn tại của lời mời = 30s (khớp với BE invite TTL)
const INVITE_TTL_SECONDS = 30;

export function CoopInvitePopup({ payload, onAccept, onDecline }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(INVITE_TTL_SECONDS);

  // Countdown + auto-dismiss khi hết giờ
  useEffect(() => {
    if (secondsLeft <= 0) { onDecline(); return; }

    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timer); onDecline(); return 0; }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bossHpDisplay = Math.round(payload.bossHpPercent * 100);

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      zIndex:         300,
      background:     'rgba(0,0,0,0.75)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background:   'linear-gradient(135deg,#1a1a2e,#16213e)',
        border:       '2px solid #f59e0b',
        borderRadius: 16,
        padding:      24,
        maxWidth:     320,
        width:        '90%',
        textAlign:    'center',
        color:        '#fff',
        boxShadow:    '0 0 40px rgba(245,158,11,0.3)',
      }}>
        {/* Icon */}
        <div style={{ fontSize: 36, marginBottom: 8 }}>⚔️</div>

        {/* Tiêu đề */}
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          Co-op Boss!
        </div>

        {/* Người mời */}
        <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>
            {payload.fromUserName}
          </span>{' '}
          mời bạn tham chiến
        </div>

        {/* Thông tin boss */}
        <div style={{
          background:   'rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding:      '8px 12px',
          marginBottom: 12,
          textAlign:    'left',
          fontSize:     13,
        }}>
          <div style={{ marginBottom: 4 }}>
            👹 <span style={{ color: '#fbbf24' }}>{payload.bossName}</span>
          </div>
          <div style={{ color: '#9ca3af', marginBottom: 4 }}>
            Boss còn: <span style={{ color: '#ef4444', fontWeight: 700 }}>{bossHpDisplay}%</span>
          </div>
          <div style={{ color: '#9ca3af' }}>
            Team bonus:{' '}
            <span style={{ color: '#34d399', fontWeight: 700 }}>
              ×{payload.teamBonus.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Countdown */}
        <div style={{
          fontSize:     28,
          fontWeight:   900,
          color:        secondsLeft <= 10 ? '#ef4444' : '#22c55e',
          marginBottom: 16,
        }}>
          {secondsLeft}s
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onAccept}
            style={{
              flex:         1,
              padding:      '10px 0',
              background:   '#f59e0b',
              color:        '#111',
              fontWeight:   700,
              fontSize:     14,
              border:       'none',
              borderRadius: 8,
              cursor:       'pointer',
            }}
          >
            Vào Ngay!
          </button>
          <button
            onClick={onDecline}
            style={{
              flex:         1,
              padding:      '10px 0',
              background:   'rgba(255,255,255,0.1)',
              color:        '#9ca3af',
              fontWeight:   600,
              fontSize:     14,
              border:       '1px solid #374151',
              borderRadius: 8,
              cursor:       'pointer',
            }}
          >
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );
}
