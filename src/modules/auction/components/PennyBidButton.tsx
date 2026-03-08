import { useTranslation } from 'react-i18next';
import { usePlaceBid, useBidPack } from '../hooks/useAuction';
import { playSound } from '@/shared/audio';

interface Props {
  auctionId: string;
  sessionId: string;
  disabled?: boolean;
  isSellerView?: boolean;
}

export function PennyBidButton({ auctionId, sessionId, disabled, isSellerView }: Props) {
  const { t } = useTranslation(); auctionId, sessionId, disabled, isSellerView }: Props) {
  const { mutate: bid, isPending } = usePlaceBid(auctionId);
  const { data: bidPack } = useBidPack(sessionId, !!sessionId);

  const isFree = bidPack && bidPack.freeBidsRemaining > 0;
  const isMaxed = bidPack && bidPack.totalBidsUsed >= bidPack.maxBidsPerSession;

  if (isSellerView) {
    return (
      <div className="w-full py-4 rounded-xl bg-gray-700 text-gray-400 text-center font-medium">{t('you_are_seller_msg')}</div>
    );
  }

  if (isMaxed) {
    return (
      <div className="w-full py-4 rounded-xl bg-gray-700 text-gray-400 text-center font-medium">{t('out_of_bids_msg', { used: bidPack.totalBidsUsed, max: bidPack.maxBidsPerSession })}</div>
    );
  }

  const handleBid = () => {
    if (isPending || disabled) return;
    playSound('ui_click');
    bid();
  };

  return (
    <button
      onClick={handleBid}
      disabled={isPending || disabled}
      className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-transform active:scale-95 ${
        isPending
          ? 'bg-gray-600 opacity-50'
          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'
      }`}
    >
      {isPending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />{t('bidding_status')}</span>
      ) : (
        <span>
          BID! {isFree ? t('bid_btn_free') : t('bid_btn_cost')}
        </span>
      )}
      {bidPack && (
        <div className="text-xs font-normal mt-1 opacity-80">
          {t('bid_count_label', { used: bidPack.totalBidsUsed, max: bidPack.maxBidsPerSession })}
          {bidPack.freeBidsRemaining > 0 && t('free_bid_count_label', { rem: bidPack.freeBidsRemaining })}
        </div>
      )}
    </button>
  );
}
