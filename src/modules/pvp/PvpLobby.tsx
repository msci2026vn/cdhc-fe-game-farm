import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pvpApi, getRankFromPoints } from '@/shared/api/api-pvp';
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

// ─── Challenge Popup (with countdown) ─────────────────────────────────────────
function ChallengePopup({
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

// ─── Main PvpLobby ────────────────────────────────────────────────────────────
export default function PvpLobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation('pvp');
  const { data: auth } = useAuth();
  const qc = useQueryClient();

  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [showRoomList, setShowRoomList] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [pendingInvite, setPendingInvite] = useState<(PvpEvent & { type: 'pvp_invite' }) | null>(null);
  const [toast, setToast] = useState('');
  const [showBotPicker, setShowBotPicker] = useState(false);
  const [botLoading, setBotLoading] = useState(false);
  const [showBossPopup, setShowBossPopup] = useState(false);
  const [bossData, setBossData] = useState<{ name: string; avatar: string; greeting: string } | null>(null);
  const [challengeData, setChallengeData] = useState<{ roomCode: string; hostId: string; hostName: string; hostRating: number; timeoutMs: number } | null>(null);
  const [showChallengePopup, setShowChallengePopup] = useState(false);
  const [openRoomLoading, setOpenRoomLoading] = useState(false);
  const [challengeSearching, setChallengeSearching] = useState(false);

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
    retry: 1,           // stop flood: only 1 retry on 502 (was 3 default)
    retryDelay: 3000,   // fixed 3s delay, not exponential
    refetchOnWindowFocus: false,
  });

  // When queue finds a match (or triggers bot/boss)
  useEffect(() => {
    if (!queueStatus) return;
    // Boss popup trigger
    if (queueStatus.triggerBoss || queueStatus.isBossGame) {
      setInQueue(false);
      if (queueStatus.boss) {
        setBossData(queueStatus.boss);
        setShowBossPopup(true);
      } else if (queueStatus.roomId) {
        navigate(`/pvp-test?roomId=${queueStatus.roomId}`);
      }
      return;
    }
    // Matched (normal, bot stealth, or boss with roomId)
    if (queueStatus.matched && (queueStatus.roomCode || queueStatus.roomId)) {
      setInQueue(false);
      const target = queueStatus.roomId
        ? `/pvp-test?roomId=${queueStatus.roomId}&fromQueue=1`
        : `/pvp-test?room=${queueStatus.roomCode}&fromQueue=1`;
      navigate(target);
      return;
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
      if (event.action === 'accept' && (event.roomId || event.roomCode)) {
        showToast(t('toast.friendAccepted'));
        const target = event.roomId
          ? `/pvp-test?roomId=${event.roomId}`
          : `/pvp-test?room=${event.roomCode}`;
        setTimeout(() => navigate(target), 1000);
      } else {
        showToast(t('toast.friendRejected'));
      }
    } else if (event.type === 'pvp_matched') {
      setInQueue(false);
      showToast(t('toast.matchFound'));
      const target = event.roomId
        ? `/pvp-test?roomId=${event.roomId}&fromQueue=1`
        : `/pvp-test?room=${event.roomCode}&fromQueue=1`;
      setTimeout(() => navigate(target), 800);
    } else if (event.type === 'pvp_challenge') {
      setChallengeData({ roomCode: event.roomCode, hostId: event.hostId, hostName: event.hostName, hostRating: event.hostRating, timeoutMs: event.timeoutMs || 30000 });
      setShowChallengePopup(true);
    } else if (event.type === 'challenge_accepted') {
      setChallengeSearching(false);
      showToast(t('challenge.accepted'));
    } else if (event.type === 'quick_match_joined') {
      showToast(t('toast.matchFound'));
      const qmTarget = event.roomId
        ? `/pvp-test?roomId=${event.roomId}`
        : `/pvp-test?room=${event.roomCode}`;
      setTimeout(() => navigate(qmTarget), 800);
    } else if (event.type === 'challenge_failed') {
      setChallengeSearching(false);
      showToast(t('challenge.noOpponent'));
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
      if (data.roomId) navigate(`/pvp-test?roomId=${data.roomId}`);
      else if (data.roomCode) navigate(`/pvp-test?room=${data.roomCode}`);
    },
    onError: () => setPendingInvite(null),
  });

  const challengeRespondMut = useMutation({
    mutationFn: (accept: boolean) => pvpApi.challengeRespond(accept),
    onSuccess: (data) => {
      setShowChallengePopup(false);
      setChallengeData(null);
      if (data.roomId) navigate(`/pvp-test?roomId=${data.roomId}`);
      else if (data.roomCode) navigate(`/pvp-test?room=${data.roomCode}`);
    },
    onError: () => { setShowChallengePopup(false); setChallengeData(null); },
  });

  const joinQueueMut = useMutation({
    mutationFn: pvpApi.joinQueue,
    onSuccess: (data) => {
      if (data.matched && (data.roomId || data.roomCode)) {
        const target = data.roomId
          ? `/pvp-test?roomId=${data.roomId}&fromQueue=1`
          : `/pvp-test?room=${data.roomCode}&fromQueue=1`;
        navigate(target);
      } else {
        setInQueue(true);
        setWaitSeconds(0);
      }
    },
    onError: (e: Error) => showToast(`❌ ${e.message}`),
  });

  // Auto re-queue khi bị kick từ Quick Match (code 4001)
  useEffect(() => {
    if (searchParams.get('requeue') === '1') {
      showToast(t('matchmaking.kickedRequeue'));
      joinQueueMut.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leaveQueueMut = useMutation({
    mutationFn: pvpApi.leaveQueue,
    onSuccess: () => setInQueue(false),
  });

  // ── Bot / Boss handlers ──
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

  const handleCreateOpenRoom = async () => {
    setOpenRoomLoading(true);
    try {
      const data = await pvpApi.createOpenRoom();
      if (data.ok && data.roomCode) {
        // Auto-challenge: tìm người online để thách đấu
        setChallengeSearching(true);
        pvpApi.startChallenge(data.roomCode).catch(() => {
          // silent — host vẫn vào phòng bình thường
        });
        // Use Colyseus roomId (internal ID) — not roomCode (short display code)
        navigate(`/pvp-test?roomId=${data.roomId}`);
      }
    } catch (e) {
      showToast(`❌ ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setOpenRoomLoading(false);
    }
  };

  const handleBossAccept = async () => {
    setShowBossPopup(false);
    try {
      const data = await pvpApi.bossChallenge();
      if (data.ok && data.roomId) {
        navigate(`/pvp-test?roomId=${data.roomId}`);
      }
    } catch (e) {
      showToast(`❌ ${e instanceof Error ? e.message : 'Error'}`);
    }
  };

  const winRate = rating
    ? rating.wins + rating.losses + rating.draws > 0
      ? Math.round((rating.wins / (rating.wins + rating.losses + rating.draws)) * 100)
      : 0
    : 0;

  const rankPoints = rating?.rankPoints ?? 0;
  const rankInfo = getRankFromPoints(rankPoints);

  return (
    <div style={{
      minHeight: '100dvh',
      overflowY: 'auto',
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

        {/* Rating card — Cảnh Giới */}
        <div style={{
          background: 'linear-gradient(135deg,#1e3a5a,#0f1e30)',
          border: '1px solid #1e4d78',
          borderRadius: 16, padding: '16px 20px', marginBottom: 20,
        }}>
          {/* Tier row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>{rankInfo.tier.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: rankInfo.tier.color }}>
                {rankInfo.tier.name}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {rankInfo.subTierName}
              </div>
            </div>
            <button
              onClick={() => navigate('/pvp/rank')}
              style={{
                background: 'none', border: '1px solid #475569',
                borderRadius: 8, padding: '4px 10px',
                color: '#94a3b8', fontSize: 11, cursor: 'pointer',
              }}
            >
              Xem thang →
            </button>
          </div>

          {/* Rank Points */}
          <div style={{ fontSize: 32, fontWeight: 900, color: '#f59e0b', marginBottom: 4 }}>
            {rankPoints} <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 400 }}>điểm</span>
          </div>

          {/* Progress bar */}
          <div style={{
            width: '100%', height: 6, background: '#374151',
            borderRadius: 3, overflow: 'hidden', marginBottom: 10,
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${rankInfo.progress}%`,
              backgroundColor: rankInfo.tier.color,
              transition: 'width 0.5s',
            }} />
          </div>

          {/* Win/Loss/Draw row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
            <span style={{ color: '#22c55e' }}>{rating?.wins ?? 0} {t('lobby.wins')}</span>
            <span style={{ color: '#ef4444' }}>{rating?.losses ?? 0} {t('lobby.losses')}</span>
            <span style={{ color: '#94a3b8' }}>{rating?.draws ?? 0} {t('lobby.draws')}</span>
            <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12 }}>
              {t('lobby.winRate', { rate: winRate })}
            </span>
          </div>
        </div>

        {/* Build button */}
        <button
          onClick={() => navigate('/pvp/build')}
          style={{
            width: '100%', padding: '12px', borderRadius: 12, marginBottom: 10,
            background: 'linear-gradient(135deg,#b45309,#92400e)',
            color: '#fff', cursor: 'pointer', textAlign: 'center',
            border: '1px solid #b45309',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>⚙️</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Thiết Lập Build</span>
        </button>

        {/* 5 action buttons (top: 3-col bot highlight, bottom: 2x2) */}
        {/* Play vs Bot — full width highlight */}
        <button
          onClick={() => setShowBotPicker(true)}
          disabled={botLoading}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, marginBottom: 10,
            background: botLoading
              ? 'linear-gradient(135deg,#333,#222)'
              : 'linear-gradient(135deg,#dc2626,#b91c1c)',
            color: '#fff', cursor: botLoading ? 'not-allowed' : 'pointer',
            textAlign: 'center', border: '1px solid #dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: botLoading ? 0.7 : 1,
          }}
        >
          <span style={{ fontSize: 26 }}>🤖</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            {botLoading ? t('common.loading') : t('bot.playWithBot')}
          </span>
        </button>

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

          {/* Tạo phòng — auto-challenge ngược chiều Quick Match */}
          <button
            onClick={() => void handleCreateOpenRoom()}
            disabled={openRoomLoading}
            style={{
              padding: '16px 8px', borderRadius: 12,
              background: openRoomLoading
                ? 'linear-gradient(135deg,#333,#222)'
                : 'linear-gradient(135deg,#b45309,#92400e)',
              color: '#fff', cursor: openRoomLoading ? 'not-allowed' : 'pointer', textAlign: 'center',
              border: '1px solid #b45309', opacity: openRoomLoading ? 0.7 : 1,
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 6 }}>{openRoomLoading ? '⏳' : '➕'}</div>
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

      {/* Bot Difficulty Picker */}
      {showBotPicker && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 250,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={() => setShowBotPicker(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg,#1a1a2e,#0f1624)',
              border: '1px solid #dc2626',
              borderRadius: '16px 16px 0 0',
              width: '100%', maxWidth: 420,
              padding: '20px 20px 28px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
              🤖 {t('bot.selectDifficulty')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                { tier: 'easy', label: t('bot.easy'), emoji: '😊', bg: 'linear-gradient(135deg,#16a34a,#15803d)' },
                { tier: 'medium', label: t('bot.medium'), emoji: '😐', bg: 'linear-gradient(135deg,#ca8a04,#a16207)' },
                { tier: 'hard', label: t('bot.hard'), emoji: '😤', bg: 'linear-gradient(135deg,#ea580c,#c2410c)' },
                { tier: 'expert', label: t('bot.expert'), emoji: '😈', bg: 'linear-gradient(135deg,#dc2626,#991b1b)' },
              ] as const).map(({ tier, label, emoji, bg }) => (
                <button
                  key={tier}
                  onClick={() => handlePlayBot(tier)}
                  style={{
                    background: bg, color: '#fff',
                    borderRadius: 12, padding: '18px 8px',
                    border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 15,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                >
                  <span style={{ fontSize: 30 }}>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Boss Challenge Popup */}
      {showBossPopup && bossData && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
            border: '2px solid #ef4444',
            borderRadius: 16, padding: 28, maxWidth: 340, width: '100%',
            textAlign: 'center', color: '#fff',
            boxShadow: '0 0 60px rgba(239,68,68,0.3)',
          }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>{bossData.avatar}</div>
            <div style={{ fontSize: 14, color: '#ef4444', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('boss.challenge')}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{bossData.name}</div>
            <div style={{ fontSize: 14, color: '#94a3b8', fontStyle: 'italic', marginBottom: 20 }}>
              "{bossData.greeting}"
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowBossPopup(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  border: '1px solid #64748b', background: 'transparent',
                  color: '#94a3b8', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {t('boss.flee')}
              </button>
              <button
                onClick={handleBossAccept}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  border: 'none', background: 'linear-gradient(135deg,#dc2626,#991b1b)',
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {t('boss.fight')} ⚔️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Challenge Popup — nhận thách đấu từ host (30s countdown) */}
      {showChallengePopup && challengeData && (
        <ChallengePopup
          data={challengeData}
          pending={challengeRespondMut.isPending}
          onAccept={() => challengeRespondMut.mutate(true)}
          onDecline={() => challengeRespondMut.mutate(false)}
          onTimeout={() => {
            challengeRespondMut.mutate(false);
            setShowChallengePopup(false);
            setChallengeData(null);
          }}
        />
      )}
    </div>
  );
}
