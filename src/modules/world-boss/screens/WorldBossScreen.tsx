import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldBoss } from '../hooks/useWorldBoss';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { BossDisplay } from '../components/BossDisplay';
import { HpBar } from '../components/HpBar';
import { CountdownTimer } from '../components/CountdownTimer';
import { FullLeaderboard } from '../components/FullLeaderboard';
import { LiveFeed } from '../components/LiveFeed';
import { BossWaiting } from '../components/BossWaiting';
import { AttackButton } from '../components/AttackButton';
import { RewardsScreen } from '../components/RewardsScreen';
import { HistoryList } from '../components/HistoryList';
import { WorldBossBattleView } from '../components/WorldBossBattleView';
import CoopScreen from '@/modules/coop/CoopScreen';
import { coopApi } from '@/modules/coop/api/api-coop';

interface EndedBossInfo {
  id: string;
  bossName: string;
  element?: string;
  difficulty?: string;
  status?: string;
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 pt-8 animate-pulse">
      <div className="w-48 h-48 rounded-full bg-gray-700" />
      <div className="h-6 w-40 bg-gray-700 rounded" />
      <div className="h-4 w-32 bg-gray-700 rounded" />
      <div className="w-full h-6 bg-gray-700 rounded-full" />
    </div>
  );
}

