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

  return (
    <button
      onClick={() => { if (!isLocked) playSound('ui_click'); onClick(); }}
      disabled={isLocked}
      className={cn(
        'relative flex flex-col items-center gap-1 transition-transform',
        isLocked ? 'opacity-70 cursor-not-allowed' : 'active:scale-95 cursor-pointer',
      )}
    >
      {isCompleted ? (
        // ✅ COMPLETED
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-green-500 border-4 border-white shadow-[0_4px_0_#1B5E20] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check
            </span>
          </div>
          {/* Stars below */}
          {boss.bestStars > 0 && (
            <div className="flex justify-center gap-0.5 mt-1">
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
          <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-yellow-400/40 campaign-ping" />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-600 border-4 border-white shadow-[0_6px_0_#0D47A1] flex items-center justify-center">
            {globalBossNumber ? (
              <img src={getBossImageSrc(globalBossNumber)} alt={boss.name} className="w-14 h-14 object-contain drop-shadow-md" />
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
        'font-heading font-bold text-[11px] text-center leading-tight mt-1 max-w-[80px]',
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
