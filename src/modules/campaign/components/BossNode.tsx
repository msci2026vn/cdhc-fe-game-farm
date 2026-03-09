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

  return (
    <button
      onClick={() => { if (!isLocked) playSound('boss_select'); onClick(); }}
      disabled={isLocked}
      className={cn(
        'relative flex flex-col items-center transition-transform',
        isLocked ? 'opacity-60 cursor-not-allowed' : 'active:scale-95 cursor-pointer',
      )}
    >
      {/* Crown icon on top */}
      {!isLocked && (
        <span className="text-2xl mb-1 drop-shadow-md animate-float-leaf">👑</span>
      )}

      {/* Boss main node */}
      <div className="relative">
        {/* Ping for current */}
        {isCurrent && (
          <div className="absolute inset-0 w-24 h-24 rounded-3xl bg-red-400/40 campaign-ping" />
        )}

        <div className={cn(
          'w-24 h-24 rounded-3xl border-4 flex items-center justify-center',
          isCompleted
            ? 'bg-gradient-to-b from-green-500 to-green-700 border-yellow-400 shadow-[0_8px_0_#1B5E20]'
            : isCurrent
              ? 'bg-gradient-to-b from-red-500 to-red-700 border-yellow-400 shadow-[0_8px_0_#B71C1C]'
              : 'bg-gradient-to-b from-gray-500 to-gray-700 border-gray-400 shadow-[0_8px_0_#424242] grayscale',
        )}>
          {isCompleted ? (
            <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check
            </span>
          ) : isLocked ? (
            <div className="relative flex items-center justify-center">
              <span className="text-4xl opacity-30">{boss.emoji || '🔒'}</span>
              <span className="material-symbols-outlined text-white/80 text-lg absolute -bottom-1 -right-1 drop-shadow">lock</span>
            </div>
          ) : globalBossNumber ? (
            <img src={getBossImageSrc(globalBossNumber)} alt={boss.name} className="w-16 h-16 object-contain drop-shadow-lg" />
          ) : (
            <span className="text-5xl drop-shadow-lg">{boss.emoji}</span>
          )}
        </div>

        {/* BOSS badge */}
        {!isLocked && (
          <div className={cn(
            'absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black px-3 py-0.5 rounded-full border-2 border-white shadow-md uppercase tracking-wider',
            isCompleted ? 'bg-green-600 text-white' : 'bg-red-600 text-white animate-bounce',
          )}>
            {t('campaign.boss.badge')}
          </div>
        )}
      </div>

      {/* Stone platform */}
      <div className="w-32 h-6 bg-stone-600 rounded-[50%] mt-2 shadow-inner border border-stone-500" />

      {/* Boss name + stars */}
      <p className={cn(
        'font-heading font-bold text-xs text-center mt-1.5',
        isCompleted ? 'text-green-200' : isCurrent ? 'text-white' : 'text-white/40',
      )}>
        {boss.name}
      </p>

      {/* Lock reason */}
      {isLocked && boss.lockReason && (
        <p className="text-[9px] text-yellow-400/60 text-center max-w-[100px] leading-tight mt-0.5">
          {boss.lockReason}
        </p>
      )}

      {isCompleted && boss.bestStars > 0 && (
        <div className="flex justify-center gap-0.5 mt-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={cn('text-sm', i < boss.bestStars ? 'text-yellow-400' : 'text-white/20')}>
              ⭐
            </span>
          ))}
        </div>
      )}

      {isCurrent && (
        <p className="text-[10px] text-yellow-300 font-bold mt-0.5">
          {t('campaign.ui.recommended_level', { level: boss.unlockLevel })}
        </p>
      )}
    </button>
  );
}
