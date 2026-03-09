import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pvpApi } from '@/shared/api/api-pvp';
import type { PvpEvent, PvpInvite } from '@/shared/api/api-pvp';
import { usePvpSSE } from './hooks/usePvpSSE';
import { useAuth } from '@/shared/hooks/useAuth';
import { socialApi } from '@/shared/api/api-social';

const API_BASE = import.meta.env.VITE_API_URL || 'https://sta.cdhc.vn';

interface RoomInfo {
  roomId: string;
  roomCode: string;
  hostName: string;
  clients: number;
  maxClients: number;
  createdAt: string | null;
}

// ─── Room List Modal ──────────────────────────────────────────────────────────
function RoomListModal({
  onClose,
  onJoin,
}: {
  onClose: () => void;
  onJoin: (roomId: string, roomCode: string) => void;
}) {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation('pvp');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/pvp/rooms`, { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as { rooms?: RoomInfo[] };
        setRooms(data.rooms ?? []);
      }
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchRooms(); }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 250,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg,#1a1a2e,#0f1624)',
          border: '1px solid #1e4d78',
          borderRadius: '16px 16px 0 0',
          width: '100%', maxWidth: 480,
          maxHeight: '75vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid #1e3a5a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>📋 {t('room.waiting')}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: 40, fontSize: 14 }}>{t('common.loading')}</div>
          ) : rooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏜️</div>
              <div style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{t('room.noRooms')}</div>
              <button
                onClick={() => { onClose(); navigate('/pvp-test'); }}
                style={{
                  padding: '10px 28px', borderRadius: 10, border: 'none',
                  background: '#b45309', color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {t('room.createNew')}
              </button>
            </div>
          ) : (
            rooms.map(room => (
              <div
                key={room.roomId}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 20px', borderBottom: '1px solid #0f1e30',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: '#7c3aed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#fff',
                  }}>
                    {(room.hostName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{room.hostName || 'Unknown'}</div>
                    <div style={{ color: '#64748b', fontSize: 11 }}>
                      #{room.roomCode} · {t('room.players', { current: room.clients, max: room.maxClients })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onJoin(room.roomId, room.roomCode)}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: '#22c55e', color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {t('room.join')} ▶
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer refresh */}
        <button
          onClick={fetchRooms}
          style={{
            padding: '12px', background: 'none', border: 'none',
            color: '#64748b', fontSize: 13, cursor: 'pointer',
            borderTop: '1px solid #0f1e30', flexShrink: 0,
          }}
        >
          {t('room.refresh')}
        </button>
      </div>
    </div>
  );
}

// ─── Invite Popup ────────────────────────────────────────────────────────────
function InvitePopup({
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
      position: 'fixed', inset: 0, zIndex: 300,
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

// ─── Friend Picker Modal ──────────────────────────────────────────────────────
function FriendPickerModal({
  onClose,
  onSend,
  sending,
}: {
  onClose: () => void;
  onSend: (friendId: string) => void;
  sending: boolean;
}) {
  const { t } = useTranslation('pvp');
  const { data: friends } = useQuery({
    queryKey: ['friends'],
    queryFn: socialApi.getFriends,
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          background: 'linear-gradient(180deg,#1a1a2e,#0f1624)',
          border: '1px solid #1e4d78',
          borderRadius: '16px 16px 0 0',
          width: '100%', maxWidth: 480,
          maxHeight: '70vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1e3a5a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>{t('invite.selectFriend')}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {!friends?.friends?.length ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
              {t('invite.noFriends')}
            </div>
          ) : (
            friends.friends.map(f => (
              <div
                key={f.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 20px',
                  borderBottom: '1px solid #0f1e30',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: '#1e4d78', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {f.avatar ? <img src={f.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '👤'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Lv.{f.level}</div>
                </div>
                <button
                  onClick={() => onSend(f.id)}
                  disabled={sending}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: sending ? '#333' : '#e94560',
                    color: '#fff', fontSize: 12, fontWeight: 700,
                    cursor: sending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sending ? t('invite.sending') : t('invite.send')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Quick Match Modal ────────────────────────────────────────────────────────
function QuickMatchModal({
  waitSeconds,
  onCancel,
}: {
  waitSeconds: number;
  onCancel: () => void;
}) {
  const { t } = useTranslation('pvp');
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
        border: '2px solid #3b82f6',
        borderRadius: 16, padding: 32, maxWidth: 300, width: '90%',
        textAlign: 'center', color: '#fff',
        boxShadow: '0 0 40px rgba(59,130,246,0.3)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('matchmaking.searching')}</div>
        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
          {t('matchmaking.waitTime')} <span style={{ color: '#f59e0b', fontWeight: 700 }}>{waitSeconds}s</span>
        </div>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 24px', borderRadius: 8,
            border: '1px solid #ef4444', background: 'transparent',
            color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {t('matchmaking.cancel')}
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main PvpLobby ────────────────────────────────────────────────────────────
export default function PvpLobby() {
  const navigate = useNavigate();
  const { t } = useTranslation('pvp');
  const { data: auth } = useAuth();
  const qc = useQueryClient();

  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [showRoomList, setShowRoomList] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [pendingInvite, setPendingInvite] = useState<(PvpEvent & { type: 'pvp_invite' }) | null>(null);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  // Rating
  const { data: rating } = useQuery({
    queryKey: ['pvp', 'rating'],
    queryFn: pvpApi.getRating,
    enabled: !!auth?.user,
  });

  // Recent matches
  const { data: historyData } = useQuery({
    queryKey: ['pvp', 'history', 3],
    queryFn: () => pvpApi.getHistory(3),
    enabled: !!auth?.user,
  });

  // Queue status poll (only when in queue)
  const { data: queueStatus } = useQuery({
    queryKey: ['pvp', 'queue'],
    queryFn: pvpApi.getQueueStatus,
    enabled: inQueue,
    refetchInterval: 3000,
  });

  // When queue finds a match
  useEffect(() => {
    if (!queueStatus) return;
    if (queueStatus.matched && queueStatus.roomCode) {
      setInQueue(false);
      navigate(`/pvp-test?room=${queueStatus.roomCode}`);
    }
    if (queueStatus.inQueue && queueStatus.waitSeconds !== undefined) {
      setWaitSeconds(queueStatus.waitSeconds);
    }
  }, [queueStatus, navigate]);

  // SSE handler
  const handleSSEEvent = useCallback((event: PvpEvent) => {
    if (event.type === 'pvp_invite') {
      setPendingInvite(event);
    } else if (event.type === 'pvp_invite_response') {
      if (event.action === 'accept' && event.roomCode) {
        showToast(t('toast.friendAccepted'));
        setTimeout(() => navigate(`/pvp-test?room=${event.roomCode}`), 1000);
      } else {
        showToast(t('toast.friendRejected'));
      }
    } else if (event.type === 'pvp_matched') {
      setInQueue(false);
      showToast(t('toast.matchFound'));
      setTimeout(() => navigate(`/pvp-test?room=${event.roomCode}`), 800);
    }
  }, [navigate, showToast]);

  usePvpSSE(!!auth?.user, handleSSEEvent);

  // Mutations
  const sendInviteMut = useMutation({
    mutationFn: pvpApi.sendInvite,
    onSuccess: () => {
      setShowFriendPicker(false);
      showToast(t('toast.inviteSent'));
    },
    onError: (e: Error) => showToast(`❌ ${e.message}`),
  });

  const respondInviteMut = useMutation({
    mutationFn: ({ inviteId, action }: { inviteId: string; action: 'accept' | 'reject' }) =>
      pvpApi.respondInvite(inviteId, action),
    onSuccess: (data) => {
      setPendingInvite(null);
      if (data.roomCode) navigate(`/pvp-test?room=${data.roomCode}`);
    },
    onError: () => setPendingInvite(null),
  });

  const joinQueueMut = useMutation({
    mutationFn: pvpApi.joinQueue,
    onSuccess: (data) => {
      if (data.matched && data.roomCode) {
        navigate(`/pvp-test?room=${data.roomCode}`);
      } else {
        setInQueue(true);
        setWaitSeconds(0);
      }
    },
    onError: (e: Error) => showToast(`❌ ${e.message}`),
  });

  const leaveQueueMut = useMutation({
    mutationFn: pvpApi.leaveQueue,
    onSuccess: () => setInQueue(false),
  });

  const winRate = rating
    ? rating.wins + rating.losses + rating.draws > 0
      ? Math.round((rating.wins / (rating.wins + rating.losses + rating.draws)) * 100)
      : 0
    : 0;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0f3460 100%)',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: '16px 16px 80px',
    }}>
      {/* Pending invite popup */}
      {pendingInvite && (
        <InvitePopup
          invite={pendingInvite}
          onAccept={() =>
            respondInviteMut.mutate({ inviteId: pendingInvite.inviteId, action: 'accept' })
          }
          onReject={() => {
            respondInviteMut.mutate({ inviteId: pendingInvite.inviteId, action: 'reject' });
            setPendingInvite(null);
          }}
        />
      )}

      {/* Quick match modal */}
      {inQueue && (
        <QuickMatchModal
          waitSeconds={waitSeconds}
          onCancel={() => {
            leaveQueueMut.mutate();
          }}
        />
      )}

      {/* Room list modal */}
      {showRoomList && (
        <RoomListModal
          onClose={() => setShowRoomList(false)}
          onJoin={(roomId) => {
            setShowRoomList(false);
            navigate(`/pvp-test?roomId=${roomId}`);
          }}
        />
      )}

      {/* Friend picker modal */}
      {showFriendPicker && (
        <FriendPickerModal
          onClose={() => setShowFriendPicker(false)}
          onSend={(friendId) => sendInviteMut.mutate(friendId)}
          sending={sendInviteMut.isPending}
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

      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: 4 }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#e94560' }}>⚔️ PVP Arena</h1>
        </div>

        {/* Rating card */}
        <div style={{
          background: 'linear-gradient(135deg,#1e3a5a,#0f1e30)',
          border: '1px solid #1e4d78',
          borderRadius: 16, padding: '20px 24px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{t('lobby.rating')}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#f59e0b' }}>
              {rating?.rating ?? 1000}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              {rating?.rank ? t('lobby.rank', { rank: rating.rank }) : '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{rating?.wins ?? 0}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{t('lobby.wins')}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{rating?.losses ?? 0}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{t('lobby.losses')}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>{rating?.draws ?? 0}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{t('lobby.draws')}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{t('lobby.winRate', { rate: winRate })}</div>
          </div>
        </div>

        {/* 4 action buttons (2x2) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {/* Mời bạn */}
          <button
            onClick={() => setShowFriendPicker(true)}
            style={{
              padding: '16px 8px', borderRadius: 12,
              background: 'linear-gradient(135deg,#1e4d78,#0f3460)',
              color: '#fff', cursor: 'pointer', textAlign: 'center',
              border: '1px solid #1e4d78',
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 6 }}>👥</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{t('lobby.inviteFriend')}</div>
          </button>

          {/* Tìm trận */}
          <button
            onClick={() => joinQueueMut.mutate()}
            disabled={joinQueueMut.isPending || inQueue}
            style={{
              padding: '16px 8px', borderRadius: 12,
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: '#fff', cursor: joinQueueMut.isPending ? 'not-allowed' : 'pointer', textAlign: 'center',
              opacity: joinQueueMut.isPending ? 0.7 : 1,
              border: '1px solid #7c3aed',
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 6 }}>🔍</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{t('lobby.findMatch')}</div>
          </button>

          {/* Danh sách phòng */}
          <button
            onClick={() => setShowRoomList(true)}
            style={{
              padding: '16px 8px', borderRadius: 12,
              background: 'linear-gradient(135deg,#0f5132,#064e3b)',
              color: '#fff', cursor: 'pointer', textAlign: 'center',
              border: '1px solid #065f46',
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 6 }}>📋</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{t('lobby.roomList')}</div>
          </button>

          {/* Tạo phòng */}
          <button
            onClick={() => navigate('/pvp-test')}
            style={{
              padding: '16px 8px', borderRadius: 12,
              background: 'linear-gradient(135deg,#b45309,#92400e)',
              color: '#fff', cursor: 'pointer', textAlign: 'center',
              border: '1px solid #b45309',
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 6 }}>➕</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{t('lobby.createRoom')}</div>
          </button>
        </div>

        {/* History shortcut */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>{t('lobby.recentMatches')}</span>
            <button
              onClick={() => navigate('/pvp/history')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
            >
              {t('lobby.viewAll')}
            </button>
          </div>

          {!historyData?.matches?.length ? (
            <div style={{
              background: '#0d1b2a', border: '1px solid #1e3a5a',
              borderRadius: 10, padding: '20px', textAlign: 'center',
              color: '#64748b', fontSize: 13,
            }}>
              {t('lobby.noMatches')}
            </div>
          ) : (
            historyData.matches.map(m => (
              <div key={m.id} style={{
                background: '#0d1b2a', border: '1px solid #1e3a5a',
                borderRadius: 10, padding: '12px 16px', marginBottom: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#1e4d78',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, overflow: 'hidden',
                  }}>
                    {m.opponent_avatar
                      ? <img src={m.opponent_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      : '👤'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                      vs {m.opponent_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {m.my_score.toLocaleString()} – {m.opp_score.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700, padding: '4px 12px',
                  borderRadius: 8,
                  background: m.result === 'win' ? '#14532d' : m.result === 'draw' ? '#1e293b' : '#450a0a',
                  color: m.result === 'win' ? '#22c55e' : m.result === 'draw' ? '#94a3b8' : '#ef4444',
                }}>
                  {m.result === 'win' ? t('history.win') : m.result === 'draw' ? t('history.draw') : t('history.lose')}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
