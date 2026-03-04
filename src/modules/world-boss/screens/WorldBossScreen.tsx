import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldBoss } from '../hooks/useWorldBoss';
import { useAuth } from '../../../shared/hooks/useAuth';
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
  const { data, isLoading, isError, refetch } = useWorldBoss();
  const { data: authData } = useAuth();
  const boss = data?.boss;
  const [mainTab, setMainTab] = useState<'arena' | 'history'>('arena');
  const currentUserId = authData?.user?.id ?? null;

  // === Battle state ===
  const [showBattle, setShowBattle] = useState(false);
  const [popup, setPopup] = useState<'leaderboard' | 'feed' | null>(null);

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

  // Fullscreen battle view
  if (showBattle && boss) {
    return (
      <WorldBossBattleView
        worldBoss={boss}
        onExit={() => setShowBattle(false)}
      />
    );
  }

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
            Dau truong
          </button>
          <button
            onClick={() => setMainTab('history')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mainTab === 'history'
              ? 'border-b-2 border-blue-400 text-blue-400'
              : 'text-gray-400'
              }`}
          >
            Lich su
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

          {/* Attack button — ngay dưới đếm ngược */}
          <div style={{ padding: '10px 16px' }}>
            <AttackButton
              battleState="idle"
              onAttack={() => setShowBattle(true)}
            />
          </div>

          <div className="flex items-center justify-between px-4 pb-1 text-xs text-gray-400">
            <span>{boss.participantCount} nguoi tham gia</span>
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
            <h2 className="text-lg font-bold text-red-400">Khong the ket noi server</h2>
            <p className="text-gray-400 text-sm max-w-xs">Dang co su co ket noi. Boss co the dang hoat dong — thu lai sau vai giay.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Thu lai
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
              <h2 className="text-lg font-bold text-yellow-400">🏆 Xếp hạng</h2>
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
              <h2 className="text-lg font-bold text-blue-400">⚔️ Trận chiến</h2>
              <button onClick={() => setPopup(null)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>
              <LiveFeed feed={boss.feed} />
            </div>
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
