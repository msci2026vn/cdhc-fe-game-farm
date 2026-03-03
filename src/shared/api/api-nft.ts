import { API_BASE_URL, handleUnauthorized } from './api-utils';

export interface NftCard {
  eventId: string;
  userId: string;
  nftCardType: 'last_hit' | 'top_damage' | 'dual_champion';
  nftMintStatus: 'pending' | 'minting' | 'minted' | 'failed';
  nftCardImageUrl: string | null;
  nftMetadataUri: string | null;
  nftTxHash: string | null;
  nftTokenId?: number | null;
  bossName?: string;
  bossDifficulty?: string;
  bossElement?: string;
  damage?: number;
  rank?: number;
}

export const nftApi = {
  withdrawNft: async (tokenId: number, toAddress: string) => {
    const response = await fetch(API_BASE_URL + '/api/nft/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tokenId, toAddress }),
    });
    if (response.status === 401) {
      handleUnauthorized('nft.withdrawNft');
      throw new Error('Session expired');
    }
    return response.json();
  },

  getCard: async (eventId: string): Promise<NftCard | null> => {
    const response = await fetch(API_BASE_URL + `/api/nft/card/${eventId}`, {
      credentials: 'include',
    });
    if (response.status === 401) {
      handleUnauthorized('nft.getCard');
      throw new Error('Session expired');
    }
    if (response.status === 404) return null;
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.card || null;
  },

  getMyCards: async (): Promise<NftCard[]> => {
    const response = await fetch(API_BASE_URL + '/api/nft/my-cards', {
      credentials: 'include',
    });
    if (response.status === 401) {
      handleUnauthorized('nft.getMyCards');
      throw new Error('Session expired');
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.cards || [];
  },
};
