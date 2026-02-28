// ═══════════════════════════════════════════════════════════════
// MissionScreen — Daily/Weekly missions with claim + reset timer
// Route: /campaign/missions
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDailyMissions, useWeeklyMissions, useClaimMission, useClaimAllMissions } from '@/shared/api/api-missions';
import MissionCard from '../components/MissionCard';
import type { PlayerMission } from '../types/mission.types';
import { playSound } from '@/shared/audio';

type TabKey = 'daily' | 'weekly';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'daily', label: 'Hang Ngay', icon: '\ud83d\udcc5' },
  { key: 'weekly', label: 'Hang Tuan', icon: '\ud83d\udcc6' },
];

export default function MissionScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('daily');

  const { data: dailyMissions, isLoading: loadingDaily } = useDailyMissions();
  const { data: weeklyMissions, isLoading: loadingWeekly } = useWeeklyMissions();
  const claimMutation = useClaimMission();
  const claimAllMutation = useClaimAllMissions();

  const [claimingId, setClaimingId] = useState<number | null>(null);

  // Current tab data
  const missions = activeTab === 'daily' ? dailyMissions : weeklyMissions;
  const isLoading = activeTab === 'daily' ? loadingDaily : loadingWeekly;

  // Sort: claimable first → in-progress → claimed last
  const sortedMissions = useMemo(() => {
    if (!missions) return [];
    return [...missions].sort((a, b) => {
      const order = (m: PlayerMission) => {
        if (m.isCompleted && !m.isClaimed) return 0; // claimable first
        if (!m.isCompleted) return 1;                 // in-progress
        return 2;                                      // claimed last
      };
      return order(a) - order(b);
    });
  }, [missions]);

  // Stats
  const claimable = sortedMissions.filter(m => m.isCompleted && !m.isClaimed);
  const totalRewardOgn = sortedMissions.reduce((s, m) => s + m.rewardOgn, 0);
  const claimedOgn = sortedMissions.filter(m => m.isClaimed).reduce((s, m) => s + m.rewardOgn, 0);

  // Claim single
  const handleClaim = async (missionId: number) => {
    setClaimingId(missionId);
    try {
      await claimMutation.mutateAsync(missionId);
      playSound('coin_collect');
    } catch {
      playSound('damage_dealt');
    } finally {
      setClaimingId(null);
    }
  };

  // Claim all
  const handleClaimAll = async () => {
    try {
      await claimAllMutation.mutateAsync();
      playSound('level_up');
    } catch {
      playSound('damage_dealt');
    }
  };

  // Reset timer
  const resetLabel = activeTab === 'daily' ? 'Reset daily' : 'Reset weekly';

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
          <h1 className="font-heading font-bold text-lg text-white">Nhiem Vu</h1>
          <div className="w-10" />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1.5 mt-3">
          {TABS.map(tab => {
            const tabMissions = tab.key === 'daily' ? dailyMissions : weeklyMissions;
            const tabClaimable = (tabMissions ?? []).filter(m => m.isCompleted && !m.isClaimed).length;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); playSound('ui_tab'); }}
                className={`flex-1 py-2 rounded-full text-[12px] font-bold transition-all relative ${
                  tab.key === activeTab
                    ? 'bg-blue-600 text-white'
                    : 'text-white/50'
                }`}
                style={tab.key !== activeTab ? { background: 'rgba(255,255,255,0.05)' } : { boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
              >
                {tab.icon} {tab.label}
                {tabClaimable > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {tabClaimable}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset timer */}
      <div className="flex-shrink-0 px-4 py-2">
        <ResetTimer type={activeTab} />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-28 scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : sortedMissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-3">📋</span>
            <p className="text-white/50 font-medium">Chua co nhiem vu</p>
            <p className="text-white/30 text-sm mt-1">Quay lai sau!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedMissions.map(m => (
              <MissionCard
                key={m.missionId}
                mission={m}
                onClaim={handleClaim}
                isClaiming={claimingId === m.missionId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom summary + Claim All */}
      {sortedMissions.length > 0 && (
        <div className="flex-shrink-0 px-4 pb-safe">
          <div
            className="rounded-xl p-3 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-[11px]">
              <span className="text-white/40">Tong: </span>
              <span className="font-bold text-yellow-400">{totalRewardOgn} OGN</span>
              <span className="text-white/20 mx-1.5">|</span>
              <span className="text-white/40">Da nhan: </span>
              <span className="font-bold text-green-400">{claimedOgn} OGN</span>
            </div>

            {claimable.length >= 2 && (
              <button
                onClick={handleClaimAll}
                disabled={claimAllMutation.isPending}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white active:scale-95 transition-all"
              >
                {claimAllMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                ) : (
                  `Nhan Tat Ca (${claimable.length})`
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Reset Timer — Countdown to daily midnight / weekly Monday (VN UTC+7)
// ═══════════════════════════════════════════════════════════════

function ResetTimer({ type }: { type: 'daily' | 'weekly' }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      // VN time = UTC + 7
      const vnNow = new Date(now.getTime() + 7 * 3600_000);

      let target: Date;
      if (type === 'daily') {
        // Next midnight VN
        target = new Date(vnNow);
        target.setUTCHours(0, 0, 0, 0);
        target.setUTCDate(target.getUTCDate() + 1);
      } else {
        // Next Monday 00:00 VN
        target = new Date(vnNow);
        target.setUTCHours(0, 0, 0, 0);
        const dayOfWeek = target.getUTCDay(); // 0=Sun
        const daysUntilMon = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek;
        target.setUTCDate(target.getUTCDate() + daysUntilMon);
      }

      // Convert target back from VN to UTC for diff
      const targetUtc = new Date(target.getTime() - 7 * 3600_000);
      const diff = Math.max(0, targetUtc.getTime() - now.getTime());

      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };

    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [type]);

  return (
    <div className="flex items-center justify-center gap-2 py-1">
      <span className="text-[10px] text-white/30">
        {type === 'daily' ? 'Reset hang ngay' : 'Reset hang tuan'}:
      </span>
      <span className="text-[12px] font-mono font-bold text-amber-400">{remaining}</span>
    </div>
  );
}
