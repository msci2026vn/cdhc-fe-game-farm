// ═══════════════════════════════════════════════════
// Auction TanStack Query Hooks — P5
// Queries (6) + Mutations (4) + Key factory
// ═══════════════════════════════════════════════════

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auctionApi } from '@/shared/api/api-auction';
import { useUIStore } from '@/shared/stores/uiStore';
import type { CreateAuctionInput } from '../types/auction.types';

// ── Query Key Factory ──

export const auctionKeys = {
  all: ['auction'] as const,
  list: (sessionId?: string, status?: string) =>
    ['auction', 'list', sessionId, status] as const,
  detail: (id: string) => ['auction', 'detail', id] as const,
  nextSession: ['auction', 'session', 'next'] as const,
  myBids: ['auction', 'my-bids'] as const,
  myListings: ['auction', 'my-listings'] as const,
  bidPack: (sessionId: string) => ['auction', 'bidpack', sessionId] as const,
};

// ══════════════════════════════════
// QUERIES (6)
// ══════════════════════════════════

/** Danh sách auction (lobby) — poll 10s */
export function useAuctionList(sessionId?: string, status?: string) {
  return useQuery({
    queryKey: auctionKeys.list(sessionId, status),
    queryFn: () => auctionApi.getList(sessionId, status),
    refetchInterval: 10_000,
  });
}

/** Phien tiep theo (scheduled) — poll 30s */
export function useNextSession() {
  return useQuery({
    queryKey: auctionKeys.nextSession,
    queryFn: auctionApi.getNextSession,
    refetchInterval: 30_000,
  });
}

/** Chi tiết auction — polling riêng bởi useAuctionPolling */
export function useAuctionDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: auctionKeys.detail(id),
    queryFn: () => auctionApi.getDetail(id),
    enabled: !!id && enabled,
    staleTime: 2_000,
  });
}

/** Danh sách auction đã bid */
export function useMyBids(enabled = true) {
  return useQuery({
    queryKey: auctionKeys.myBids,
    queryFn: auctionApi.getMyBids,
    enabled,
  });
}

/** Danh sách auction đã đăng bán */
export function useMyListings(enabled = true) {
  return useQuery({
    queryKey: auctionKeys.myListings,
    queryFn: auctionApi.getMyListings,
    enabled,
  });
}

/** Bid pack info cho 1 session */
export function useBidPack(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: auctionKeys.bidPack(sessionId),
    queryFn: () => auctionApi.getBidPack(sessionId),
    enabled: !!sessionId && enabled,
  });
}

// ══════════════════════════════════
// MUTATIONS (4)
// ══════════════════════════════════

/** Tao auction (seller dang NFT) */
export function useCreateAuction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAuctionInput) => auctionApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction', 'list'] });
      useUIStore.getState().addToast('Đã đăng NFT vào phiên đấu giá!', 'success', '🏷️');
    },
    onError: (error: any) => {
      useUIStore.getState().addToast(error.message || 'Không thể tạo đấu giá', 'error');
    },
  });
}

/** Penny bid */
export function usePlaceBid(auctionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => auctionApi.placeBid(auctionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: auctionKeys.detail(auctionId) });
      qc.invalidateQueries({ queryKey: ['auction', 'bidpack'] });
    },
    onError: (error: Error) => {
      useUIStore.getState().addToast(error.message || 'Bid that bai', 'error');
    },
  });
}

/** Cancel auction (seller) */
export function useCancelAuction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: string) => auctionApi.cancel(auctionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction'] });
      useUIStore.getState().addToast('Đã hủy đấu giá', 'success');
    },
    onError: (error: any) => {
      useUIStore.getState().addToast(error.message || 'Không thể hủy', 'error');
    },
  });
}

/** Withdraw bid (bidder thua) */
export function useWithdrawBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: string) => auctionApi.withdraw(auctionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: auctionKeys.all });
      useUIStore.getState().addToast('Đã rút về thành công', 'success');
    },
    onError: (error: Error) => {
      useUIStore.getState().addToast(error.message || 'Không thể rút', 'error');
    },
  });
}
