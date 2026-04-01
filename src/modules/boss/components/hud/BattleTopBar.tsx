// ═══════════════════════════════════════════════════════════════
// BattleTopBar — Turn counter / Timer + player stats + retreat button
// Campaign: shows elapsed timer + pause-aware retreat
// Weekly: shows classic TurnCounter (unchanged)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import TurnCounter from './TurnCounter';
import { SoundToggle, playSound } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

interface BattleTopBarProps {
  turn: number;
  maxTurns: number;
  level: number;
  atk: number;
  def: number;
  onRetreat: () => void;
  isCampaign?: boolean;
  /** Campaign only — elapsed battle seconds (pause-aware) */
  elapsedSeconds?: number;
  /** Campaign only — enrage level (0, 1, 2, 3+) for timer color */
  enrageLevel?: number;
  /** Campaign only — called when retreat confirm opens (pauses combat) */
  onPause?: () => void;
  /** Campaign only — called when retreat confirm closes (resumes combat) */
  onResume?: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function BattleTopBar({
  turn, maxTurns, level, atk, def,
  onRetreat, isCampaign,
  elapsedSeconds, enrageLevel,
  onPause, onResume,
}: BattleTopBarProps) {
  const { t } = useTranslation();
  const [showRetreatConfirm, setShowRetreatConfirm] = useState(false);

  // Pause/resume combat when confirm dialog opens/closes
  useEffect(() => {
    if (!isCampaign) return;
    if (showRetreatConfirm) {
      onPause?.();
    } else {
      onResume?.();
    }
  }, [showRetreatConfirm, isCampaign]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetreatClick = () => {
    playSound('ui_modal_open');
    setShowRetreatConfirm(true);
  };

  const confirmRetreat = () => {
    playSound('ui_click');
    setShowRetreatConfirm(false);
    onRetreat();
  };

  const dismissRetreat = () => {
    playSound('ui_modal_close');
    setShowRetreatConfirm(false);
  };

  // Timer color based on enrage level
  const timerColor = (enrageLevel ?? 0) >= 3
    ? 'text-red-400 animate-pulse'
    : (enrageLevel ?? 0) >= 2
      ? 'text-orange-400'
      : 'text-white/80';

  return (
    <>
      <div className="flex justify-between items-start z-10 relative pointer-events-none min-h-[30px] mb-1">
        {/* Left spacer instead of Level */}
        <div className="flex items-start mt-1 z-20 pointer-events-auto">
        </div>

        {/* Absolute Right: Timer, Sound */}
        <div className="absolute top-[85px] right-0 flex items-center gap-1.5 z-20 pointer-events-auto">
          {isCampaign ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg shadow-sm" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-sm">⏱️</span>
              <span className={`font-mono font-heading text-sm font-bold ${timerColor}`}>
                {formatTime(elapsedSeconds ?? 0)}
              </span>
              <span className="text-white/20 text-xs mx-0.5">|</span>
              <SoundToggle />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <TurnCounter current={turn} max={maxTurns} />
              <SoundToggle />
            </div>
          )}
        </div>

        {/* Absolute Top Right: X Button */}
        <div className="absolute -top-1 -right-2 z-[100] pointer-events-auto">
          <button onClick={handleRetreatClick}
            className="text-white/60 text-2xl font-bold active:scale-95 p-1 rounded-lg hover:bg-white/10 hover:text-white transition-all flex items-center justify-center w-8 h-8"
            title={isCampaign ? t('exit') : t('retreat')}>
            {isCampaign ? '✕' : '🏃'}
          </button>
        </div>
      </div>

      {/* Retreat/Exit confirmation dialog */}
      {showRetreatConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-[320px] rounded-2xl p-6 text-center animate-scale-in"
            style={{ background: 'linear-gradient(180deg, #2d1b4e, #1a0a2e)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-4xl block mb-3">{isCampaign ? '⚔️' : '🏃'}</span>
            <h3 className="font-heading text-lg font-bold text-white mb-1">
              {isCampaign ? t('exit_battle_q') : t('retreat_q')}
            </h3>
            <p className="text-white/60 text-sm mb-5">
              {isCampaign
                ? t('exit_battle_desc')
                : t('retreat_desc')}
            </p>
            <div className="flex gap-3">
              <button onClick={dismissRetreat}
                className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-95 transition-transform"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {isCampaign ? t('continue') : t('stay')}
              </button>
              <button onClick={confirmRetreat}
                className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>
                {isCampaign ? t('exit') : t('retreat')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
