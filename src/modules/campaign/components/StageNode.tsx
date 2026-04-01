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
  const LOCKED_ICON_BY_STAGE: Record<number, string> = {
    1: '/assets/map/campaign_region_1/baby_bedbugs_lock.png',
    2: '/assets/map/campaign_region_1/soldier_aphids_lock.png',
    3: '/assets/map/campaign_region_1/winged_aphids_lock.png',
  };
  const completedIcon = stageIndex ? COMPLETED_ICON_BY_STAGE[stageIndex] : undefined;
  const lockedIcon = stageIndex ? LOCKED_ICON_BY_STAGE[stageIndex] : undefined;

  const isStage1 = stageIndex === 1;
  const isStage3 = stageIndex === 3;

  // Rệp Con (1) is smallest, Rệp Cánh (3) is biggest
  const nodeSize = isStage3
    ? { container: 'w-28 h-28', image: 'w-24 h-24' }
    : isStage1
      ? { container: 'w-16 h-16', image: 'w-13 h-13' }
      : { container: 'w-24 h-24', image: 'w-20 h-20' };

  return (
    <button
      onClick={() => { if (!isLocked) playSound('ui_click'); onClick(); }}
      disabled={isLocked}
      className={cn(
        'relative flex flex-col items-center transition-transform',
        isStage1 ? 'gap-1' : isStage3 ? 'gap-0' : 'gap-0.5',
        isLocked ? 'active:scale-90 cursor-not-allowed' : 'active:scale-95 cursor-pointer',
      )}
    >
      {isCompleted ? (
        // ✅ COMPLETED (show map icon only)
        <div className="relative">
          <div className={`relative ${nodeSize.container} flex items-center justify-center`}>
            {completedIcon ? (
              <img src={completedIcon} alt={boss.name} className={`${nodeSize.image} object-contain`} />
            ) : (
              <span className="material-symbols-outlined text-white text-3xl transform translate-y-3" style={{ fontVariationSettings: "'FILL' 1" }}>
                check
              </span>
            )}
            {completedIcon && (
              <span className="absolute inset-0 flex items-center justify-center translate-y-2">
                <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check
                </span>
              </span>
            )}
          </div>
          {/* Stars below */}
          {boss.bestStars > 0 && (
            <div className={cn("flex justify-center gap-0.5", isStage1 ? "mt-4" : isStage3 ? "-mt-4" : "mt-0.5")}>
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
          <div className={`absolute inset-0 ${nodeSize.container} rounded-full bg-blue-400/40 campaign-ping`} />
          <div className={`flex items-center justify-center ${nodeSize.container}`}>
            {globalBossNumber ? (
              <img
                src={completedIcon || getBossImageSrc(globalBossNumber)}
                alt={boss.name}
                className={cn(
                  nodeSize.image,
                  "object-contain drop-shadow-2xl z-10"
                )}
              />
            ) : (
              <span className="text-3xl drop-shadow-lg z-10">{boss.emoji}</span>
            )}
          </div>
          {/* GO! badge */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 animate-bounce z-20">
            <img
              src="/assets/map/GO!.png"
              alt="GO!"
              className="w-full h-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            />
          </div>
        </div>
      ) : (
        // 🔒 LOCKED
        <div className="relative">
          <div className={`relative ${nodeSize.container} flex items-center justify-center grayscale opacity-80 contrast-75 brightness-75`}>
            {lockedIcon ? (
              <img src={lockedIcon} alt="Locked" className={`${nodeSize.image} object-contain`} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-400 border-4 border-gray-300 shadow-[0_4px_0_#616161] flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">lock</span>
              </div>
            )}

            {/* Lock reason or padlock overlay */}
            <div className="absolute inset-0 flex items-center justify-center translate-y-1">
              <span className="material-symbols-outlined text-white/90 text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">lock</span>
            </div>
          </div>
        </div>
      )}

      {/* Boss name */}
      <p className={cn(
        'font-game font-black text-[11px] text-center leading-tight max-w-[90px] drop-shadow-md',
        isStage1 ? 'mt-0' : isStage3 ? 'mt-0' : 'mt-0.5',
        isCompleted ? 'text-green-300' : isCurrent ? 'text-white' : 'text-white/40',
      )}>
        {boss.name}
      </p>

      {/* Recommended level or Lock reason */}
      {isCurrent ? (
        <p className="text-[9px] text-[#ffc300] font-black text-center mt-0.5 drop-shadow">
          Lv. {boss.unlockLevel}
        </p>
      ) : isLocked && boss.lockReason && (
        <p className="text-[9px] text-white/50 font-medium text-center max-w-[90px] leading-tight mt-0.5">
          {boss.lockReason}
        </p>
      )}
    </button>
  );
}
