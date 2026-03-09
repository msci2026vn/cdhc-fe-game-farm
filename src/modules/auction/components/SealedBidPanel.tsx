import { useTranslation } from 'react-i18next';
import type { AuctionDetail } from '../types/auction.types';

interface Props {
  auction: AuctionDetail;
}

export function SealedBidPanel({ auction }: Props) {
  const { t } = useTranslation();
  const isActive = auction.status === 'active' || auction.status === 'sudden_death';
  const isEnded = auction.status === 'ended';

  // Active / Sudden Death — sealed info
  if (isActive) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{t('total_bids_label')}</span>
          <span className="text-white font-bold">{auction.bidCount}</span>
        </div>

        {auction.myLastBidAvax !== null ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{t('your_bid_price_label')}</span>
              <span className="text-amber-400 font-bold">{auction.myLastBidAvax} AVAX</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{t('your_bid_count_label')}</span>
              <span className="text-white font-bold">{auction.myBidCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{t('others_bid_price_label')}</span>
              <span className="text-gray-600 italic">{t('hidden_label')}</span>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm text-center py-2">{t('no_bids_yet_hint')}</p>
        )}
      </div>
    );
  }

  // Ended — revealed leaderboard
  if (isEnded && auction.leaderboard) {
    return (
      <div className="space-y-3">
        <h3 className="text-white font-bold text-center">{t('auction_results_title')}</h3>

        {auction.leaderboard.map(entry => (
          <div
            key={entry.rank}
            className={`rounded-xl p-3 flex items-center gap-3 ${entry.isWinner
              ? 'bg-amber-900/50 border border-amber-500'
              : 'bg-gray-800/50'
              }`}
          >
            <span className="text-lg font-bold text-gray-400 w-8 text-center">
              {entry.isWinner ? '👑' : `#${entry.rank}`}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{entry.playerName}</p>
              <p className="text-gray-500 text-xs">{t('bids_count', { count: entry.bidCount })}</p>
            </div>
            <span className="text-amber-400 font-bold text-sm">{entry.lastBidAvax} AVAX</span>
          </div>
        ))}

        {auction.finalPriceAvax && (
          <div className="text-center text-sm text-gray-400">
            Giá cuối: <span className="text-amber-400 font-bold">{auction.finalPriceAvax} AVAX</span>
          </div>
        )}
      </div>
    );
  }

  return null;
}
