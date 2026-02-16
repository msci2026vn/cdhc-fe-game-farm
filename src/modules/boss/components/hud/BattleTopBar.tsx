// ═══════════════════════════════════════════════════════════════
// BattleTopBar — Turn counter + player stats + retreat button
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import TurnCounter from './TurnCounter';

interface BattleTopBarProps {
  turn: number;
  maxTurns: number;
  level: number;
  atk: number;
  def: number;
  onRetreat: () => void;
  isCampaign?: boolean;
}

export default function BattleTopBar({
  turn, maxTurns, level, atk, def,
  onRetreat, isCampaign,
}: BattleTopBarProps) {
  const [showRetreatConfirm, setShowRetreatConfirm] = useState(false);

  const handleRetreatClick = () => {
    setShowRetreatConfirm(true);
  };

  const confirmRetreat = () => {
    setShowRetreatConfirm(false);
    onRetreat();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-2 z-10">
        {/* Turn counter */}
        <TurnCounter current={turn} max={maxTurns} />

        {/* Right: stats + retreat */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.15)' }}>
            ⚔️{atk}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ color: '#74b9ff', background: 'rgba(116,185,255,0.15)' }}>
            🛡️{def}
          </span>
          <div className="px-2.5 py-1 rounded-lg font-heading text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}>
            Lv.{level}
          </div>
          <button onClick={handleRetreatClick}
            className="text-white/40 text-sm font-bold active:scale-95 px-1.5 py-1 rounded hover:text-white/60 transition-colors"
            title="Rút lui">
            🏃
          </button>
        </div>
      </div>

      {/* Retreat confirmation dialog */}
      {showRetreatConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-8"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-[320px] rounded-2xl p-6 text-center animate-scale-in"
            style={{ background: 'linear-gradient(180deg, #2d1b4e, #1a0a2e)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-4xl block mb-3">🏃</span>
            <h3 className="font-heading text-lg font-bold text-white mb-2">Rút lui?</h3>
            <p className="text-white/60 text-sm mb-5">
              {isCampaign
                ? 'Trận đấu sẽ tính là thua. Bạn sẽ quay về bản đồ.'
                : 'Bạn chắc chắn muốn rút lui? Trận đấu sẽ tính là thua.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRetreatConfirm(false)}
                className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-95 transition-transform"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                Ở lại
              </button>
              <button onClick={confirmRetreat}
                className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>
                Rút lui
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
