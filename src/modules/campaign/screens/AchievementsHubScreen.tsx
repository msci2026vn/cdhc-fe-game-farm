// ═══════════════════════════════════════════════════════════════
// AchievementsHubScreen — 3 tabs: Achievements / Login Streak / Leaderboard
// Route: /campaign/achievements
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAchievements, useClaimAchievement, useClaimAllAchievements, useLoginStreak, useComboLeaderboard, useMyComboRank } from '@/shared/api/api-achievements';
import AchievementCard from '../components/AchievementCard';
import LoginStreakCalendar from '../components/LoginStreakCalendar';
import LeaderboardRow from '../components/LeaderboardRow';
import { CATEGORY_CONFIG } from '../types/achievement.types';
import type { AchievementCategory, Achievement, LeaderboardPeriod } from '../types/achievement.types';
import { playSound } from '@/shared/audio';

type HubTab = 'achievements' | 'streak' | 'leaderboard';
type CatFilter = 'all' | AchievementCategory;

const HUB_TABS: { key: HubTab; label: string; icon: string }[] = [
  { key: 'achievements', label: 'Thanh Tuu', icon: '\ud83c\udfc6' },
  { key: 'streak', label: 'Diem Danh', icon: '\ud83d\udcc5' },
  { key: 'leaderboard', label: 'BXH', icon: '\ud83e\udd47' },
];

const CAT_FILTERS: { key: CatFilter; label: string }[] = [
  { key: 'all', label: 'Tat ca' },
  ...Object.entries(CATEGORY_CONFIG).map(([k, v]) => ({
    key: k as CatFilter,
    label: `${v.emoji} ${v.label}`,
  })),
];

const PERIOD_TABS: { key: LeaderboardPeriod; label: string; icon: string }[] = [
  { key: 'weekly', label: 'Tuan', icon: '\ud83d\udcc5' },
  { key: 'monthly', label: 'Thang', icon: '\ud83d\udcc6' },
  { key: 'alltime', label: 'Moi luc', icon: '\ud83c\udfc6' },
];

