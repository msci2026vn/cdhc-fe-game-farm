// ═══════════════════════════════════════════════════
// Auction TanStack Query Hooks — P5
// Queries (6) + Mutations (4) + Key factory
// ═══════════════════════════════════════════════════

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auctionApi } from '@/shared/api/api-auction';
import { useUIStore } from '@/shared/stores/uiStore';
import type { CreateAuctionInput, SubmitToQueueInput } from '../types/auction.types';

// ── Query Key Factory ──

export const auctionKeys = {
  all: ['auction'] as const,
  list: (sessionId?: string, status?: string, auctionType?: string) =>
    ['auction', 'list', sessionId, status, auctionType] as const,
  detail: (id: string) => ['auction', 'detail', id] as const,
  nextSession: ['auction', 'session', 'next'] as const,
  myBids: ['auction', 'my-bids'] as const,
  myListings: ['auction', 'my-listings'] as const,
  bidPack: (sessionId: string) => ['auction', 'bidpack', sessionId] as const,
  myQueue: ['auction', 'queue', 'my'] as const,
};

// ══════════════════════════════════
// QUERIES (6)
// ══════════════════════════════════

/** Danh sách auction (lobby) — poll 10s */
export function useAuctionList(sessionId?: string, status?: string, auctionType?: string) {
  return useQuery({
    queryKey: auctionKeys.list(sessionId, status, auctionType),
    queryFn: () => auctionApi.getList(sessionId, status, auctionType),
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

/** Danh sách queue của tôi */
export function useMyQueue() {
  return useQuery({
    queryKey: auctionKeys.myQueue,
    queryFn: () => auctionApi.getMyQueue(),
  });
}

/** Gửi NFT vào hàng chờ đấu giá */
export function useSubmitToQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitToQueueInput) => auctionApi.submitToQueue(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction', 'queue'] });
      qc.invalidateQueries({ queryKey: ['auction', 'my-listings'] });
      useUIStore.getState().addToast('NFT đã gửi vào hàng chờ đấu giá!', 'success', '📦');
    },
    onError: (err: Error) => {
      useUIStore.getState().addToast(err.message || 'Lỗi gửi NFT vào hàng chờ', 'error');
    },
  });
}

/** Rút NFT khỏi hàng chờ */
export function useCancelQueueItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (queueId: string) => auctionApi.cancelQueueItem(queueId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auction', 'queue'] });
      qc.invalidateQueries({ queryKey: ['auction', 'my-listings'] });
      useUIStore.getState().addToast('Đã rút NFT khỏi hàng chờ', 'success', '↩️');
    },
    onError: (err: Error) => {
      useUIStore.getState().addToast(err.message || 'Lỗi rút NFT', 'error');
    },
  });
}
