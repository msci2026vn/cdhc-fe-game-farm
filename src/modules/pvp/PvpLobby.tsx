import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { pvpApi } from '@/shared/api/api-pvp';
import type { PvpEvent } from '@/shared/api/api-pvp';
import { usePvpSSE } from './hooks/usePvpSSE';
import { useAuth } from '@/shared/hooks/useAuth';
import { RoomListModal } from './PvpRoomListModal';
import { InvitePopup } from './PvpInvitePopup';
import { FriendPickerModal } from './PvpFriendPickerModal';
import { QuickMatchModal } from './PvpQuickMatchModal';
import { ChallengePopup } from './PvpChallengePopup';
import { PvpRatingCard } from './PvpRatingCard';
import { PvpActionGrid } from './PvpActionGrid';
import { PvpRoomTabPanel } from './PvpRoomTabPanel';
import { PvpRecentMatches } from './PvpRecentMatches';
import { PvpBotDifficultyPicker } from './PvpBotDifficultyPicker';
import { PvpBossPopup } from './PvpBossPopup';

const API_BASE = import.meta.env.VITE_API_URL || 'https://sta.cdhc.vn';

// ─── Main PvpLobby ────────────────────────────────────────────────────────────
export default function PvpLobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation('pvp');
  const { data: auth } = useAuth();

  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [showRoomList, setShowRoomList] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [pendingInvite, setPendingInvite] = useState<(PvpEvent & { type: 'pvp_invite' }) | null>(null);
  const [toast, setToast] = useState('');
  const [showBossPopup, setShowBossPopup] = useState(false);
  const [bossData, setBossData] = useState<{ name: string; avatar: string; greeting: string } | null>(null);
  const [challengeData, setChallengeData] = useState<{ roomCode: string; hostId: string; hostName: string; hostRating: number; timeoutMs: number } | null>(null);
  const [showChallengePopup, setShowChallengePopup] = useState(false);
  const [openRoomLoading, setOpenRoomLoading] = useState(false);
  const [challengeSearching, setChallengeSearching] = useState(false);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [showBotPicker, setShowBotPicker] = useState(false);
  const [botLoading, setBotLoading] = useState(false);

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

  // Queue status poll (only when in queue)
  const { data: queueStatus } = useQuery({
    queryKey: ['pvp', 'queue'],
    queryFn: pvpApi.getQueueStatus,
    enabled: inQueue,
    refetchInterval: 3000,
    retry: 1,
    retryDelay: 3000,
    refetchOnWindowFocus: false,
  });

  // When queue finds a match (or triggers bot/boss)
  useEffect(() => {
    if (!queueStatus) return;
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
      const isManual = event.timeoutMs === 29999 || (event as any).isManual;
      if (isManual) {
        setChallengeData({ roomCode: event.roomCode, hostId: event.hostId, hostName: event.hostName, hostRating: event.hostRating, timeoutMs: event.timeoutMs || 30000 });
        setShowChallengePopup(true);
      }
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
    mutationFn: (toUserId: string) => pvpApi.sendInvite(toUserId),
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
    mutationFn: () => pvpApi.joinQueue(),
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

  const leaveQueueMut = useMutation({
    mutationFn: () => pvpApi.leaveQueue(),
    onSuccess: () => setInQueue(false),
  });

  // Auto re-queue khi bị kick từ Quick Match (code 4001)
  useEffect(() => {
    if (searchParams.get('requeue') === '1') {
      showToast(t('matchmaking.kickedRequeue'));
      joinQueueMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const handleCreateOpenRoom = async () => {
    setOpenRoomLoading(true);
    try {
      const data = await pvpApi.createOpenRoom(isPublic);
      if (data.ok && data.roomCode) {
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

  return (
    <div style={{
      minHeight: '100dvh',
      overflowY: 'auto',
      background: "url('/assets/pvp/bg_pvp.png') no-repeat center top / 100% 100%",
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: '20px 16px 80px',
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
          onCancel={() => leaveQueueMut.mutate()}
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

      <div style={{ maxWidth: 320, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: 40,
          marginTop: 20,
          minHeight: 32,
        }}>
          <button
            onClick={() => navigate('/pvp')}
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
            1 vs 1 Arena
          </h1>
          <button
            onClick={() => navigate('/pvp/history?tab=leaderboard')}
            style={{
              position: 'absolute',
              right: 0,
              top: 58,
              background: "url('/assets/pvp/btn_bxh.png') no-repeat center center / contain",
              border: 'none',
              width: 86,
              height: 38,
              cursor: 'pointer',
              color: 'transparent',
              padding: 0,
            }}
          >
            BXH
          </button>
        </div>

        <div style={{ transform: 'translateY(22px)' }}>
          <PvpRatingCard />
        </div>

        <PvpActionGrid
          onFindMatch={() => joinQueueMut.mutate()}
          findMatchDisabled={joinQueueMut.isPending || inQueue}
          onRoomList={() => setShowRoomList(true)}
          onCreateRoom={() => void handleCreateOpenRoom()}
          createRoomLoading={openRoomLoading}
          isPublic={isPublic}
          onTogglePublic={() => setIsPublic(p => !p)}
        />

        <PvpRoomTabPanel />

        <PvpRecentMatches />

      </div>


      {/* Boss Challenge Popup */}
      {showBossPopup && bossData && (
        <PvpBossPopup
          bossData={bossData}
          onClose={() => setShowBossPopup(false)}
          onAccept={handleBossAccept}
        />
      )}

      {/* Auto-Challenge Popup */}
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
      {/* Bot Difficulty Picker */}
      {showBotPicker && (
        <PvpBotDifficultyPicker
          onClose={() => setShowBotPicker(false)}
          onSelect={handlePlayBot}
        />
      )}

      {/* Bottom Navigation — same as PvpHub */}
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
          { icon: 'btn_build.png', label: 'Build', path: '/pvp/build' }
        ].map((btn, index) => (
          <button
            key={index}
            onClick={() => {
              if (btn.label === 'Bot') {
                setShowBotPicker(true);
              } else if (btn.label === 'Invite') {
                setShowFriendPicker(true);
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
    </div>
  );
}
