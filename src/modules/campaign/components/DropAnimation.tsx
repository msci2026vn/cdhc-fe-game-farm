// ═══════════════════════════════════════════════════════════════
// DropAnimation — Post-win fragment drop popup with tier glow
// Shows after campaign boss defeat, before normal BattleResult
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import type { DropResult } from '../types/fragment.types';
import { TIER_CONFIG, ZONE_NAMES } from '../types/fragment.types';
import { playSound } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

interface DropAnimationProps {
  drop: DropResult;
  onClose: () => void;
  isVisible: boolean;
}

export default function DropAnimation({ drop, onClose, isVisible }: DropAnimationProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'enter' | 'card' | 'pity' | 'ready'>('enter');

  useEffect(() => {
    if (!isVisible) return;
    // Animation sequence
    const t1 = setTimeout(() => setPhase('card'), 200);
    const t2 = setTimeout(() => setPhase('pity'), 700);
    const t3 = setTimeout(() => setPhase('ready'), 1200);
    if (drop.dropped) {
      const t4 = setTimeout(() => playSound('star_earn'), 400);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isVisible, drop.dropped]);

  if (!isVisible) return null;

  const hasDrop = drop.dropped && drop.fragment;
  const tier = drop.fragment?.tier ?? 'common';
  const cfg = TIER_CONFIG[tier];
  const pityTotal = drop.pityCounter + drop.guaranteedIn;
  const pityPct = pityTotal > 0 ? Math.round((drop.pityCounter / pityTotal) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        opacity: phase !== 'enter' ? 1 : 0,
        transition: 'opacity 200ms ease-out',
      }}
    >
      <div
        className="w-full max-w-[340px] rounded-2xl p-5 text-center"
        style={{
          background: 'linear-gradient(180deg, rgba(30,30,50,0.95) 0%, rgba(20,20,35,0.98) 100%)',
          border: hasDrop ? `2px solid ${cfg.border}` : '1px solid rgba(255,255,255,0.1)',
          boxShadow: hasDrop ? cfg.glow : 'none',
          transform: phase === 'enter' ? 'translateY(40px)' : 'translateY(0)',
          opacity: phase === 'enter' ? 0 : 1,
          transition: 'transform 300ms ease-out, opacity 300ms ease-out',
        }}
      >
        {hasDrop ? (
          <>
            {/* Title */}
            <div className="text-lg font-heading font-bold text-white mb-3">
              {t('campaign.ui.loot_title')}
            </div>

            {/* Fragment card */}
            <div
              className="mx-auto w-[140px] rounded-xl p-4 mb-3"
              style={{
                background: cfg.bg,
                border: `2px solid ${cfg.border}`,
                boxShadow: cfg.glow,
                transform: phase === 'card' || phase === 'pity' || phase === 'ready' ? 'scale(1)' : 'scale(0.8)',
                opacity: phase === 'card' || phase === 'pity' || phase === 'ready' ? 1 : 0,
                transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-out',
              }}
            >
              <span className={`text-4xl block mb-2 ${tier === 'legendary' ? 'animate-pulse' : ''}`}>{cfg.emoji}</span>
              <div className="text-sm font-bold text-white">{drop.fragment!.name}</div>
              <div className="text-xs font-bold mt-1" style={{ color: cfg.color }}>
                {t(cfg.label)}
              </div>
              <div className="text-[10px] text-white/50 mt-1">
                Zone {drop.fragment!.zoneNumber}{ZONE_NAMES[drop.fragment!.zoneNumber] ? ` - ${t(ZONE_NAMES[drop.fragment!.zoneNumber])}` : ''}
              </div>
            </div>
          </>
        ) : (
          <div className="mb-3">
            <span className="text-3xl block mb-2">📦</span>
            <div className="text-sm font-bold text-white/70">{t('campaign.ui.no_drops')}</div>
          </div>
        )}

        {/* Pity bar */}
        <div
          className="mb-3"
          style={{
            opacity: phase === 'pity' || phase === 'ready' ? 1 : 0,
            transform: phase === 'pity' || phase === 'ready' ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 300ms ease-out, transform 300ms ease-out',
          }}
        >
          <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
            <span>Pity</span>
            <span>{drop.pityCounter}/{pityTotal}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${pityPct}%`,
                background: pityPct >= 80
                  ? 'linear-gradient(90deg, #f39c12, #e74c3c)'
                  : pityPct >= 50
                    ? 'linear-gradient(90deg, #2ecc71, #f39c12)'
                    : 'linear-gradient(90deg, #3498db, #2ecc71)',
              }}
            />
          </div>
          <div className="text-[10px] mt-1" style={{ color: drop.guaranteedIn <= 5 ? '#f39c12' : 'rgba(255,255,255,0.4)' }}>
            {drop.guaranteedIn <= 0
              ? t('campaign.ui.guaranteed_reached')
              : t('campaign.ui.guaranteed_remaining', { count: drop.guaranteedIn })}
            {drop.guaranteedIn <= 5 && drop.guaranteedIn > 0 ? ' 🔥' : ''}
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-all btn-green"
          style={{
            opacity: phase === 'ready' ? 1 : 0,
            transition: 'opacity 300ms ease-out',
            pointerEvents: phase === 'ready' ? 'auto' : 'none',
          }}
        >
          {t('campaign.ui.continue')}
        </button>
      </div>
    </div>
  );
}
