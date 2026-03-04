/**
 * LevelUpButton — Manual level-up with OGN fee confirmation
 *
 * Shows when player has enough XP but level is pending (OGN was insufficient at addXP time).
 * Also shows when auto level-up succeeded but there are more pending levels.
 */
import { useState } from 'react';
import { useLevelInfo } from '../hooks/useLevelInfo';
import { useLevelUp } from '../hooks/useLevelUp';
import { formatOGN } from '../utils/format';
import { playSound } from '../audio';

export function LevelUpButton() {
  const { data: info, isLoading } = useLevelInfo();
  const levelUp = useLevelUp();
  const [showConfirm, setShowConfirm] = useState(false);

  if (isLoading || !info) return null;

  // Max level reached
  if (info.level >= info.maxLevel) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-yellow-500/20 text-yellow-400">
        MAX
      </span>
    );
  }

  // No pending level-up (XP not enough yet)
  if (!info.pendingLevelUp) return null;

  const canAfford = info.ogn >= info.levelUpFee;

  return (
    <>
      {/* Level-up button */}
      <button
        onClick={() => { if (canAfford) { playSound('ui_modal_open'); setShowConfirm(true); } }}
        disabled={!canAfford || levelUp.isPending}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all ${
          canAfford
            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 active:scale-95 animate-pulse'
            : 'bg-white/10 text-white/40'
        }`}
      >
        {canAfford ? (
          <>
            {levelUp.isPending ? '...' : `Level ${info.level + 1}`}
          </>
        ) : (
          <>
            {formatOGN(info.levelUpFee)} OGN
          </>
        )}
      </button>

      {/* Confirmation popup */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in" onClick={() => { playSound('ui_modal_close'); setShowConfirm(false); }}>
          <div className="bg-white rounded-2xl p-5 max-w-[320px] w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-2">{info.icon}</div>
              <h3 className="font-heading text-lg font-bold mb-1">
                Level {info.level} &rarr; {info.level + 1}
              </h3>
              <p className="text-sm text-gray-600 mb-3">{info.title}</p>

              <div className="bg-amber-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-amber-700 font-bold mb-1">Chi phí lên cấp</p>
                <p className="text-2xl font-black text-amber-600">{formatOGN(info.levelUpFee)} OGN</p>
                <p className="text-[10px] text-amber-500 mt-1">
                  Số dư: {formatOGN(info.ogn)} OGN
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { playSound('ui_back'); setShowConfirm(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 active:bg-gray-200"
                >
                  Huỷ
                </button>
                <button
                  onClick={() => {
                    playSound('level_up');
                    levelUp.mutate();
                    setShowConfirm(false);
                  }}
                  disabled={levelUp.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-amber-500 active:scale-95 shadow-lg disabled:opacity-50"
                >
                  {levelUp.isPending ? '...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
