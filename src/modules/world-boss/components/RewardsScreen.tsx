import { useState, useEffect, useRef } from 'react';
import { useWorldBossRewards, useWorldBossHistoryLeaderboard } from '../hooks/useWorldBossHistory';
import { FullLeaderboard } from './FullLeaderboard';
import { BottomDrawer } from './BottomDrawer';

interface RewardsScreenProps {
  eventId: string;
  bossName: string;
  bossElement?: string;
  difficulty?: string;
  status?: string;
  onClose: () => void;
}

const TIER_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  S: { label: 'MVP',      color: 'text-yellow-300', bgColor: 'bg-yellow-600/30 border-yellow-500', icon: '👑' },
  A: { label: 'Hạng A',  color: 'text-purple-300', bgColor: 'bg-purple-600/30 border-purple-500', icon: '🏅' },
  B: { label: 'Hạng B',  color: 'text-blue-300',   bgColor: 'bg-blue-600/30 border-blue-500',     icon: '🎖️' },
  C: { label: 'Hạng C',  color: 'text-green-300',  bgColor: 'bg-green-600/30 border-green-500',   icon: '🏷️' },
  D: { label: 'Tham gia', color: 'text-gray-300',  bgColor: 'bg-gray-600/30 border-gray-500',     icon: '📋' },
};

function useCountUp(target: number, duration = 1000): number {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (target <= 0) { setCurrent(0); return; }
    const start = Date.now();
    let rafId: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(target * eased));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return current;
}

function RewardNumbers({ xpAmount, ognAmount }: { xpAmount: number; ognAmount: number }) {
  const xpDisplay = useCountUp(xpAmount, 1200);
  const ognDisplay = useCountUp(ognAmount, 1500);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span>✨</span>
        <span className="text-gray-400">XP:</span>
        <span className="text-green-400 font-bold text-base">+{xpDisplay.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span>🪙</span>
        <span className="text-gray-400">OGN:</span>
        <span className="text-yellow-400 font-bold text-base">+{ognDisplay.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function RewardsScreen({ eventId, bossName, difficulty, status, onClose }: RewardsScreenProps) {
  const { data: rewardsData, isLoading } = useWorldBossRewards(eventId);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { data: lbData } = useWorldBossHistoryLeaderboard(showLeaderboard ? eventId : null);

  const isDefeated = status === 'defeated';
  const reward = rewardsData?.rewards?.[0];
  const participation = rewardsData?.participation;
  const tier = reward?.rewardTier ?? 'D';
  const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG['D'];
  const isMVP = tier === 'S';

  const DIFFICULTY_LABELS: Record<string, string> = {
    normal: 'NORMAL', hard: 'HARD', extreme: 'EXTREME', catastrophic: 'CATASTROPHIC',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col overflow-y-auto">
      <div className="flex flex-col items-center px-4 py-8 gap-4 min-h-full">

        {/* Title */}
        <div className="text-center">
          {isDefeated ? (
            <h1 className="text-2xl font-bold text-yellow-400">⚔️ CHIẾN THẮNG!</h1>
          ) : (
            <h1 className="text-2xl font-bold text-gray-400">⏰ Boss đã biến mất</h1>
          )}
          <p className="text-white font-semibold mt-1">{bossName}</p>
          {difficulty && (
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
              ⭐ {DIFFICULTY_LABELS[difficulty] ?? difficulty.toUpperCase()}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 mt-8">
            <div className="animate-spin w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full" />
            <span>Đang tải kết quả...</span>
          </div>
        ) : !participation ? (
          /* No participation */
          <div className="bg-gray-800 rounded-2xl p-6 text-center w-full max-w-sm">
            <div className="text-3xl mb-3">😶</div>
            <p className="text-gray-300 font-medium">Bạn không tham gia trận này</p>
            <p className="text-gray-500 text-sm mt-1">Hãy tấn công boss lần sau để nhận thưởng!</p>
          </div>
        ) : (
          <>
            {/* Tier badge */}
            <div
              className={`w-full max-w-sm rounded-2xl border-2 p-5 text-center ${tierCfg.bgColor} ${
                isMVP ? 'wb-mvp-glow' : ''
              }`}
            >
              <div className="text-4xl mb-2">{tierCfg.icon}</div>
              <div className={`text-2xl font-black ${tierCfg.color}`}>
                {isMVP ? '👑 MVP — Chiến binh xuất sắc nhất!' : tierCfg.label}
              </div>
              <div className="text-gray-400 text-sm mt-2">
                Xếp hạng <span className="text-white font-bold">#{participation.rank}</span>
              </div>
              <div className="text-gray-400 text-sm mt-1">
                Tổng damage:{' '}
                <span className="text-yellow-400 font-bold">
                  {participation.totalDamage.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Rewards */}
            <div className="bg-gray-800 rounded-2xl p-5 w-full max-w-sm">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">🎁 Phần thưởng</h3>
              <RewardNumbers
                xpAmount={reward?.xpAmount ?? 0}
                ognAmount={reward?.ognAmount ?? 0}
              />
              {isDefeated && (
                <div className="mt-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-3 py-2 text-xs text-yellow-400">
                  🎁 ×1.5 bonus (Boss bị hạ gục!)
                </div>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
          <button
            onClick={() => setShowLeaderboard(true)}
            className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
          >
            🏆 Xem bảng xếp hạng →
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Leaderboard drawer — reuse live leaderboard data if available */}
      <BottomDrawer
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        title={`🏆 ${bossName}`}
      >
        {lbData?.leaderboard && lbData.leaderboard.length > 0 ? (
          <FullLeaderboard
            leaderboard={lbData.leaderboard.map(e => ({
              userId: e.userId,
              damage: e.totalDamage,
            }))}
            currentUserId={null}
          />
        ) : (
          <div className="text-center py-8 text-gray-400">Đang tải...</div>
        )}
      </BottomDrawer>

      <style>{`
        .wb-mvp-glow {
          animation: wbMvpPulse 2s ease-in-out infinite;
        }
        @keyframes wbMvpPulse {
          0%, 100% { box-shadow: 0 0 12px 2px rgba(234, 179, 8, 0.3); }
          50%       { box-shadow: 0 0 24px 6px rgba(234, 179, 8, 0.6); }
        }
      `}</style>
    </div>
  );
}
