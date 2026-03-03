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
  const [tab, setTab] = useState<'leaderboard' | 'feed'>('leaderboard');
  const [mainTab, setMainTab] = useState<'arena' | 'history'>('arena');
  const currentUserId = authData?.user?.id ?? null;

  // === Battle state ===
  const [showBattle, setShowBattle] = useState(false);

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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
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
      <div className="flex border-b border-gray-800 flex-shrink-0">
        <button
          onClick={() => setMainTab('arena')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mainTab === 'arena'
              ? 'border-b-2 border-yellow-400 text-yellow-400'
              : 'text-gray-400'
          }`}
        >
          Dau truong
        </button>
        <button
          onClick={() => setMainTab('history')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mainTab === 'history'
              ? 'border-b-2 border-blue-400 text-blue-400'
              : 'text-gray-400'
          }`}
        >
          Lich su
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
          <>
            {/* Boss info — fixed top section */}
            <div className="flex-shrink-0">
              <BossDisplay boss={boss} />

              <HpBar
                currentHp={boss.currentHp}
                maxHp={boss.stats.max_hp}
              />

              <CountdownTimer
                startedAt={boss.startedAt}
                durationMinutes={boss.durationMinutes}
              />

              <div className="flex items-center justify-between px-4 py-1 text-xs text-gray-400">
                <span>{boss.participantCount} nguoi tham gia</span>
              </div>
            </div>

            {/* Inner tabs: Leaderboard / Feed */}
            <div className="flex-1 flex flex-col overflow-hidden border-t border-gray-800">
              <div className="flex flex-shrink-0 border-b border-gray-700">
                <button
                  onClick={() => setTab('leaderboard')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    tab === 'leaderboard'
                      ? 'border-b-2 border-yellow-400 text-yellow-400'
                      : 'text-gray-400'
                  }`}
                >
                  Xep hang
                </button>
                <button
                  onClick={() => setTab('feed')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    tab === 'feed'
                      ? 'border-b-2 border-blue-400 text-blue-400'
                      : 'text-gray-400'
                  }`}
                >
                  Tran chien
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {tab === 'leaderboard' ? (
                  <FullLeaderboard
                    leaderboard={boss.leaderboard}
                    currentUserId={currentUserId}
                  />
                ) : (
                  <LiveFeed feed={boss.feed} />
                )}
              </div>
            </div>

            {/* Attack button */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-gray-800">
              <AttackButton
                battleState="idle"
                onAttack={() => setShowBattle(true)}
              />
            </div>
          </>
        )}
      </div>

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
