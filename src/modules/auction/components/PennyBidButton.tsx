import { usePlaceBid, useBidPack } from '../hooks/useAuction';
import { playSound } from '@/shared/audio';

interface Props {
  auctionId: string;
  sessionId: string;
  disabled?: boolean;
  isSellerView?: boolean;
}

export function PennyBidButton({ auctionId, sessionId, disabled, isSellerView }: Props) {
  const { mutate: bid, isPending } = usePlaceBid(auctionId);
  const { data: bidPack } = useBidPack(sessionId, !!sessionId);

  const isFree = bidPack && bidPack.freeBidsRemaining > 0;
  const isMaxed = bidPack && bidPack.totalBidsUsed >= bidPack.maxBidsPerSession;

  if (isSellerView) {
    return (
      <div className="w-full py-4 rounded-xl bg-gray-700 text-gray-400 text-center font-medium">
        Ban la nguoi ban
      </div>
    );
  }

  if (isMaxed) {
    return (
      <div className="w-full py-4 rounded-xl bg-gray-700 text-gray-400 text-center font-medium">
        Het luot bid ({bidPack.totalBidsUsed}/{bidPack.maxBidsPerSession})
      </div>
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
          <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          Dang bid...
        </span>
      ) : (
        <span>
          BID! {isFree ? '(Mien phi 🎁)' : '(-10 OGN)'}
        </span>
      )}
      {bidPack && (
        <div className="text-xs font-normal mt-1 opacity-80">
          Luot: {bidPack.totalBidsUsed}/{bidPack.maxBidsPerSession}
          {bidPack.freeBidsRemaining > 0 && ` • Free: ${bidPack.freeBidsRemaining}/3`}
        </div>
      )}
    </button>
  );
}
