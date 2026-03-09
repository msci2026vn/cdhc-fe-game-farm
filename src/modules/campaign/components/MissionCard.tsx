// ═══════════════════════════════════════════════════════════════
// MissionCard — 3 states: in-progress, claimable, claimed
// ═══════════════════════════════════════════════════════════════

import type { PlayerMission } from '../types/mission.types';
import { getMissionIcon } from '../types/mission.types';
import { useTranslation } from 'react-i18next';

interface MissionCardProps {
  mission: PlayerMission;
  onClaim: (missionId: number) => void;
  isClaiming: boolean;
}

export default function MissionCard({ mission, onClaim, isClaiming }: MissionCardProps) {
  const { t } = useTranslation();
  const icon = getMissionIcon(mission.missionKey);
  const progress = Math.min(mission.currentProgress, mission.targetValue);
  const progressPct = (progress / mission.targetValue) * 100;
  const isClaimable = mission.isCompleted && !mission.isClaimed;
  const isClaimed = mission.isClaimed;

  return (
    <div
      className={`rounded-xl p-3 transition-all ${isClaimed ? 'opacity-50' : isClaimable ? 'ring-2 ring-amber-500/50' : ''
        }`}
      style={{
        background: isClaimable
          ? 'rgba(245,158,11,0.08)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isClaimable ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {/* Top row: icon + name + rewards */}
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-xl shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-bold text-white block truncate">{mission.name}</span>
          {mission.description && (
            <span className="text-[10px] text-white/40 block truncate">{mission.description}</span>
          )}
        </div>

        {/* Status / Claim */}
        {isClaimed ? (
          <span className="text-[10px] font-bold text-green-400/60 shrink-0 flex items-center gap-1">
            ✅ {t('campaign.ui.claimed')}
          </span>
        ) : isClaimable ? (
          <button
            onClick={() => onClaim(mission.missionId)}
            disabled={isClaiming}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 active:scale-95 transition-all shrink-0"
          >
            {isClaiming ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : (
              `${t('campaign.ui.claim')} 🎁`
            )}
          </button>
        ) : (
          <div className="text-right shrink-0">
            <div className="text-[10px] font-bold text-yellow-400">{mission.rewardOgn} OGN</div>
            <div className="text-[9px] text-blue-400">{mission.rewardXp} XP</div>
          </div>
        )}
      </div>

      {/* Progress bar (only when not claimed) */}
      {!isClaimed && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: isClaimable
                  ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                  : 'linear-gradient(90deg, #3b82f6, #6366f1)',
              }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-white/50 shrink-0 w-10 text-right">
            {progress}/{mission.targetValue}
          </span>
        </div>
      )}

      {/* Fragment reward (weekly) */}
      {mission.rewardFragments && !isClaimed && (
        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-purple-400">
          <span>🧩</span>
          <span>{mission.rewardFragments.name} x{mission.rewardFragments.amount}</span>
        </div>
      )}
    </div>
  );
}
