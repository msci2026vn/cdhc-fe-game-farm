import { API_BASE_URL, handleUnauthorized } from './api-utils';

export interface MarketplaceTransaction {
  id: string;
  token_id: number;
  price_avax: string;
  fee_percent: string;
  fee_avax: string;
  seller_receives_avax: string;
  seller_is_vip: boolean;
  nft_tx_hash: string | null;
  payment_tx_hash: string | null;
  status: string;
  created_at: string;
  role: 'buy' | 'sell';
  partner_name: string | null;
  card_type: string | null;
  image_url: string | null;
  boss_name: string | null;
  boss_difficulty: string | null;
}

export interface MarketplaceListing {
  id: string;
  tokenId: number;
  priceAvax: string;
  status?: string;
  listedAt: string;
  seller: { id: string; name: string };
  nft: {
    cardType: 'last_hit' | 'top_damage' | 'dual_champion';
    imageUrl: string | null;
    txHash: string | null;
  };
  boss: {
    name: string;
    difficulty: string;
    element: string;
  };
}

export const marketplaceApi = {
  getListings: async (): Promise<MarketplaceListing[]> => {
    const response = await fetch(API_BASE_URL + '/api/marketplace', {
      credentials: 'include',
    });
    if (response.status === 401) {
      handleUnauthorized('marketplace.getListings');
      throw new Error('Session expired');
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.listings || [];
  },

  listNft: async (tokenId: number, priceAvax: string): Promise<{ ok: boolean; listing?: MarketplaceListing; error?: string }> => {
    const response = await fetch(API_BASE_URL + '/api/marketplace/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tokenId, priceAvax }),
    });
    if (response.status === 401) {
      handleUnauthorized('marketplace.listNft');
      throw new Error('Session expired');
    }
    return response.json();
  },

  buyNft: async (listingId: string): Promise<{ ok: boolean; sale?: { tokenId: number; priceAvax: string; feePercent: number; feeAvax: string; sellerReceives: string; nftTxHash: string; paymentTxHash: string; snowscan: { nft: string; payment: string | null; fee: string | null; seller: string | null } }; error?: string }> => {
    const response = await fetch(API_BASE_URL + `/api/marketplace/buy/${listingId}`, {
      method: 'POST',
      credentials: 'include',
    });
    if (response.status === 401) {
      handleUnauthorized('marketplace.buyNft');
      throw new Error('Session expired');
    }
    return response.json();
  },

  cancelListing: async (listingId: string): Promise<{ ok: boolean; error?: string }> => {
    const response = await fetch(API_BASE_URL + `/api/marketplace/list/${listingId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (response.status === 401) {
      handleUnauthorized('marketplace.cancelListing');
      throw new Error('Session expired');
    }
    return response.json();
  },

  getMyListings: async (): Promise<MarketplaceListing[]> => {
    const response = await fetch(API_BASE_URL + '/api/marketplace/my-listings', {
      credentials: 'include',
    });
    if (response.status === 401) {
      handleUnauthorized('marketplace.getMyListings');
      throw new Error('Session expired');
    }
    if (!response.ok) return [];
    const data = await response.json();
    return data.listings || [];
  },

  getMyTransactions: async (type?: 'buy' | 'sell', page = 1): Promise<{ transactions: MarketplaceTransaction[]; pagination: { page: number; limit: number; hasMore: boolean } }> => {
    const params = new URLSearchParams({ page: String(page) });
    if (type) params.set('type', type);
    const response = await fetch(`${API_BASE_URL}/api/marketplace/my-transactions?${params}`, {
      credentials: 'include',
    });
    if (response.status === 401) {
      handleUnauthorized('marketplace.getMyTransactions');
      throw new Error('Session expired');
    }
    if (!response.ok) return { transactions: [], pagination: { page: 1, limit: 20, hasMore: false } };
    const data = await response.json();
    return data.data || { transactions: [], pagination: { page: 1, limit: 20, hasMore: false } };
  },
};
