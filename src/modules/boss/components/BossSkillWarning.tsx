// ═══════════════════════════════════════════════════════════════
// BossSkillWarning — Semi-transparent overlay for boss skill attacks
// Shows: skill name, damage preview, countdown, dodge button
// Player can still see and swap gems behind the overlay
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import type { SkillWarning } from '../hooks/useMatch3';
import { playSound } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

interface Props {
  warning: SkillWarning;
  bossName: string;
  bossEmoji: string;
  manaCost: number;
  currentMana: number;
  onDodge: () => void;
}

export default function BossSkillWarning({ warning, bossName, bossEmoji, manaCost, currentMana, onDodge }: Props) {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(warning.countdown);
  const canDodge = currentMana >= manaCost;

  // Countdown timer
  useEffect(() => {
    setCountdown(warning.countdown);
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const remaining = Math.max(0, warning.countdown - elapsed);
      setCountdown(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 100); // 10fps display — smooth enough for countdown, halves re-renders vs 50ms
    return () => clearInterval(timer);
  }, [warning.countdown]);

  return (
    <div
      className="absolute inset-0 z-[45] flex items-center justify-center"
      style={{ pointerEvents: 'none' }}
    >
      {/* Semi-transparent backdrop — clicks pass through to gem grid */}
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />

      {/* Warning card */}
      <div
        className="relative z-10 mx-6 w-full max-w-[320px] rounded-2xl p-4 animate-scale-in"
        style={{
          background: 'linear-gradient(135deg, rgba(231,76,60,0.95), rgba(192,57,43,0.95))',
          boxShadow: '0 0 40px rgba(231,76,60,0.6), 0 8px 32px rgba(0,0,0,0.4)',
          border: '2px solid rgba(255,255,255,0.2)',
          pointerEvents: 'auto',
        }}
      >
        {/* Pulse ring */}
        <div className="absolute -inset-1 rounded-2xl opacity-50"
          style={{ border: '2px solid rgba(255,107,107,0.6)' }} />

        {/* Header: warning icon + boss name */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
              {bossEmoji} {bossName}
            </div>
            <div className="text-white font-heading font-bold text-lg leading-tight">
              {warning.name}
            </div>
          </div>
          {/* Countdown */}
          <div className="text-right">
            <div className="text-white font-heading text-2xl font-black tabular-nums">
              {countdown.toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Damage preview */}
        <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.3)' }}>
          <span className="text-lg">💀</span>
          <span className="text-white/80 text-sm font-bold">
            ~{warning.damage} damage
          </span>
        </div>

        {/* Dodge button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            playSound('ui_click');
            onDodge();
          }}
          disabled={!canDodge}
          className={`w-full py-3 rounded-xl font-heading text-base font-bold text-white flex items-center justify-center gap-2 transition-transform active:scale-95 ${canDodge
              ? 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30'
              : 'bg-gray-600 opacity-50 cursor-not-allowed'
            }`}
        >
          <span className="text-xl">🛡️</span>
          {t('dodge')}
          <span className="text-xs opacity-80">({manaCost} 💎)</span>
        </button>

        {!canDodge && (
          <p className="text-center text-[10px] text-red-200 mt-1">
            {t('not_enough_mana', { manaCost })}
          </p>
        )}
      </div>
    </div>
  );
}
