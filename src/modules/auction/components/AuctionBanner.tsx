import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useNextSession } from '../hooks/useAuction';
import { AuctionCountdown } from './AuctionCountdown';
import { playSound } from '@/shared/audio';

export function AuctionBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = useNextSession();

  if (!session || session.status !== 'scheduled') return null;

  const diff = new Date(session.startTime).getTime() - Date.now();
  if (diff > 3_600_000 || diff < 0) return null;

  const urgent = diff < 300_000;

  return (
    <div
      className="bg-black/60 border border-amber-500/50 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center justify-between cursor-pointer active:scale-95 transition-transform shadow-lg"
      onClick={() => { playSound('ui_click'); navigate('/auction'); }}
    >
      <div className="flex flex-col">
        <span className="text-amber-400 text-xs font-bold">{t('auction_starting_soon')}</span>
        <span className="text-white font-bold text-sm tracking-wide">{session.name}</span>
      </div>
      <AuctionCountdown endTime={session.startTime} size="sm" />
      <span className="text-gray-400 text-xs">&rarr;</span>
    </div>
  );
}
