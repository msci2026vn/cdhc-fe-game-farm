// ═══════════════════════════════════════════════════════════════
// CoopWaitingRoom — Lobby chờ đủ người trước khi bắt đầu
// Hiển thị roomCode, danh sách slot, nút mời bạn, nút bắt đầu
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { CoopPlayer } from '@/modules/coop/types/coop.types';
import { coopApi } from '@/modules/coop/api/api-coop';
import { useUIStore } from '@/shared/stores/uiStore';

interface Props {
  roomCode:   string;
  players:    CoopPlayer[];
  teamSize:   number;
  multiplier: number;
  isHost:     boolean;
  lobbyTimeLeft: number;
  onStart:    () => void;
  onLeave:    () => void;
}

export function CoopWaitingRoom({
  roomCode, players, teamSize, multiplier, isHost, lobbyTimeLeft, onStart, onLeave,
}: Props) {
  const addToast = useUIStore(s => s.addToast);
  const [inviting, setInviting] = useState(false);
  const [copied,   setCopied]   = useState(false);

  // Số slot tối đa = 4 (hoặc teamSize tối đa của event)
  const MAX_SLOTS = 4;
  const emptySlots = Math.max(0, MAX_SLOTS - players.length);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareZalo = () => {
    const url = `https://sta.cdhc.vn/coop?room=${roomCode}`;
    const zaloUrl = `https://zalo.me/share/url?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`Cùng đánh Boss co-op! Mã phòng: ${roomCode}`)}`;
    window.open(zaloUrl, '_blank');
  };

  // Mời bạn qua friend picker — simplified: nhập userId
  // (Trong sản phẩm thực: dùng FriendPickerModal tương tự PvpLobby)
  const handleInviteFriend = async () => {
    const toUserId = prompt('Nhập userId của bạn để mời:');
    if (!toUserId) return;

    setInviting(true);
    try {
      await coopApi.inviteToRoom(toUserId, roomCode);
      addToast('Đã gửi lời mời!', 'success');
    } catch (err) {
      addToast('Không thể gửi lời mời', 'error');
    } finally {
      setInviting(false);
    }
  };

  // Lobby countdown
  const lobbyMinutes = Math.floor(lobbyTimeLeft / 60);
  const lobbySeconds = lobbyTimeLeft % 60;

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     '#111827',
      color:          'white',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        24,
      zIndex:         20,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚔️</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Co-op Boss</h2>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          Phòng tự đóng sau {lobbyMinutes}:{String(lobbySeconds).padStart(2, '0')}
        </div>
      </div>

      {/* Room Code */}
      <div style={{
        background:   'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding:      '16px 32px',
        marginBottom: 20,
        textAlign:    'center',
      }}>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Mã phòng</div>
        <div style={{
          fontSize:    36,
          fontWeight:  900,
          letterSpacing: 6,
          color:       '#f59e0b',
          fontFamily:  'monospace',
        }}>
          {roomCode || '----'}
        </div>
      </div>

      {/* Share buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={handleShareZalo}
          style={{
            padding:      '8px 16px',
            background:   '#0068FF',
            color:        'white',
            fontWeight:   700,
            fontSize:     13,
            border:       'none',
            borderRadius: 8,
            cursor:       'pointer',
          }}
        >
          Share Zalo
        </button>
        <button
          onClick={handleCopyCode}
          style={{
            padding:      '8px 16px',
            background:   copied ? '#22c55e' : 'rgba(255,255,255,0.1)',
            color:        'white',
            fontWeight:   700,
            fontSize:     13,
            border:       '1px solid #374151',
            borderRadius: 8,
            cursor:       'pointer',
            transition:   'background 200ms',
          }}
        >
          {copied ? 'Đã chép ✓' : 'Copy'}
        </button>
      </div>

      {/* Player slots */}
      <div style={{
        width:        '100%',
        maxWidth:     320,
        marginBottom: 16,
      }}>
        {players.map(p => (
          <div
            key={p.userId}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          10,
              padding:      '10px 14px',
              background:   'rgba(255,255,255,0.06)',
              borderRadius: 10,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>🧑</span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{p.name}</span>
            {p.isHost && (
              <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>HOST</span>
            )}
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          10,
              padding:      '10px 14px',
              background:   'rgba(255,255,255,0.03)',
              borderRadius: 10,
              marginBottom: 8,
              border:       '1px dashed #374151',
            }}
          >
            <span style={{ fontSize: 18, opacity: 0.3 }}>👤</span>
            <span style={{ color: '#4b5563', fontSize: 14 }}>Đang chờ...</span>
          </div>
        ))}
      </div>

      {/* Multiplier badge */}
      <div style={{
        marginBottom: 20,
        padding:      '8px 16px',
        background:   'rgba(245,158,11,0.1)',
        borderRadius: 12,
        border:       '1px solid rgba(245,158,11,0.3)',
        textAlign:    'center',
        fontSize:     13,
      }}>
        {teamSize < 2
          ? <span style={{ color: '#9ca3af' }}>×{multiplier.toFixed(1)} nếu đủ 2 người</span>
          : <span style={{ color: '#f59e0b', fontWeight: 700 }}>×{multiplier.toFixed(1)} 🔥 Team bonus active!</span>
        }
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        {/* Nút Mời Bạn */}
        <button
          onClick={handleInviteFriend}
          disabled={inviting}
          style={{
            padding:      '12px 0',
            background:   '#1d4ed8',
            color:        'white',
            fontWeight:   700,
            fontSize:     15,
            border:       'none',
            borderRadius: 10,
            cursor:       inviting ? 'not-allowed' : 'pointer',
            opacity:      inviting ? 0.7 : 1,
          }}
        >
          {inviting ? 'Đang mời...' : '🤝 Mời Bạn'}
        </button>

        {/* Nút Bắt Đầu — chỉ host thấy, disabled khi chưa đủ 2 người */}
        {isHost && (
          <button
            onClick={onStart}
            disabled={teamSize < 2}
            title={teamSize < 2 ? 'Cần ít nhất 2 người để có team bonus' : ''}
            style={{
              padding:      '14px 0',
              background:   teamSize < 2 ? '#374151' : '#f59e0b',
              color:        teamSize < 2 ? '#6b7280' : '#111',
              fontWeight:   700,
              fontSize:     16,
              border:       'none',
              borderRadius: 10,
              cursor:       teamSize < 2 ? 'not-allowed' : 'pointer',
            }}
          >
            {teamSize < 2 ? 'Chờ thêm người...' : 'Bắt Đầu ▶'}
          </button>
        )}

        {/* Nút Rời Phòng */}
        <button
          onClick={onLeave}
          style={{
            padding:      '10px 0',
            background:   'transparent',
            color:        '#6b7280',
            fontWeight:   600,
            fontSize:     14,
            border:       '1px solid #374151',
            borderRadius: 10,
            cursor:       'pointer',
          }}
        >
          Rời Phòng
        </button>
      </div>
    </div>
  );
}
