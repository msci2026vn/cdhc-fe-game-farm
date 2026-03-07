import { useNavigate } from 'react-router-dom';
import { useNextSession } from '../hooks/useAuction';
import { AuctionCountdown } from './AuctionCountdown';
import { playSound } from '@/shared/audio';

export function AuctionBanner() {
  const navigate = useNavigate();
  const { data: session } = useNextSession();

  if (!session || session.status !== 'scheduled') return null;

  const diff = new Date(session.startTime).getTime() - Date.now();
  if (diff > 3_600_000 || diff < 0) return null;

  const urgent = diff < 300_000;

  return (
    <button
      onClick={() => { playSound('ui_click'); navigate('/auction'); }}
      className={`w-full bg-gradient-to-r from-amber-900/60 to-orange-900/60 border rounded-xl px-3 py-2 flex items-center justify-between ${
        urgent ? 'border-amber-500 animate-pulse' : 'border-amber-700/50'
      }`}
    >
      <span className="text-amber-400 text-xs font-bold">⚡ Dau gia sau</span>
      <AuctionCountdown endTime={session.startTime} size="sm" />
      <span className="text-gray-400 text-xs">&rarr;</span>
    </button>
  );
}
