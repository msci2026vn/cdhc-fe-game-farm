// ═══════════════════════════════════════════════════
// Auction FE Types — mirrors BE auction.types.ts
// ═══════════════════════════════════════════════════

export type AuctionStatus = 'pending' | 'active' | 'sudden_death' | 'ended' | 'cancelled';
export type SessionStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';

export interface AuctionSession {
  id: string;
  name: string;
  status: SessionStatus;
  slotCount: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  bidCostOgn: number;
  freeBidsPerSession: number;
  minIncrementAvax: string;
}

export interface AuctionListItem {
  id: string;
  tokenId: number;
  nftImageUrl: string | null;
  bidCount: number;
  status: AuctionStatus;
  endTime: string;
  sessionName: string;
  sellerName: string;
}

export interface AuctionDetail {
  id: string;
  sessionId: string;
  sellerUserId: string;
  tokenId: number;
  nftImageUrl: string | null;
  status: AuctionStatus;
  bidCount: number;
  endTime: string;
  sessionName: string;
  startPriceAvax: string;
  myLastBidAvax: string | null;
  myBidCount: number;
  winnerName: string | null;
  finalPriceAvax: string | null;
  leaderboard: LeaderboardEntry[] | null;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  bidCount: number;
  lastBidAvax: string;
  isWinner: boolean;
}

export interface PlaceBidResult {
  newPrice: string;
  bidNumber: number;
  isAntiSnipeExtended: boolean;
  newEndTime: string | null;
  freeBidsRemaining: number;
  totalBidsUsed: number;
}

export interface BidPackInfo {
  freeBidsRemaining: number;
  totalBidsUsed: number;
  maxBidsPerSession: number;
}

export interface CreateAuctionInput {
  tokenId: number;
  sessionId: string;
  startPriceAvax: string;
}
