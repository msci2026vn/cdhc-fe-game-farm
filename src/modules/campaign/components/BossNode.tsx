import { cn } from '@/lib/utils';
import type { ZoneBoss } from '../types/campaign.types';
import type { StageState } from '../types/campaign.types';
import { getBossImageSrc } from '../data/bossSpritePaths';
import { playSound } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

interface BossNodeProps {
  boss: ZoneBoss;
  state: StageState;
  globalBossNumber?: number;
  onClick: () => void;
}

/**
 * BossNode — the final boss of a zone.
 * Larger node with crown, stone platform, and BOSS badge.
 */
export default function BossNode({ boss, state, globalBossNumber, onClick }: BossNodeProps) {
  const { t } = useTranslation();
  const isCompleted = state === 'completed';
  const isCurrent = state === 'current';
  const isLocked = state === 'locked';

  const stageIndex = globalBossNumber ? (((globalBossNumber - 1) % 4) + 1) : undefined;
  const COMPLETED_ICON_BY_STAGE: Record<number, string> = {
    1: '/assets/map/campaign_region_1/baby_bedbugs.png',
    2: '/assets/map/campaign_region_1/soldier_aphids.png',
    3: '/assets/map/campaign_region_1/winged_aphids.png',
    4: '/assets/map/campaign_region_1/Queen_aphid.png',
  };
  const LOCKED_ICON_BY_STAGE: Record<number, string> = {
    4: '/assets/map/campaign_region_1/Queen_aphid_lock.png',
  };
  const completedIcon = stageIndex ? COMPLETED_ICON_BY_STAGE[stageIndex] : undefined;
  const lockedIcon = stageIndex ? LOCKED_ICON_BY_STAGE[stageIndex] : undefined;

  return (
    <button
      onClick={() => { if (!isLocked) playSound('boss_select'); onClick(); }}
      disabled={isLocked}
      className={cn(
        'relative flex flex-col items-center transition-transform',
        isLocked ? 'active:scale-95 cursor-not-allowed' : 'active:scale-95 cursor-pointer',
      )}
    >
      {/* Crown icon on top */}
      {!isLocked && (
        <span className="text-2xl mb-1 drop-shadow-md animate-float-leaf">👑</span>
      )}

      {/* Boss main node */}
      <div className="relative">
        <div className={cn(
          'w-[150px] h-[150px] flex items-center justify-center',
        )}>
          {(isCompleted || isCurrent) ? (
            <div className="relative">
              {completedIcon ? (
                <img src={completedIcon} alt={boss.name} className="w-[150px] h-[150px] object-contain drop-shadow-2xl z-10" />
              ) : (
                <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check
                </span>
              )}
              {isCompleted && completedIcon && (
                <span className="absolute inset-0 flex items-center justify-center translate-y-1 z-20">
                  <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check
                  </span>
                </span>
              )}
            </div>
          ) : isLocked ? (
            <div className="relative flex items-center justify-center">
              {lockedIcon ? (
                <img src={lockedIcon} alt="Locked Boss" className="w-[150px] h-[150px] object-contain" />
              ) : (
                <span className="text-4xl opacity-30">{boss.emoji || '🔒'}</span>
              )}
              <span className="material-symbols-outlined text-white/90 text-3xl absolute inset-0 flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">lock</span>
            </div>
          ) : globalBossNumber ? (
            <img src={getBossImageSrc(globalBossNumber)} alt={boss.name} className="w-[135px] h-[135px] object-contain drop-shadow-lg" />
          ) : (
            <span className="text-5xl drop-shadow-lg">{boss.emoji}</span>
          )}
        </div>

        {/* GO! badge for current boss */}
        {isCurrent && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 animate-bounce z-20">
            <img 
              src="/assets/map/GO!.png" 
              alt="GO!" 
              className="w-full h-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            />
          </div>
        )}
      </div>

      {/* Boss name + stars */}
      <p className={cn(
        'font-game font-black text-sm text-center mt-1 max-w-[120px] drop-shadow-md',
        isCompleted ? 'text-green-300' : isCurrent ? 'text-white' : 'text-white/40',
      )}>
        {boss.name}
      </p>

      {/* Lock reason */}
      {isLocked && boss.lockReason && (
        <p className="text-[9px] text-white/50 font-medium text-center max-w-[100px] leading-tight mt-0.5">
          {boss.lockReason}
        </p>
      )}

      {isCompleted && boss.bestStars > 0 && (
        <div className="flex justify-center gap-0.5 mt-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={cn('text-sm', i < boss.bestStars ? 'text-yellow-400 drop-shadow-md' : 'opacity-40 grayscale')}>
              ⭐
            </span>
          ))}
        </div>
      )}

      {isCurrent && (
        <p className="text-[10px] text-[#ffc300] font-black mt-0.5 drop-shadow">
          {t('campaign.ui.recommended_level', { level: boss.unlockLevel })}
        </p>
      )}
    </button>
  );
}
