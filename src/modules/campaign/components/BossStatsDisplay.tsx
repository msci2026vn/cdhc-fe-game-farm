// ═══════════════════════════════════════════════════════════════
// BossStatsDisplay — DEF/freq/enrage badges
// ═══════════════════════════════════════════════════════════════

import type { ActiveBossBuff } from '@/shared/match3/combat.types';
import { useTranslation } from 'react-i18next';

interface StatsProps {
  def: number;
  freq: number;
  enrageLevel: number;
}

export function BossStatsBadges({ def, freq, enrageLevel }: StatsProps) {
  const { t } = useTranslation();
  if (def <= 0 && freq <= 1 && enrageLevel <= 0) return null;
  return (
    <div className="z-10 flex justify-center gap-1.5 mt-1 flex-wrap">
      {def > 0 && (
        <div className="relative px-4 py-2 h-[36px] min-w-[90px] flex items-center justify-center">
          <img src="/assets/battle/frame_orange_leaves.png" alt="Frame" className="absolute inset-0 w-full h-full object-fill pointer-events-none" />
          <span className="relative z-10 text-[10px] font-black uppercase text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            🛡️ DEF {def}
          </span>
        </div>
      )}
      {freq > 1 && (
        <div className="relative px-4 py-2 h-[36px] min-w-[90px] flex items-center justify-center">
          <img src="/assets/battle/frame_orange_leaves.png" alt="Frame" className="absolute inset-0 w-full h-full object-fill pointer-events-none" />
          <span className="relative z-10 text-[10px] font-black uppercase text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            ⚡ {t('campaign.ui.hits', { count: freq })}
          </span>
        </div>
      )}
      {enrageLevel > 0 && (
        <div className={`relative px-5 py-2 h-[36px] min-w-[110px] flex items-center justify-center ${enrageLevel >= 3 ? 'animate-pulse' : ''}`}>
          <img src="/assets/battle/frame_yellow_leaves.png" alt="Frame" className="absolute inset-0 w-full h-full object-fill pointer-events-none" />
          <span className="relative z-10 text-[10px] font-black uppercase text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {enrageLevel >= 3 ? '💀' : enrageLevel >= 2 ? '🔥' : '⚡'} +{enrageLevel * 10}% ATK
          </span>
        </div>
      )}
    </div>
  );
}

interface BossBuffsProps {
  activeBossBuffs: ActiveBossBuff[];
}

export function BossBuffsBadges({ activeBossBuffs }: BossBuffsProps) {
  if (activeBossBuffs.length === 0) return null;
  return (
    <div className="z-10 flex justify-center gap-1.5 mt-1 flex-wrap">
      {activeBossBuffs.map((b, i) => (
        <div key={`${b.type}-${i}`} className="relative px-5 py-2 h-[36px] min-w-[105px] flex items-center justify-center animate-pulse">
          <img src="/assets/battle/frame_green_leaves.png" alt="Frame" className="absolute inset-0 w-full h-full object-fill pointer-events-none" />
          <span className="relative z-10 text-[10px] font-black uppercase text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {b.icon} {b.label} {b.remainingSec}s
          </span>
        </div>
      ))}
    </div>
  );
}
