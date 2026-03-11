// ═══════════════════════════════════════════════════════════════
// CoopWaitingRoom — Lobby chờ đủ người trước khi bắt đầu
// Hiển thị roomCode, danh sách slot, nút mời bạn, nút bắt đầu
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CoopPlayer } from '@/modules/coop/types/coop.types';
import { coopApi } from '@/modules/coop/api/api-coop';
import { socialApi } from '@/shared/api/api-social';
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
  const { t } = useTranslation('pvp');
  const addToast = useUIStore(s => s.addToast);
  const [copied, setCopied] = useState(false);

  // === Invite modal state ===
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [onlineFriends, setOnlineFriends] = useState<Array<{ id: string; name: string; avatar: string | null }>>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

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

  const openInviteModal = async () => {
    setShowInviteModal(true);
    setLoadingFriends(true);
    try {
      const { friends } = await socialApi.getFriends();
      setOnlineFriends(friends.filter(f => f.online).map(f => ({ id: f.id, name: f.name, avatar: f.avatar })));
    } catch {
      addToast('Không thể tải danh sách bạn bè', 'error');
      setShowInviteModal(false);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleInvite = async (friendId: string) => {
    setInvitingId(friendId);
    try {
      await coopApi.inviteToRoom(friendId, roomCode);
      setInvitedIds(prev => new Set(prev).add(friendId));
      addToast(t('coop.inviteModal.sent'), 'success');
    } catch {
      addToast('Không thể gửi lời mời', 'error');
    } finally {
      setInvitingId(null);
    }
  };

  // Lobby countdown
  const lobbyMinutes = Math.floor(lobbyTimeLeft / 60);
  const lobbySeconds = lobbyTimeLeft % 60;

  return (
    <>
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
          onClick={openInviteModal}
          style={{
            padding:      '12px 0',
            background:   '#1d4ed8',
            color:        'white',
            fontWeight:   700,
            fontSize:     15,
            border:       'none',
            borderRadius: 10,
            cursor:       'pointer',
          }}
        >
          🤝 Mời Bạn
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

    {/* === Invite Friend Modal === */}
    {showInviteModal && (
      <div
        style={{
          position:       'fixed',
          inset:          0,
          background:     'rgba(0,0,0,0.8)',
          zIndex:         30,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        24,
        }}
        onClick={() => setShowInviteModal(false)}
      >
        <div
          style={{
            background:    '#1f2937',
            borderRadius:  16,
            padding:       20,
            width:         '100%',
            maxWidth:      360,
            maxHeight:     '70vh',
            display:       'flex',
            flexDirection: 'column',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              🤝 {t('coop.inviteModal.title', { code: roomCode })}
            </h3>
            <button
              onClick={() => setShowInviteModal(false)}
              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingFriends ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                {t('coop.inviteModal.loading')}
              </div>
            ) : onlineFriends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 14 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
                {t('coop.inviteModal.empty')}
              </div>
            ) : (
              onlineFriends.map(f => (
                <div
                  key={f.id}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          10,
                    padding:      '10px 0',
                    borderBottom: '1px solid #374151',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#374151', overflow: 'hidden', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {f.avatar
                      ? <img src={f.avatar} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 16 }}>🧑</span>
                    }
                  </div>
                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#22c55e' }}>● Online</div>
                  </div>
                  {/* Invite button */}
                  <button
                    onClick={() => !invitedIds.has(f.id) && handleInvite(f.id)}
                    disabled={invitingId === f.id || invitedIds.has(f.id)}
                    style={{
                      padding:      '6px 14px',
                      background:   invitedIds.has(f.id) ? '#166534' : invitingId === f.id ? '#374151' : '#1d4ed8',
                      color:        'white',
                      fontWeight:   700,
                      fontSize:     12,
                      border:       'none',
                      borderRadius: 8,
                      cursor:       (invitingId === f.id || invitedIds.has(f.id)) ? 'default' : 'pointer',
                      opacity:      invitingId === f.id ? 0.7 : 1,
                      flexShrink:   0,
                    }}
                  >
                    {invitedIds.has(f.id)
                      ? t('coop.inviteModal.invited')
                      : invitingId === f.id
                        ? t('coop.inviteModal.inviting')
                        : t('coop.inviteModal.invite')
                    }
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
