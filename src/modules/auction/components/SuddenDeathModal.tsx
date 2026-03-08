import { useTranslation } from 'react-i18next';
import { useRef, useState, useEffect } from 'react';
import type { AuctionDetail } from '../types/auction.types';
import { AuctionCountdown } from './AuctionCountdown';
import { playSound } from '@/shared/audio';

interface Props {
  auction: AuctionDetail;
}

export function SuddenDeathModal({ auction }: Props) {
  const { t } = useTranslation(); auction }: Props) {
  const prevBidCount = useRef(auction.bidCount);
  const [rivalFlash, setRivalFlash] = useState(false);

  // Detect rival bid
  useEffect(() => {
    if (auction.bidCount > prevBidCount.current) {
      setRivalFlash(true);
      playSound('ui_click');
      const t = setTimeout(() => setRivalFlash(false), 2000);
      prevBidCount.current = auction.bidCount;
      return () => clearTimeout(t);
    }
    prevBidCount.current = auction.bidCount;
  }, [auction.bidCount]);

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border-2 border-red-500 animate-pulse bg-gray-900/95 p-6 space-y-4">
        {/* Title */}
        <div className="text-center">
          <div className="text-3xl mb-1">⚔️</div>
          <h2 className="text-red-500 text-2xl font-black tracking-wide">SUDDEN DEATH</h2>
        </div>

        {/* Countdown */}
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">{t('sd_time_left')}</div>
          <AuctionCountdown endTime={auction.endTime} size="lg" />
        </div>

        {/* Info */}
        <div className="bg-red-900/30 rounded-xl p-3 text-center space-y-1">
          <p className="text-gray-300 text-sm">{t('sd_total_bids', { count: auction.bidCount })}</p>
          <p className="text-gray-400 text-xs">{t('sd_higher_bid_hint')}</p>
        </div>

        {/* Rival flash */}
        {rivalFlash && (
          <div className="bg-yellow-900/50 border border-yellow-500 rounded-xl p-3 text-center animate-bounce">
            <span className="text-yellow-400 font-bold text-sm">{t('sd_rival_bid_flash')}</span>
          </div>
        )}

        {/* Hint */}
        <p className="text-gray-600 text-xs text-center">{t('sd_lose_hint')}</p>
      </div>
    </div>
  );
}
