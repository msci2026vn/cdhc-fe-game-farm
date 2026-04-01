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
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(116,185,255,0.2)', color: '#74b9ff', border: '1px solid rgba(116,185,255,0.3)' }}>
          🛡️ DEF {def}
        </span>
      )}
      {freq > 1 && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(253,121,168,0.2)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.3)' }}>
          ⚡ {t('campaign.ui.hits', { count: freq })}
        </span>
      )}
      {enrageLevel > 0 && (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${enrageLevel >= 3 ? 'animate-pulse' : ''}`}
          style={{
            background: enrageLevel >= 3 ? 'rgba(231,76,60,0.3)' : enrageLevel >= 2 ? 'rgba(243,156,18,0.2)' : 'rgba(253,203,110,0.2)',
            color: enrageLevel >= 3 ? '#ff6b6b' : enrageLevel >= 2 ? '#f39c12' : '#fdcb6e',
            border: `1px solid ${enrageLevel >= 3 ? 'rgba(231,76,60,0.4)' : enrageLevel >= 2 ? 'rgba(243,156,18,0.3)' : 'rgba(253,203,110,0.3)'}`,
          }}>
          {enrageLevel >= 3 ? '💀' : enrageLevel >= 2 ? '🔥' : '⚡'} +{enrageLevel * 10}% ATK
        </span>
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
        <span key={`${b.type}-${i}`} className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
          style={{
            background: b.type === 'shield' ? 'rgba(116,185,255,0.3)' : 'rgba(108,92,231,0.3)',
            color: b.type === 'shield' ? '#74b9ff' : '#a29bfe',
            border: `1px solid ${b.type === 'shield' ? 'rgba(116,185,255,0.4)' : 'rgba(108,92,231,0.4)'}`,
          }}>
          {b.icon} {b.label} {b.remainingSec}s
        </span>
      ))}
    </div>
  );
}
