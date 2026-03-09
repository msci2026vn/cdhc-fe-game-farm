import i18n from '@/i18n';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  pending: { bg: 'bg-gray-700', label: i18n.t('status_pending_short') },
  cancelled: { bg: 'bg-gray-700', label: i18n.t('status_cancelled') },
};

/** Convert ipfs:// → public HTTP gateway so browsers can load the image */
function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('ipfs://')) {
    return 'https://ipfs.io/ipfs/' + url.slice(7);
  }
  return url;
}

export function AuctionNftCard({
  imageUrl,
  tokenId,
  bidCount,
  status = 'pending',
  endTime,
  onClick,
  variant = 'grid',
}: Props) {
  const { t } = useTranslation();
  const border = borderColors[status] || 'border-gray-700';
  const badge = statusBadge[status] || statusBadge.pending;

  // Use React state for image error — more reliable than direct DOM manipulation
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = resolveImageUrl(imageUrl);
  const showImage = !!resolvedUrl && !imgError;

  if (variant === 'hero') {
    return (
      <div className={`rounded-2xl border-2 ${border} overflow-hidden bg-gray-800 mx-auto max-w-[260px]`}>
        {showImage ? (
          <img
            src={resolvedUrl!}
            alt={`NFT #${tokenId}`}
            className="w-full aspect-[2/3] object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-6xl">
            🎴
          </div>
        )}
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
        {showImage ? (
          <img
            src={resolvedUrl!}
            alt={`NFT #${tokenId}`}
            className="w-full aspect-[2/3] object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-5xl">
            🎴
          </div>
        )}

        {/* Status badge */}
        <span className={`absolute top-2 left-2 ${badge.bg} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md`}>
          {badge.label}
        </span>

        {/* Bid count */}
        {bidCount != null && (
          <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md">
            {t('bids_count', { count: bidCount })}
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