export default function AchievementsHubScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HubTab>('achievements');

  // Achievement data
  const { data: achievements, isLoading: loadingAch } = useAchievements();
  const claimMut = useClaimAchievement();
  const claimAllMut = useClaimAllAchievements();

  // Streak data
  const { data: streakData, isLoading: loadingStreak } = useLoginStreak();

  // Claimable count for badge
  const claimableCount = useMemo(
    () => (achievements ?? []).filter(a => a.isUnlocked && !a.isClaimed).length,
    [achievements]
  );

  const claimedCount = (achievements ?? []).filter(a => a.isClaimed).length;
  const totalCount = (achievements ?? []).length;

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-safe pb-2">
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => { playSound('ui_click'); navigate(-1); }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            &larr;
          </button>
          <h1 className="font-heading font-bold text-lg text-white">Thanh Tuu</h1>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <span className="text-sm">🏆</span>
            <span className="text-xs font-bold text-purple-300">{claimedCount}/{totalCount}</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1.5 mt-3">
          {HUB_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); playSound('ui_tab'); }}
              className={`flex-1 py-2 rounded-full text-[11px] font-bold transition-all relative ${
                tab.key === activeTab
                  ? 'bg-purple-600 text-white'
                  : 'text-white/50'
              }`}
              style={tab.key !== activeTab ? { background: 'rgba(255,255,255,0.05)' } : { boxShadow: '0 4px 12px rgba(168,85,247,0.3)' }}
            >
              {tab.icon} {tab.label}
              {tab.key === 'achievements' && claimableCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {claimableCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-2 pb-28 scrollbar-hide">
        {activeTab === 'achievements' && (
          <AchievementsTab
            achievements={achievements ?? []}
            isLoading={loadingAch}
            claimableCount={claimableCount}
            onClaim={(id) => {
              claimMut.mutate(id, {
                onSuccess: () => playSound('coin_collect'),
                onError: () => playSound('damage_dealt'),
              });
            }}
            onClaimAll={() => {
              claimAllMut.mutate(undefined, {
                onSuccess: () => playSound('level_up'),
                onError: () => playSound('damage_dealt'),
              });
            }}
            claimingId={claimMut.isPending ? (claimMut.variables ?? null) : null}
            isClaimingAll={claimAllMut.isPending}
          />
        )}

        {activeTab === 'streak' && (
          <StreakTab streak={streakData ?? null} isLoading={loadingStreak} />
        )}

        {activeTab === 'leaderboard' && <LeaderboardTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 1: Achievements
// ═══════════════════════════════════════════════════════════════

function AchievementsTab({
  achievements, isLoading, claimableCount, onClaim, onClaimAll, claimingId, isClaimingAll,
}: {
  achievements: Achievement[];
  isLoading: boolean;
  claimableCount: number;
  onClaim: (id: number) => void;
  onClaimAll: () => void;
  claimingId: number | null;
  isClaimingAll: boolean;
}) {
  const [catFilter, setCatFilter] = useState<CatFilter>('all');

  // Filter by category
  const filtered = catFilter === 'all'
    ? achievements
    : achievements.filter(a => a.category === catFilter);

  // Sort: claimable > unlocked unclaimed > in-progress (by % desc) > hidden > claimed
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const order = (ach: Achievement) => {
        if (ach.isUnlocked && !ach.isClaimed) return 0;
        if (!ach.isUnlocked && !ach.isHidden && ach.progress > 0) return 1;
        if (!ach.isUnlocked && !ach.isHidden) return 2;
        if (ach.isHidden && !ach.isUnlocked) return 3;
        return 4; // claimed
      };
      const orderDiff = order(a) - order(b);
      if (orderDiff !== 0) return orderDiff;
      // Within same order, sort by progress %
      const pctA = a.conditionValue > 0 ? a.progress / a.conditionValue : 0;
      const pctB = b.conditionValue > 0 ? b.progress / b.conditionValue : 0;
      return pctB - pctA;
    });
  }, [filtered]);

  // Stats
  const totalRewardOgn = achievements.reduce((s, a) => s + a.rewardOgn, 0);
  const titleCount = achievements.filter(a => a.rewardTitle).length;

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      {/* Category filter */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 mb-2">
        {CAT_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setCatFilter(f.key)}
            className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all shrink-0 ${
              f.key === catFilter ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Claim All */}
      {claimableCount >= 2 && (
        <button
          onClick={onClaimAll}
          disabled={isClaimingAll}
          className="w-full mb-3 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          {isClaimingAll ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Dang nhan...
            </span>
          ) : (
            `Nhan Tat Ca (${claimableCount})`
          )}
        </button>
      )}

      {/* Cards */}
      {sorted.length === 0 ? (
        <EmptyState emoji="🏆" text="Chua co thanh tuu" sub="Choi game de mo thanh tuu!" />
      ) : (
        <div className="space-y-2">
          {sorted.map(a => (
            <AchievementCard
              key={a.id}
              achievement={a}
              onClaim={onClaim}
              isClaiming={claimingId === a.id}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {achievements.length > 0 && (
        <div className="text-center mt-4 py-3 text-[10px] text-white/30">
          Tong thuong: {totalRewardOgn.toLocaleString()} OGN + {titleCount} danh hieu
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 2: Login Streak
// ═══════════════════════════════════════════════════════════════

function StreakTab({ streak, isLoading }: { streak: import('../types/achievement.types').LoginStreak | null; isLoading: boolean }) {
  if (isLoading) return <LoadingSpinner />;
  if (!streak) return <EmptyState emoji="📅" text="Dang nhap hang ngay" sub="He thong chua san sang" />;

  return <LoginStreakCalendar streak={streak} />;
}

// ═══════════════════════════════════════════════════════════════
// Tab 3: Combo Leaderboard
// ═══════════════════════════════════════════════════════════════

function LeaderboardTab() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const { data: leaderboard, isLoading } = useComboLeaderboard(period);
  const { data: myRank } = useMyComboRank(period);

  return (
    <>
      {/* Period tabs */}
      <div className="flex gap-1.5 mb-3">
        {PERIOD_TABS.map(p => (
          <button
            key={p.key}
            onClick={() => { setPeriod(p.key); playSound('ui_tab'); }}
            className={`flex-1 py-2 rounded-full text-[11px] font-bold transition-all ${
              p.key === period ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/40'
            }`}
            style={p.key === period ? { boxShadow: '0 4px 12px rgba(245,158,11,0.3)' } : undefined}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* My rank (sticky) */}
      {myRank && (
        <div className="mb-3">
          <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold mb-1 px-1">Hang cua ban</div>
          <LeaderboardRow entry={myRank} isMe />
        </div>
      )}

      {!myRank && !isLoading && (
        <div
          className="rounded-xl p-3 mb-3 text-center text-[11px] text-white/40"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          Chua co du lieu — danh boss de len bang!
        </div>
      )}

      {/* Leaderboard list */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !leaderboard || leaderboard.length === 0 ? (
        <EmptyState emoji="🥇" text="Chua co du lieu" sub="Danh boss de len bang xep hang!" />
      ) : (
        <div className="space-y-1.5">
          {leaderboard.map(entry => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              isMe={myRank?.userId === entry.userId}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Shared helpers
// ═══════════════════════════════════════════════════════════════

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ emoji, text, sub }: { emoji: string; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-3">{emoji}</span>
      <p className="text-white/50 font-medium">{text}</p>
      <p className="text-white/30 text-sm mt-1">{sub}</p>
    </div>
  );
}
