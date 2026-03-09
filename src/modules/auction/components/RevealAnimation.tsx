import { useState, useEffect, useCallback } from 'react';
import type { LeaderboardEntry } from '../types/auction.types';
import { ConfettiEffect } from './ConfettiEffect';

interface Props {
  leaderboard: LeaderboardEntry[];
  winnerName: string | null;
  finalPriceAvax: string | null;
  onRevealComplete?: () => void;
}

type Phase = 'countdown' | 'revealing' | 'winner' | 'done';

export function RevealAnimation({ leaderboard, winnerName, finalPriceAvax, onRevealComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(5);
  const [revealIndex, setRevealIndex] = useState(-1);

  const total = leaderboard.length;

  // Phase: countdown 5..1
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('revealing');
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Phase: revealing entries bottom-to-top
  useEffect(() => {
    if (phase !== 'revealing') return;
    if (revealIndex >= total - 1) {
      setPhase('winner');
      return;
    }
    const t = setTimeout(() => setRevealIndex(i => i + 1), 500);
    return () => clearTimeout(t);
  }, [phase, revealIndex, total]);

  // Phase: winner highlight
  useEffect(() => {
    if (phase !== 'winner') return;
    const t = setTimeout(() => setPhase('done'), 3000);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase: done — call onRevealComplete
  const handleComplete = useCallback(() => {
    onRevealComplete?.();
  }, [onRevealComplete]);

  useEffect(() => {
    if (phase !== 'done') return;
    const t = setTimeout(handleComplete, 2000);
    return () => clearTimeout(t);
  }, [phase, handleComplete]);

  // Reversed: show from last rank to first (bottom-up drama)
  const reversed = [...leaderboard].reverse();

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center overflow-hidden">
      {/* Countdown */}
      {phase === 'countdown' && (
        <div className="text-center z-10 animate-fade-in delay-500 mt-28">
          <div className="text-amber-400 font-bold uppercase tracking-widest text-sm drop-shadow-md">
            🏆 Kết quả Đấu Giá
          </div>
          <div
            key={countdown} // Keep the key for animation
            className="text-7xl font-black text-white animate-bounce mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]"
          >
            {countdown || '!'}
          </div>
        </div>
      )}

      {/* Revealing + Winner + Done */}
      {phase !== 'countdown' && (
        <div className="w-full max-w-[400px] px-4 space-y-2 max-h-[70vh] overflow-y-auto">
          <h3 className="text-center text-amber-400 text-lg font-bold mb-4">
            🏆 Ket qua Dau Gia
          </h3>

          {reversed.map((entry, i) => {
            const actualIdx = total - 1 - i;
            const isRevealed = actualIdx <= revealIndex;
            const isWinnerEntry = entry.isWinner && (phase === 'winner' || phase === 'done');

            return (
              <div
                key={entry.rank}
                className={`transition-all duration-500 rounded-xl p-3 flex items-center gap-3
                  ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
                  ${isWinnerEntry
                    ? 'bg-amber-900/60 border-2 border-amber-400 scale-105'
                    : 'bg-gray-800/80 border border-gray-700'}
                `}
              >
                <span className="text-lg font-bold w-8 text-center">
                  {entry.isWinner ? '👑' : `#${entry.rank}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${entry.isWinner ? 'text-amber-300' : 'text-white'}`}>
                    {entry.playerName}
                  </p>
                  <p className="text-gray-500 text-xs">{entry.bidCount} bids</p>
                </div>
                <span className="text-amber-400 font-bold text-sm font-mono">
                  {entry.lastBidAvax} AVAX
                </span>
              </div>
            );
          })}

          {/* Winner announcement */}
          {(phase === 'winner' || phase === 'done') && winnerName && (
            <div className="text-center mt-6 space-y-2">
              <div className="text-3xl">👑</div>
              <p className="text-amber-400 text-xl font-black">{winnerName}</p>
              {finalPriceAvax && (
                <p className="text-gray-400 text-sm">
                  Gia cuoi: <span className="text-amber-300 font-bold">{finalPriceAvax} AVAX</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confetti on winner phase */}
      {(phase === 'winner' || phase === 'done') && <ConfettiEffect />}

      {/* Skip button */}
      {phase !== 'done' && (
        <button
          onClick={() => { setPhase('done'); setRevealIndex(total - 1); }}
          className="absolute bottom-8 text-gray-500 text-sm hover:text-gray-300 transition-colors"
        >
          Bo qua &gt;&gt;
        </button>
      )}
    </div>
  );
}
