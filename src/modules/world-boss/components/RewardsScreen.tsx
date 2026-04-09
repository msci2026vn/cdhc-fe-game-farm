import { useState, useEffect, useRef } from 'react';
import { useWorldBossRewards, useWorldBossHistoryLeaderboard } from '../hooks/useWorldBossHistory';
import { FullLeaderboard } from './FullLeaderboard';
import { BottomDrawer } from './BottomDrawer';
import { NftCardReveal } from './NftCardReveal';
import { useAuth } from '@/shared/hooks/useAuth';
import { nftApi } from '@/shared/api/api-nft';
import { Trans, useTranslation } from 'react-i18next';

interface RewardsScreenProps {
  eventId: string;
  bossName: string;
  bossElement?: string;
  difficulty?: string;
  status?: string;
  onClose: () => void;
}

const getTierConfig = (tier: string, t: any) => {
  const configs: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
    S: { label: t('world_boss.rewards.mvp'), color: 'text-yellow-300', bgColor: 'bg-yellow-600/30 border-yellow-500', icon: '👑' },
    A: { label: t('world_boss.rewards.tier_a'), color: 'text-purple-300', bgColor: 'bg-purple-600/30 border-purple-500', icon: '🏅' },
    B: { label: t('world_boss.rewards.tier_b'), color: 'text-blue-300', bgColor: 'bg-blue-600/30 border-blue-500', icon: '🎖️' },
    C: { label: t('world_boss.rewards.tier_c'), color: 'text-green-300', bgColor: 'bg-green-600/30 border-green-500', icon: '🏷️' },
    D: { label: t('world_boss.rewards.tier_d'), color: 'text-gray-300', bgColor: 'bg-gray-600/30 border-gray-500', icon: '📋' },
  };
  return configs[tier] ?? configs['D'];
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
        <img src="/icons/ogn_coin.png" alt="coin" className="w-4 h-4 object-contain" />
        <span className="text-gray-400">OGN:</span>
        <span className="text-yellow-400 font-bold text-base">+{ognDisplay.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function RewardsScreen({ eventId, bossName, difficulty, status, onClose }: RewardsScreenProps) {
  const { t } = useTranslation();
  const { data: rewardsData, isLoading } = useWorldBossRewards(eventId);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { data: lbData } = useWorldBossHistoryLeaderboard(showLeaderboard ? eventId : null);

  // NFT notification
  const { data: authData } = useAuth();
  const [showNftNotification, setShowNftNotification] = useState(false);
  const [showNftReveal, setShowNftReveal] = useState(false);
  const nftCheckedRef = useRef(false);

  useEffect(() => {
    if (!eventId || status !== 'defeated' || nftCheckedRef.current) return;
    if (!authData?.user?.id) return;
    nftCheckedRef.current = true;

    const timer = setTimeout(async () => {
      try {
        const card = await nftApi.getCard(eventId);
        if (card) setShowNftNotification(true);
      } catch { /* no NFT for this user */ }
    }, 800);
    return () => clearTimeout(timer);
  }, [eventId, status, authData?.user?.id]);

  const isDefeated = status === 'defeated';
  const reward = rewardsData?.rewards?.[0];
  const participation = rewardsData?.participation;
  const tier = reward?.rewardTier ?? 'D';
  const tierCfg = getTierConfig(tier, t);
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
            <h1 className="text-2xl font-bold text-yellow-400">{t('world_boss.rewards.victory')}</h1>
          ) : (
            <h1 className="text-2xl font-bold text-gray-400">{t('world_boss.rewards.boss_escaped')}</h1>
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
            <span>{t('world_boss.rewards.loading_results')}</span>
          </div>
        ) : (rewardsData === undefined && !isLoading) || !participation ? (
          /* No participation or Error */
          <div className="bg-gray-800 rounded-2xl p-6 text-center w-full max-w-sm">
            <div className="text-3xl mb-3">
              {(rewardsData as any)?.isServerError ? '⚠️' : '😶'}
            </div>
            <p className="text-gray-300 font-medium">
              {(rewardsData as any)?.isServerError 
                ? 'Máy chủ hiện đang bảo trì' 
                : t('world_boss.rewards.not_participated_title')}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {(rewardsData as any)?.isServerError 
                ? 'Thông tin phần thưởng sẽ được cập nhật sau khi server ổn định.' 
                : t('world_boss.rewards.not_participated_desc')}
            </p>
          </div>
        ) : (
          <>
            {/* Tier badge */}
            <div
              className={`w-full max-w-sm rounded-2xl border-2 p-5 text-center ${tierCfg.bgColor} ${isMVP ? 'wb-mvp-glow' : ''
                }`}
            >
              <div className="text-4xl mb-2">{tierCfg.icon}</div>
              <div className={`text-2xl font-black ${tierCfg.color}`}>
                {tierCfg.label}
              </div>
              <div className="text-gray-400 text-sm mt-2">
                <Trans i18nKey="world_boss.rewards.rank_label" values={{ rank: participation.rank }}>
                  Xếp hạng <span className="text-white font-bold">#{participation.rank}</span>
                </Trans>
              </div>
              <div className="text-gray-400 text-sm mt-1">
                {t('world_boss.rewards.total_damage')}
                <span className="text-yellow-400 font-bold">
                  {participation.totalDamage.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Rewards */}
            <div className="bg-gray-800 rounded-2xl p-5 w-full max-w-sm">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('world_boss.rewards.rewards_title')}</h3>
              <RewardNumbers
                xpAmount={reward?.xpAmount ?? 0}
                ognAmount={reward?.ognAmount ?? 0}
              />
              {isDefeated && (
                <div className="mt-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-3 py-2 text-xs text-yellow-400">
                  {t('world_boss.rewards.bonus_msg')}
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
            {t('world_boss.rewards.view_leaderboard')}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
          >
            {t('world_boss.rewards.close')}
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
          <div className="text-center py-8 text-gray-400">{t('world_boss.rewards.loading_leaderboard')}</div>
        )}
      </BottomDrawer>

      {/* NFT Notification Banner */}
      {showNftNotification && (
        <div
          className="fixed bottom-24 left-4 right-4 z-[55] nft-notif-pulse cursor-pointer"
          onClick={() => { setShowNftReveal(true); setShowNftNotification(false); }}
        >
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl px-5 py-4 flex items-center gap-3 border border-indigo-500/40 shadow-lg">
            <span className="text-3xl">🎴</span>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">{t('world_boss.rewards.nft_received')}</p>
              <p className="text-indigo-300 text-xs mt-0.5">{t('world_boss.rewards.nft_open')}</p>
            </div>
            <span className="text-indigo-300 text-lg">→</span>
          </div>
        </div>
      )}

      {/* NFT Card Reveal Modal */}
      {showNftReveal && (
        <NftCardReveal
          eventId={eventId}
          onClose={() => setShowNftReveal(false)}
        />
      )}

      <style>{`
        .wb-mvp-glow {
          animation: wbMvpPulse 2s ease-in-out infinite;
        }
        @keyframes wbMvpPulse {
          0%, 100% { box-shadow: 0 0 12px 2px rgba(234, 179, 8, 0.3); }
          50%       { box-shadow: 0 0 24px 6px rgba(234, 179, 8, 0.6); }
        }
        .nft-notif-pulse {
          animation: nftNotifPulse 1.5s ease-in-out infinite;
        }
        @keyframes nftNotifPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
