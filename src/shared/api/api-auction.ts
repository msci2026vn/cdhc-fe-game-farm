// ═══════════════════════════════════════════════════
// Auction API Client — P5
// ═══════════════════════════════════════════════════

import { API_BASE_URL, handleUnauthorized } from './api-utils';
import type {
  AuctionDetail,
  AuctionListItem,
  AuctionSession,
  BidPackInfo,
  CreateAuctionInput,
  PlaceBidResult,
} from '@/modules/auction/types/auction.types';

async function auctionFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(API_BASE_URL + path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    handleUnauthorized('auction' + path);
    throw new Error('Session expired');
  }

  const data = await response.json();

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

export const auctionApi = {
  // GET /api/auction/list
  getList: async (sessionId?: string, status?: string): Promise<AuctionListItem[]> => {
    const params = new URLSearchParams();
    if (sessionId) params.set('sessionId', sessionId);
    if (status) params.set('status', status);
    const query = params.toString() ? `?${params}` : '';
    const data = await auctionFetch<{ ok: boolean; data: AuctionListItem[] }>(
      `/api/auction/list${query}`,
    );
    return data.data || [];
  },

  // GET /api/auction/session/next
  getNextSession: async (): Promise<AuctionSession | null> => {
    const data = await auctionFetch<{ ok: boolean; data: AuctionSession | null }>(
      '/api/auction/session/next',
    );
    return data.data;
  },

  // GET /api/auction/:id
  getDetail: async (id: string): Promise<AuctionDetail> => {
    const data = await auctionFetch<{ ok: boolean; data: AuctionDetail }>(
      `/api/auction/${id}`,
    );
    return data.data;
  },

  // POST /api/auction/create
  create: async (input: CreateAuctionInput): Promise<{ auctionId: string }> => {
    const data = await auctionFetch<{ ok: boolean; data: { auctionId: string } }>(
      '/api/auction/create',
      { method: 'POST', body: JSON.stringify(input) },
    );
    return data.data;
  },

  // POST /api/auction/bid/:id
  placeBid: async (auctionId: string): Promise<PlaceBidResult> => {
    const data = await auctionFetch<{ ok: boolean } & PlaceBidResult>(
      `/api/auction/bid/${auctionId}`,
      { method: 'POST' },
    );
    return data;
  },

  // POST /api/auction/cancel/:id
  cancel: async (auctionId: string): Promise<void> => {
    await auctionFetch(`/api/auction/cancel/${auctionId}`, { method: 'POST' });
  },

  // POST /api/auction/withdraw/:id
  withdraw: async (auctionId: string): Promise<void> => {
    await auctionFetch(`/api/auction/withdraw/${auctionId}`, { method: 'POST' });
  },

  // GET /api/auction/my-bids
  getMyBids: async (): Promise<AuctionListItem[]> => {
    const data = await auctionFetch<{ ok: boolean; data: AuctionListItem[] }>(
      '/api/auction/my-bids',
    );
    return data.data || [];
  },

  // GET /api/auction/my-listings
  getMyListings: async (): Promise<AuctionListItem[]> => {
    const data = await auctionFetch<{ ok: boolean; data: AuctionListItem[] }>(
      '/api/auction/my-listings',
    );
    return data.data || [];
  },

  // GET /api/auction/bidpack/:sessionId
  getBidPack: async (sessionId: string): Promise<BidPackInfo> => {
    const data = await auctionFetch<{ ok: boolean; data: BidPackInfo }>(
      `/api/auction/bidpack/${sessionId}`,
    );
    return data.data;
  },
};
