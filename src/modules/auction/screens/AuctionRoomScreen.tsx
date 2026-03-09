import i18n from '@/i18n';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuctionDetail, useBidPack, useCancelAuction } from '../hooks/useAuction';
import { useAuctionLivePolling } from '../hooks/useAuctionPolling';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';
import { AuctionCountdown } from '../components/AuctionCountdown';
import { AuctionNftCard } from '../components/AuctionNftCard';
import { PennyBidButton } from '../components/PennyBidButton';
import { SealedBidPanel } from '../components/SealedBidPanel';
import { RevealAnimation } from '../components/RevealAnimation';
import { SuddenDeathModal } from '../components/SuddenDeathModal';
import { playSound } from '@/shared/audio';
import type { AuctionStatus } from '../types/auction.types';

const statusColors: Record<string, string> = {
  pending: 'bg-gray-700 text-gray-300',
  active: 'bg-amber-900/80 text-amber-300',
  sudden_death: 'bg-red-900/80 text-red-300',
  ended: 'bg-green-900/80 text-green-300',
  cancelled: 'bg-gray-700 text-gray-400',
};

const statusLabels: Record<string, string> = {
  pending: i18n.t('status_pending'),
  active: i18n.t('room_status_active'),
  sudden_death: 'Sudden Death',
  ended: i18n.t('room_status_ended'),
  cancelled: i18n.t('status_cancelled'),
};

export default function AuctionRoomScreen() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: profile } = usePlayerProfile();
  const cancelAuction = useCancelAuction();

  // Initial fetch
  const { data: detail, isLoading } = useAuctionDetail(id!, true);

  // Live polling — overrides detail when active
  const { data: liveDetail } = useAuctionLivePolling(id!, detail?.status);
  const auction = liveDetail || detail;

  // Bid pack — only fetch when sessionId available and auction active
  const isLive = auction?.status === 'active' || auction?.status === 'sudden_death';
  const { data: bidPack } = useBidPack(
    auction?.sessionId || '',
    !!auction?.sessionId && isLive,
  );

  // Seller check
  const isSeller = !!profile?.userId && profile.userId === auction?.sellerUserId;

  // Reveal animation trigger: detect status change to 'ended'
  const [showReveal, setShowReveal] = useState(false);
  const prevStatus = useRef(auction?.status);

  useEffect(() => {
    if (
      prevStatus.current &&
      prevStatus.current !== 'ended' &&
      auction?.status === 'ended' &&
      auction?.leaderboard?.length
    ) {
      setShowReveal(true);
    }
    prevStatus.current = auction?.status;
  }, [auction?.status, auction?.leaderboard]);

  if (isLoading || !auction) {
    return (
      <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const status = auction.status as AuctionStatus;

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center px-4 pt-4 pb-2">
        <button onClick={() => { playSound('ui_back'); navigate(-1); }}>
          <span className="material-symbols-outlined text-xl text-gray-400">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center font-bold text-white uppercase tracking-wider text-sm">
          {status === 'sudden_death' ? 'Sudden Death' : t('room_title_normal')}
        </h1>
        <span className={`text - xs px - 2 py - 1 rounded - full ${statusColors[status] || ''} `}>
          {statusLabels[status] || status}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* NFT Card — hero */}
        <AuctionNftCard
          imageUrl={auction.nftImageUrl}
          tokenId={auction.tokenId}
          status={status}
          variant="hero"
        />

        {/* Countdown */}
        {isLive && (
          <div className="text-center my-4">
            <div className="text-xs text-gray-500 mb-1">
              {status === 'sudden_death' ? t('sd_time_remaining') : t('time_remaining')}
            </div>
            <AuctionCountdown endTime={auction.endTime} size="lg" />
          </div>
        )}
        {status === 'ended' && (
          <div className="text-center my-4 text-green-400 font-bold">{t('room_status_ended_label')}</div>
        )}

        {/* Sealed Bid Panel */}
        <SealedBidPanel auction={auction} />

        {/* Bid pack info */}
        {bidPack && isLive && (
          <div className="flex justify-center gap-4 text-xs text-gray-500 my-3">
            <span>{t('free_bids_remaining', { rem: bidPack.freeBidsRemaining })}</span>
            <span>{t('bids_used_info', { used: bidPack.totalBidsUsed, max: bidPack.maxBidsPerSession })}</span>
          </div>
        )}
      </div>

      {/* Fixed bottom — bid button */}
      {isLive && !isSeller && (
        <div className="px-4 pb-6 pt-2 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800">
          <PennyBidButton
            auctionId={id!}
            sessionId={auction.sessionId}
            isSellerView={isSeller}
          />
        </div>
      )}

      {/* Seller cancel — only when pending/active + no bids */}
      {isSeller && auction.bidCount === 0 && status !== 'ended' && status !== 'cancelled' && (
        <div className="px-4 pb-6 pt-2">
          <button
            onClick={() => { playSound('ui_click'); cancelAuction.mutate(id!); }}
            className="px-4 py-2 bg-red-900 border border-red-500 rounded-xl text-red-200 font-bold active:scale-95"
          >
            Hủy đấu giá
          </button>
        </div>
      )}

      {/* Reveal Animation — overlay when just ended */}
      {showReveal && auction.leaderboard && (
        <RevealAnimation
          leaderboard={auction.leaderboard}
          winnerName={auction.winnerName}
          finalPriceAvax={auction.finalPriceAvax}
          onRevealComplete={() => setShowReveal(false)}
        />
      )}

      {/* Sudden Death Modal */}
      {status === 'sudden_death' && (
        <SuddenDeathModal auction={auction} />
      )}

      {/* Whale Alert — top banner on big bid jumps */}
      {isLive && <WhaleAlert auction={auction} />}

      {/* Emoji Reaction — bottom bar when active */}
      {isLive && !isSeller && <EmojiReaction enabled={true} />}
    </div>
  );
}
