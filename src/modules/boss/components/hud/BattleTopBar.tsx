// ═══════════════════════════════════════════════════════════════
// BattleTopBar — Turn counter / Timer + player stats + retreat button
// Campaign: shows elapsed timer + pause-aware retreat
// Weekly: shows classic TurnCounter (unchanged)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import TurnCounter from './TurnCounter';
import { SoundToggle, playSound } from '@/shared/audio';
import { useTranslation } from 'react-i18next';
import AutoPlayToggle from '@/shared/components/AutoPlayToggle';

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
  /** Auto-play state for campaign */
  autoPlay?: {
    isActive: boolean;
    toggle: () => void;
    vipLevel: number;
    dodgeFreeRemaining: number;
    currentSituation?: string;
  };
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
  onPause, onResume, autoPlay,
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
        {/* Left: Sound Toggle (Top Left) */}
        <div className="absolute top-[-38px] left-[-4px] z-[100] pointer-events-auto">
          <SoundToggle size={40} />
        </div>

        {/* Absolute Right: AI Toggle + Timer */}
        <div className="absolute top-[35px] right-0 flex flex-col items-end gap-2 z-20 pointer-events-auto">
          {isCampaign && autoPlay && (
            <div className="mr-0.5">
              <AutoPlayToggle
                isActive={autoPlay.isActive}
                onToggle={autoPlay.toggle}
                vipLevel={autoPlay.vipLevel}
                dodgeFreeRemaining={autoPlay.dodgeFreeRemaining}
                currentSituation={autoPlay.currentSituation}
                compact
              />
            </div>
          )}

          {isCampaign ? (
            <div className="relative flex items-center h-[34px] min-w-[85px] px-2.5 z-20">
              {/* Timer Frame Background */}
              <img
                src="/assets/battle/frame_time.png"
                alt="Timer frame"
                className="absolute inset-0 w-full h-full object-fill z-[-1] pointer-events-none"
              />

              <div className="flex items-center gap-1.5 w-full">
                <img
                  src="/assets/battle/icon_time.png"
                  alt="Clock"
                  className="w-4 h-4 object-contain brightness-110"
                />
                <span className={`font-mono font-heading text-sm font-bold min-w-[36px] ${timerColor}`}>
                  {formatTime(elapsedSeconds ?? 0)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <TurnCounter current={turn} max={maxTurns} />
              <SoundToggle />
            </div>
          )}
        </div>

        <div className="absolute top-[-40px] right-[-8px] z-[100] pointer-events-auto">
          <button onClick={handleRetreatClick}
            className="relative active:scale-95 transition-transform flex items-center justify-center p-0 overflow-visible"
            title={isCampaign ? t('exit') : t('retreat')}>
            <img
              src="/assets/battle/btn_close.png"
              alt="Close"
              className="w-10 h-10 object-contain drop-shadow-md hover:brightness-110"
            />
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
