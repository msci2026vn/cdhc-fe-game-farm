import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/shared/api/api-utils';

interface Stats {
  active_count: string;
  sold_count: string;
  cancelled_count: string;
  total_volume_avax: string;
  total_count: string;
}

interface Listing {
  id: string;
  token_id: number;
  price_avax: string;
  status: string;
  seller_user_id: string;
  buyer_user_id: string | null;
  seller_name: string | null;
  buyer_name: string | null;
  nft_card_type: string | null;
  nft_card_image_url: string | null;
  boss_name: string | null;
  boss_difficulty: string | null;
  nft_tx_hash: string | null;
  sold_tx_hash: string | null;
  listed_at: string;
  sold_at: string | null;
  cancelled_at: string | null;
}

interface Withdrawal {
  id: string;
  user_id: string;
  token_id: number;
  to_address: string;
  tx_hash: string;
  created_at: string;
  user_name: string | null;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:     { label: 'Active',     cls: 'bg-green-600' },
  processing: { label: 'Processing', cls: 'bg-yellow-600' },
  sold:       { label: 'Sold',       cls: 'bg-blue-600' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-gray-600' },
};

const FILTERS = ['all', 'active', 'sold', 'cancelled'] as const;

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

const api = {
  stats: () => fetch(API_BASE_URL + '/api/marketplace/admin/stats', { credentials: 'include' }).then(r => r.json()),
  listings: (status?: string) => fetch(API_BASE_URL + `/api/marketplace/admin/all${status && status !== 'all' ? `?status=${status}` : ''}`, { credentials: 'include' }).then(r => r.json()),
  withdrawals: () => fetch(API_BASE_URL + '/api/marketplace/admin/withdrawals', { credentials: 'include' }).then(r => r.json()),
  forceCancel: (id: string) => fetch(API_BASE_URL + `/api/marketplace/admin/force-cancel/${id}`, { method: 'DELETE', credentials: 'include' }).then(r => r.json()),
};

export default function AdminMarketplaceScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('all');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const { data: statsData } = useQuery({ queryKey: ['admin', 'mp-stats'], queryFn: api.stats, staleTime: 10_000 });
  const { data: listingsData, isLoading } = useQuery({ queryKey: ['admin', 'mp-listings', filter], queryFn: () => api.listings(filter), staleTime: 10_000 });
  const { data: withdrawalsData } = useQuery({ queryKey: ['admin', 'mp-withdrawals'], queryFn: api.withdrawals, staleTime: 10_000 });

  const stats: Stats | null = statsData?.stats || null;
  const listings: Listing[] = listingsData?.listings || [];
  const withdrawals: Withdrawal[] = withdrawalsData?.withdrawals || [];

  const handleForceCancel = async (id: string) => {
    if (!confirm('Force cancel listing này?')) return;
    setCancelling(id);
    await api.forceCancel(id);
    queryClient.invalidateQueries({ queryKey: ['admin', 'mp-listings'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'mp-stats'] });
    setCancelling(null);
  };

  return (
    <div className="min-h-[100dvh] bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-800 sticky top-0 bg-gray-950 z-10">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-gray-400">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center font-bold text-lg">🏪 Admin Marketplace</h1>
        <div className="w-8" />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-green-900/30 border border-green-700/40 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.active_count}</p>
              <p className="text-xs text-gray-400">Active</p>
            </div>
            <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.sold_count}</p>
              <p className="text-xs text-gray-400">Sold</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-400">{stats.cancelled_count}</p>
              <p className="text-xs text-gray-400">Cancelled</p>
            </div>
            <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{Number(stats.total_volume_avax).toFixed(2)}</p>
              <p className="text-xs text-gray-400">Vol AVAX</p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Listings */}
        <div className="space-y-2">
          <h2 className="text-gray-400 text-sm font-medium">📋 Listings ({listings.length})</h2>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Không có listing nào</div>
          ) : (
            listings.map(l => {
              const badge = STATUS_BADGE[l.status] || STATUS_BADGE.active;
              return (
                <div key={l.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">Token #{l.token_id}</span>
                      <span className={`${badge.cls} text-white text-xs px-2 py-0.5 rounded-full`}>{badge.label}</span>
                    </div>
                    <span className="text-amber-400 font-bold">{l.price_avax} AVAX</span>
                  </div>

                  <div className="text-xs text-gray-400 space-y-0.5">
                    {l.boss_name && <p>Boss: <span className="text-gray-300">{l.boss_name}</span></p>}
                    <p>
                      Seller: <span className="text-gray-300">{l.seller_name || l.seller_user_id?.slice(0, 8)}</span>
                      {l.status === 'sold' && l.buyer_name && <> → Buyer: <span className="text-gray-300">{l.buyer_name}</span></>}
                    </p>
                    <p>{timeAgo(l.listed_at)}{l.sold_at ? ` | Sold: ${timeAgo(l.sold_at)}` : ''}</p>
                  </div>

                  {/* TX links */}
                  <div className="flex gap-3 text-xs">
                    {l.nft_tx_hash && (
                      <a href={`https://snowscan.xyz/tx/${l.nft_tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        NFT tx: {l.nft_tx_hash.slice(0, 10)}...
                      </a>
                    )}
                    {l.sold_tx_hash && (
                      <a href={`https://snowscan.xyz/tx/${l.sold_tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        AVAX tx: {l.sold_tx_hash.slice(0, 10)}...
                      </a>
                    )}
                  </div>

                  {/* Force cancel */}
                  {(l.status === 'active' || l.status === 'processing') && (
                    <button
                      onClick={() => handleForceCancel(l.id)}
                      disabled={cancelling === l.id}
                      className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      {cancelling === l.id ? 'Cancelling...' : 'Force Cancel'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Withdrawals */}
        <div className="space-y-2">
          <h2 className="text-gray-400 text-sm font-medium">📤 Withdrawals ({withdrawals.length})</h2>
          {withdrawals.length === 0 ? (
            <p className="text-center py-4 text-gray-500 text-sm">Chưa có withdrawal nào</p>
          ) : (
            withdrawals.map(w => (
              <div key={w.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-bold">Token #{w.token_id}</span>
                  <span className="text-gray-400 text-xs">{timeAgo(w.created_at)}</span>
                </div>
                <p className="text-xs text-gray-400">
                  By: <span className="text-gray-300">{w.user_name || w.user_id.slice(0, 8)}</span>
                  {' → '}<span className="text-gray-300 font-mono">{shortAddr(w.to_address)}</span>
                </p>
                <a
                  href={`https://snowscan.xyz/tx/${w.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-xs hover:text-blue-300"
                >
                  🔗 {w.tx_hash.slice(0, 14)}...
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