export function WorldBossScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useWorldBoss();
  const { data: authData } = useAuth();
  const boss = data?.boss;
  const [mainTab, setMainTab] = useState<'arena' | 'history'>('arena');
  const currentUserId = authData?.user?.id ?? null;

  // === Battle state ===
  const [showBattle, setShowBattle] = useState(false);
  const [showCoop,   setShowCoop]   = useState(false);  // Co-op mode
  const [popup, setPopup] = useState<'leaderboard' | 'feed' | null>(null);

  // === Join by room code ===
  const [coopInitialRoomId, setCoopInitialRoomId] = useState<string | undefined>();
  const [showJoinInput,   setShowJoinInput]   = useState(false);
  const [joinCode,        setJoinCode]        = useState('');
  const [joiningByCode,   setJoiningByCode]   = useState(false);
  const [joinError,       setJoinError]       = useState('');

  // === Boss End Detection ===
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [endedBossInfo, setEndedBossInfo] = useState<EndedBossInfo | null>(null);
  const prevActiveRef = useRef(false);
  const currentBossRef = useRef<EndedBossInfo | null>(null);

  // Track current boss info while active
  useEffect(() => {
    if (data?.active && data.boss) {
      currentBossRef.current = {
        id: data.boss.id,
        bossName: data.boss.bossName,
        element: data.boss.element,
        difficulty: data.boss.difficulty,
      };
    }
  }, [data?.active, data?.boss]);

  // Detect end via polling: active true → false
  useEffect(() => {
    const wasActive = prevActiveRef.current;
    const isActive = data?.active ?? false;
    if (wasActive && !isActive && currentBossRef.current) {
      setEndedBossInfo({ ...currentBossRef.current, status: 'expired' });
      setShowEndScreen(true);
      setShowBattle(false);
    }
    prevActiveRef.current = isActive;
  }, [data?.active]);

  // Fullscreen solo battle view
  if (showBattle && boss) {
    return (
      <WorldBossBattleView
        worldBoss={boss}
        onExit={() => setShowBattle(false)}
      />
    );
  }

  // Fullscreen co-op mode — optional path, solo flow không bị ảnh hưởng
  if (showCoop && boss) {
    return (
      <CoopScreen
        worldBoss={boss}
        initialRoomId={coopInitialRoomId}
        onExit={() => { setShowCoop(false); setCoopInitialRoomId(undefined); }}
      />
    );
  }

  const handleJoinByCode = async () => {
    const code = joinCode.trim();
    if (!code) {
      setJoinError(t('pvp:coop.joinByCode.errorInvalid'));
      return;
    }
    setJoiningByCode(true);
    setJoinError('');
    try {
      const roomInfo = await coopApi.getRoom(code);
      if (!roomInfo) {
        setJoinError(t('pvp:coop.joinByCode.errorNotFound'));
        return;
      }
      if (roomInfo.phase === 'ended') {
        setJoinError(t('pvp:coop.joinByCode.errorEnded'));
        return;
      }
      setShowJoinInput(false);
      setCoopInitialRoomId(roomInfo.roomId);
      setShowCoop(true);
    } catch {
      setJoinError(t('pvp:coop.joinByCode.errorNotFound'));
    } finally {
      setJoiningByCode(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#111827',
        color: 'white',
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid #1f2937', background: '#111827' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-xl p-1">
            ←
          </button>
          <h1 className="text-lg font-bold flex-1">World Boss</h1>
          {data?.active && (
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
              LIVE
            </span>
          )}
        </div>

        {/* Main tabs */}
        <div className="flex border-t border-gray-800">
          <button
            onClick={() => setMainTab('arena')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mainTab === 'arena'
              ? 'border-b-2 border-yellow-400 text-yellow-400'
              : 'text-gray-400'
              }`}
          >
            {t('world_boss.screen.arena')}
          </button>
          <button
            onClick={() => setMainTab('history')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mainTab === 'history'
              ? 'border-b-2 border-blue-400 text-blue-400'
              : 'text-gray-400'
              }`}
          >
            {t('world_boss.screen.history')}
          </button>
        </div>
      </div>

      {/* Non-scrollable: boss info + attack button (only when active) */}
      {mainTab === 'arena' && data?.active && boss && (
        <div style={{ flexShrink: 0, borderBottom: '1px solid #1f2937' }}>
          <BossDisplay
            boss={boss}
            onRanking={() => setPopup('leaderboard')}
            onBattle={() => setPopup('feed')}
          />

          <HpBar
            currentHp={boss.currentHp}
            maxHp={boss.stats.max_hp}
          />

          <CountdownTimer
            startedAt={boss.startedAt}
            durationMinutes={boss.durationMinutes}
          />

          {/* Attack button + Co-op button — ngay dưới đếm ngược */}
          <div style={{ padding: '10px 16px', display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <AttackButton
                battleState="idle"
                onAttack={() => setShowBattle(true)}
              />
            </div>
            {/* Nút Co-op — optional path, không thay đổi solo flow */}
            <button
              onClick={() => { setCoopInitialRoomId(undefined); setShowCoop(true); }}
              style={{
                padding:      '0 16px',
                background:   'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                color:        'white',
                fontWeight:   700,
                fontSize:     13,
                border:       'none',
                borderRadius: 10,
                cursor:       'pointer',
                whiteSpace:   'nowrap',
              }}
            >
              👥 Co-op
            </button>
            {/* Nút Nhập mã phòng */}
            <button
              onClick={() => { setJoinCode(''); setJoinError(''); setShowJoinInput(true); }}
              style={{
                padding:      '0 12px',
                background:   'rgba(255,255,255,0.08)',
                color:        '#d1d5db',
                fontWeight:   600,
                fontSize:     12,
                border:       '1px solid #374151',
                borderRadius: 10,
                cursor:       'pointer',
                whiteSpace:   'nowrap',
              }}
            >
              {t('pvp:coop.joinByCode.button')}
            </button>
          </div>

          <div className="flex items-center justify-between px-4 pb-1 text-xs text-gray-400">
            <span>{t('world_boss.screen.participants_count', { count: boss.participantCount })}</span>
          </div>
        </div>
      )}

      {/* Scrollable: history hoặc fallbacks */}
      <div
        style={{
          flex: 1,
          overflowY: 'scroll',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          paddingBottom: '16px',
        }}
      >
        {mainTab === 'history' ? (
          <HistoryList />
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-4 text-center">
            <div className="text-5xl">!</div>
            <h2 className="text-lg font-bold text-red-400">{t('world_boss.screen.error_connect_title')}</h2>
            <p className="text-gray-400 text-sm max-w-xs">{t('world_boss.screen.error_connect_desc')}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors"
            >
              {t('world_boss.screen.retry')}
            </button>
          </div>
        ) : !data?.active || !boss ? (
          <BossWaiting onShowHistory={() => setMainTab('history')} />
        ) : (
          <div />
        )}
      </div>

      {/* Popup: Xếp hạng */}
      {popup === 'leaderboard' && boss && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={() => setPopup(null)}
        >
          <div
            style={{ background: '#1f2937', borderRadius: '20px 20px 0 0', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#4b5563' }} />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <h2 className="text-lg font-bold text-yellow-400">{t('world_boss.screen.ranking_title')}</h2>
              <button onClick={() => setPopup(null)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>
            {/* Content */}
            <div style={{ flex: 1, overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>
              <FullLeaderboard leaderboard={boss.leaderboard} currentUserId={currentUserId} />
            </div>
          </div>
        </div>
      )}

      {/* Popup: Trận chiến */}
      {popup === 'feed' && boss && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={() => setPopup(null)}
        >
          <div
            style={{ background: '#1f2937', borderRadius: '20px 20px 0 0', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#4b5563' }} />
            </div>
            <div className="flex items-center justify-between px-4 pb-3">
              <h2 className="text-lg font-bold text-blue-400">{t('world_boss.screen.battle_title')}</h2>
              <button onClick={() => setPopup(null)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>
              <LiveFeed feed={boss.feed} />
            </div>
          </div>
        </div>
      )}

      {/* Popup: Nhập mã phòng */}
      {showJoinInput && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowJoinInput(false)}
        >
          <div
            style={{ background: '#1f2937', borderRadius: 16, padding: 24, width: '100%', maxWidth: 320 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                🔑 {t('pvp:coop.joinByCode.title')}
              </h3>
              <button onClick={() => setShowJoinInput(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <input
              type="text"
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value.toUpperCase().slice(0, 4)); setJoinError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
              placeholder={t('pvp:coop.joinByCode.placeholder')}
              maxLength={4}
              autoFocus
              style={{
                width:        '100%',
                padding:      '12px 14px',
                background:   '#111827',
                border:       `1px solid ${joinError ? '#ef4444' : '#374151'}`,
                borderRadius: 10,
                color:        'white',
                fontSize:     22,
                fontWeight:   700,
                letterSpacing: 6,
                textAlign:    'center',
                fontFamily:   'monospace',
                outline:      'none',
                boxSizing:    'border-box',
              }}
            />
            {joinError && (
              <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                {joinError}
              </div>
            )}
            <button
              onClick={handleJoinByCode}
              disabled={joiningByCode}
              style={{
                marginTop:    14,
                width:        '100%',
                padding:      '12px 0',
                background:   joiningByCode ? '#374151' : 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                color:        'white',
                fontWeight:   700,
                fontSize:     15,
                border:       'none',
                borderRadius: 10,
                cursor:       joiningByCode ? 'not-allowed' : 'pointer',
              }}
            >
              {joiningByCode ? t('pvp:coop.joinByCode.joining') : t('pvp:coop.joinByCode.submit')}
            </button>
          </div>
        </div>
      )}

      {/* End Screen */}
      {showEndScreen && endedBossInfo && (
        <RewardsScreen
          eventId={endedBossInfo.id}
          bossName={endedBossInfo.bossName}
          bossElement={endedBossInfo.element}
          difficulty={endedBossInfo.difficulty}
          status={endedBossInfo.status}
          onClose={() => setShowEndScreen(false)}
        />
      )}
    </div>
  );
}
