import type { AuctionStatus } from '../types/auction.types';
import { AuctionCountdown } from './AuctionCountdown';

interface Props {
  imageUrl: string | null;
  tokenId: number;
  bidCount?: number;
  status?: AuctionStatus;
  endTime?: string;
  onClick?: () => void;
  variant?: 'grid' | 'hero';
}

const borderColors: Record<string, string> = {
  active: 'border-amber-500',
  sudden_death: 'border-red-500 animate-pulse',
  ended: 'border-gray-600',
  pending: 'border-gray-700',
  cancelled: 'border-gray-700',
};

const statusBadge: Record<string, { bg: string; label: string }> = {
  active: { bg: 'bg-amber-600', label: 'Live' },
  sudden_death: { bg: 'bg-red-600', label: 'SD!' },
  ended: { bg: 'bg-gray-600', label: 'End' },
  pending: { bg: 'bg-gray-700', label: 'Soon' },
  cancelled: { bg: 'bg-gray-700', label: 'Huy' },
};

export function AuctionNftCard({
  imageUrl,
  tokenId,
  bidCount,
  status = 'pending',
  endTime,
  onClick,
  variant = 'grid',
}: Props) {
  const border = borderColors[status] || 'border-gray-700';
  const badge = statusBadge[status] || statusBadge.pending;

  if (variant === 'hero') {
    return (
      <div className={`rounded-2xl border-2 ${border} overflow-hidden bg-gray-800 mx-auto max-w-[260px]`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`NFT #${tokenId}`}
            className="w-full aspect-[2/3] object-cover"
            onError={e => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              (img.nextElementSibling as HTMLElement)?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-6xl${imageUrl ? ' hidden' : ''}`}>
          🎴
        </div>
        <div className="px-3 py-2 text-center">
          <span className="text-gray-400 text-xs">Token #{tokenId}</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border ${border} bg-gray-800/60 overflow-hidden text-left transition-transform active:scale-95`}
    >
      <div className="relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`NFT #${tokenId}`}
            className="w-full aspect-[2/3] object-cover"
            onError={e => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              (img.nextElementSibling as HTMLElement)?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-5xl${imageUrl ? ' hidden' : ''}`}>
          🎴
        </div>

        {/* Status badge */}
        <span className={`absolute top-2 left-2 ${badge.bg} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md`}>
          {badge.label}
        </span>

        {/* Bid count */}
        {bidCount != null && (
          <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md">
            {bidCount} bids
          </span>
        )}
      </div>

      <div className="px-3 py-2 space-y-1">
        <p className="text-white text-xs font-bold">#{tokenId}</p>
        {endTime && (status === 'active' || status === 'sudden_death') && (
          <AuctionCountdown endTime={endTime} size="sm" />
        )}
      </div>
    </button>
  );
}
