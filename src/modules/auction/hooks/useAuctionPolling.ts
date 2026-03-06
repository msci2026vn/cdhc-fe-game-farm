// ═══════════════════════════════════════════════════
// Auction Live Polling — P5
// 2s active, 1s sudden_death, off when ended
// ═══════════════════════════════════════════════════

import { useQuery } from '@tanstack/react-query';
import { auctionApi } from '@/shared/api/api-auction';
import type { AuctionStatus } from '../types/auction.types';
import { auctionKeys } from './useAuction';

function getPollingInterval(status?: AuctionStatus): number | false {
  switch (status) {
    case 'active':
      return 2_000;
    case 'sudden_death':
      return 1_000;
    default:
      return false;
  }
}

/**
 * Live polling for auction detail.
 * Use this instead of useAuctionDetail when viewing an active auction room.
 * Automatically adjusts polling speed based on auction status.
 */
export function useAuctionLivePolling(auctionId: string, currentStatus?: AuctionStatus) {
  return useQuery({
    queryKey: auctionKeys.detail(auctionId),
    queryFn: () => auctionApi.getDetail(auctionId),
    enabled: !!auctionId && (currentStatus === 'active' || currentStatus === 'sudden_death'),
    refetchInterval: getPollingInterval(currentStatus),
    refetchIntervalInBackground: false,
    placeholderData: (prev: unknown) => prev,
  });
}
