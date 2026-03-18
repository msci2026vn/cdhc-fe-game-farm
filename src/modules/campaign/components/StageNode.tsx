import { cn } from '@/lib/utils';
import type { ZoneBoss } from '../types/campaign.types';
import type { StageState } from '../types/campaign.types';
import { getBossImageSrc } from '../data/bossSpritePaths';
import { playSound } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

interface StageNodeProps {
  boss: ZoneBoss;
  state: StageState;
  globalBossNumber?: number;
  onClick: () => void;
}

/**
 * StageNode — represents a single stage (minion/elite) within a zone.
 * 3 states: completed (green circle), current (blue square + FIGHT!), locked (gray circle)
 */
export default function StageNode({ boss, state, globalBossNumber, onClick }: StageNodeProps) {
  const { t } = useTranslation();
  const isCompleted = state === 'completed';
  const isCurrent = state === 'current';
  const isLocked = state === 'locked';

  // Use the map node images for the 3 non-boss stages (1-3, repeating each zone)
  const stageIndex = globalBossNumber ? (((globalBossNumber - 1) % 4) + 1) : undefined;
  const COMPLETED_ICON_BY_STAGE: Record<number, string> = {
    1: '/assets/map/campaign_region_1/baby_bedbugs.png',
    2: '/assets/map/campaign_region_1/soldier_aphids.png',
    3: '/assets/map/campaign_region_1/winged_aphids.png',
  };
  const completedIcon = stageIndex ? COMPLETED_ICON_BY_STAGE[stageIndex] : undefined;

  // Make stage 3 (winged aphid) bigger
  const isStage3 = stageIndex === 3;
  const nodeSize = isStage3 ? { container: 'w-32 h-32', image: 'w-28 h-28' } : { container: 'w-24 h-24', image: 'w-20 h-20' };

  return (
    <button
      onClick={() => { if (!isLocked) playSound('ui_click'); onClick(); }}
      disabled={isLocked}
      className={cn(
        'relative flex flex-col items-center gap-0.5 transition-transform',
        isLocked ? 'opacity-70 cursor-not-allowed' : 'active:scale-95 cursor-pointer',
      )}
    >
      {isCompleted ? (
        // ✅ COMPLETED (show map icon only)
        <div className="relative">
          <div className={`relative ${nodeSize.container} flex items-center justify-center overflow-hidden`}>
            {completedIcon ? (
              <img src={completedIcon} alt={boss.name} className={`${nodeSize.image} object-contain`} />
            ) : (
              <span className="material-symbols-outlined text-white text-4xl transform translate-y-3" style={{ fontVariationSettings: "'FILL' 1" }}>
                check
              </span>
            )}
            {completedIcon && (
              <span className="absolute inset-0 flex items-center justify-center translate-y-2">
                <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check
                </span>
              </span>
            )}
          </div>
          {/* Stars below */}
          {boss.bestStars > 0 && (
            <div className="flex justify-center gap-0.5 mt-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={cn('text-sm', i < boss.bestStars ? 'text-yellow-400' : 'text-white/20')}>
                  ⭐
                </span>
              ))}
            </div>
          )}
        </div>
      ) : isCurrent ? (
        // ⚔️ CURRENT — FIGHT!
        <div className="relative">
          {/* Ping animation */}
          <div className={`absolute inset-0 ${nodeSize.container} rounded-2xl bg-yellow-400/40 campaign-ping`} />
          <div className={`rounded-2xl bg-gradient-to-b from-blue-400 to-blue-600 border-4 border-white shadow-[0_6px_0_#0D47A1] flex items-center justify-center ${nodeSize.container}`}>
            {globalBossNumber ? (
              <img src={getBossImageSrc(globalBossNumber)} alt={boss.name} className={`${nodeSize.image} object-contain drop-shadow-md`} />
            ) : (
              <span className="text-3xl drop-shadow-lg">{boss.emoji}</span>
            )}
          </div>
          {/* FIGHT! badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-white shadow-md animate-bounce">
            {t('campaign.ui.fight')}
          </div>
        </div>
      ) : (
        // 🔒 LOCKED
        <div className="w-14 h-14 rounded-full bg-gray-400 border-4 border-gray-300 shadow-[0_4px_0_#616161] flex items-center justify-center grayscale opacity-80">
          <span className="material-symbols-outlined text-white text-xl">lock</span>
        </div>
      )}

      {/* Boss name */}
      <p className={cn(
        'font-heading font-bold text-[11px] text-center leading-tight mt-0.5 max-w-[80px]',
        isCompleted ? 'text-green-200' : isCurrent ? 'text-white' : 'text-white/40',
      )}>
        {boss.name}
      </p>

      {/* Lock reason */}
      {isLocked && boss.lockReason && (
        <p className="text-[9px] text-yellow-400/60 text-center max-w-[90px] leading-tight mt-0.5">
          {boss.lockReason}
        </p>
      )}
    </button>
  );
}
