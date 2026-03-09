import { Clock, AlertTriangle } from 'lucide-react';

interface PriceUpdatedBadgeProps {
  updatedAt: number;
  stale: boolean;
  avaxPriceUsd: number;
}

export function PriceUpdatedBadge({ updatedAt, stale, avaxPriceUsd }: PriceUpdatedBadgeProps) {
  const minutesAgo = Math.floor((Date.now() - updatedAt) / 60000);
  const timeText = minutesAgo < 1 ? 'vừa xong' : `${minutesAgo} phút trước`;

  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
      ${stale
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-green-100 text-green-700'
      }
    `}>
      {stale ? (
        <AlertTriangle className="w-3.5 h-3.5" />
      ) : (
        <Clock className="w-3.5 h-3.5" />
      )}
      <span>1 AVAX = ${(avaxPriceUsd ?? 0).toFixed(2)} · Cập nhật {timeText}</span>
    </div>
  );
}
