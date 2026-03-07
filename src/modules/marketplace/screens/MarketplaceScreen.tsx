import { useState, useMemo } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { marketplaceApi, type MarketplaceListing } from '@/shared/api/api-marketplace';
import BottomNav from '@/shared/components/BottomNav';
import { playSound } from '@/shared/audio';

const RARITY: Record<string, { color: string; bg: string; border: string; label: string }> = {
  normal: { color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/40', label: 'Common' },
  hard: { color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', label: 'Rare' },
  extreme: { color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40', label: 'Epic' },
  catastrophic: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40', label: 'Legendary' },
};

const CARD_TYPE: Record<string, { icon: string; label: string }> = {
  last_hit: { icon: '⚔️', label: 'Người Hạ Gục Boss' },
  top_damage: { icon: '💥', label: 'Chiến Binh Mạnh Nhất' },
  dual_champion: { icon: '👑', label: 'Dual Champion' },
};

const ELEMENT_ICON: Record<string, string> = {
  fire: '🔥', ice: '❄️', water: '💧', wind: '🌪️', poison: '☠️', chaos: '🌀',
};

const DIFFICULTY_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'normal', label: 'Common' },
  { key: 'hard', label: 'Rare' },
  { key: 'extreme', label: 'Epic' },
  { key: 'catastrophic', label: 'Legendary' },
] as const;

const SORT_OPTIONS = [
  { key: 'newest', label: 'Mới nhất' },
  { key: 'price_asc', label: 'Giá thấp → cao' },
  { key: 'price_desc', label: 'Giá cao → thấp' },
] as const;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
}

function BuyConfirmModal({
  listing,
  onClose,
  onSuccess,
  navigate,
}: {
  listing: MarketplaceListing;
  onClose: () => void;
  onSuccess: () => void;
  navigate: NavigateFunction;
}) {
  const r = RARITY[listing.boss.difficulty] || RARITY.hard;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ snowscan: string; feePercent: number; feeAvax: string } | null>(null);

  const handleBuy = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await marketplaceApi.buyNft(listing.id);
      if (result.ok) {
        playSound('ui_click');
        setSuccess({
          snowscan: result.sale?.snowscan?.nft || '',
          feePercent: result.sale?.feePercent ?? 5,
          feeAvax: result.sale?.feeAvax ?? '',
        });
        onSuccess();
      } else {
        setError(result.error || 'Mua thất bại');
      }
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        {success ? (
          <div className="text-center space-y-3">
            <div className="text-5xl">🎉</div>
            <h3 className="text-green-400 text-lg font-bold">Mua NFT thành công!</h3>
            <p className={`text-sm font-bold ${r.color}`}>{listing.boss.name} — {r.label}</p>
            <div className="bg-gray-700/60 rounded-xl p-3 space-y-1.5 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Đã trả:</span>
                <span className="text-emerald-400 font-bold">{listing.priceAvax} AVAX</span>
              </div>
              {success.feeAvax && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Phí GD ({success.feePercent}%):</span>
                  <span className="text-yellow-400">{success.feeAvax} AVAX</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">NFT đã về bộ sưu tập</span>
                <span className="text-green-400">✅</span>
              </div>
            </div>
            {success.snowscan && (
              <a
                href={success.snowscan}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-2 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors"
              >
                🔍 Xem trên Snowscan ↗
              </a>
            )}
            <button
              onClick={() => { onClose(); navigate('/nft-gallery'); }}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-white text-sm font-bold transition-colors"
            >
              🎴 Đến Bộ Sưu Tập
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium"
            >
              Đóng
            </button>
          </div>
        ) : loading ? (
          <div className="text-center space-y-3 py-4">
            <div className="animate-spin w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full mx-auto" />
            <h3 className="text-white font-bold">Đang xử lý giao dịch...</h3>
            <p className="text-gray-400 text-sm">Chuyển NFT + thanh toán AVAX trên blockchain</p>
            <p className="text-gray-500 text-xs">Có thể mất 10-30 giây</p>
          </div>
        ) : (
          <>
            <h3 className="text-white font-bold text-lg text-center">Xác nhận mua NFT</h3>

            <div className="flex justify-center">
              {listing.nft.imageUrl ? (
                <img src={listing.nft.imageUrl} alt={listing.boss.name} className="w-40 rounded-xl" onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextElementSibling as HTMLElement)?.classList.remove('hidden'); }} />
              ) : null}
              <div className={`w-40 h-60 bg-gray-700 rounded-xl flex items-center justify-center text-5xl${listing.nft.imageUrl ? ' hidden' : ''}`}>🎴</div>
            </div>

            <p className={`text-center font-bold ${r.color}`}>{listing.boss.name} — {r.label}</p>

            <div className="bg-gray-700/60 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Giá:</span>
                <span className="text-emerald-400 font-bold text-lg">{listing.priceAvax} AVAX</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Người bán:</span>
                <span className="text-white">{listing.seller.name}</span>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleBuy}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-sm font-bold transition-colors"
              >
                Xác nhận mua
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ListingDetail({
  listing,
  onClose,
  onBuy,
  onCancel,
  currentUserId,
}: {
  listing: MarketplaceListing;
  onClose: () => void;
  onBuy: (l: MarketplaceListing) => void;
  onCancel: (l: MarketplaceListing) => void;
  currentUserId?: string;
}) {
  const r = RARITY[listing.boss.difficulty] || RARITY.hard;
  const ct = CARD_TYPE[listing.nft.cardType] || CARD_TYPE.last_hit;
  const elIcon = ELEMENT_ICON[listing.boss.element] || '';

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center overflow-y-auto py-8 px-4" onClick={onClose}>
      <div className="w-full max-w-sm flex flex-col items-center gap-5" onClick={e => e.stopPropagation()}>
        <div className={`rounded-2xl overflow-hidden border-2 ${r.border}`} style={{ width: 260, height: 380 }}>
          {listing.nft.imageUrl ? (
            <img src={listing.nft.imageUrl} alt={listing.boss.name} className="w-full h-full object-cover" onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextElementSibling as HTMLElement)?.classList.remove('hidden'); }} />
          ) : null}
          <div className={`w-full h-full bg-gray-800 flex items-center justify-center text-6xl${listing.nft.imageUrl ? ' hidden' : ''}`}>🎴</div>
        </div>

        <div className="w-full space-y-3">
          <div className="text-center">
            <h2 className="text-white text-xl font-bold">{elIcon} {listing.boss.name}</h2>
            <span className={`text-sm font-bold ${r.color}`}>{r.label}</span>
          </div>

          <div className={`${r.bg} ${r.border} border rounded-xl px-4 py-3 text-center`}>
            <span className="text-lg mr-2">{ct.icon}</span>
            <span className="text-white font-semibold text-sm">{ct.label}</span>
          </div>

          <div className="bg-gray-800/80 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Giá bán</span>
              <span className="text-emerald-400 font-bold text-base">{listing.priceAvax} AVAX</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Người bán</span>
              <span className="text-white">{listing.seller.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Đăng bán</span>
              <span className="text-gray-300">{timeAgo(listing.listedAt)}</span>
            </div>
          </div>

          {listing.nft.txHash && (
            <a
              href={`https://snowscan.xyz/tx/${listing.nft.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors"
            >
              🔗 Xem trên Snowscan
            </a>
          )}

          {currentUserId === listing.seller.id ? (
            <button
              onClick={() => { playSound('ui_click'); onCancel(listing); }}
              className="w-full py-3 bg-red-600/20 border border-red-500/50 hover:bg-red-600/30 rounded-xl text-red-400 text-sm font-bold transition-colors active:scale-95"
            >
              ↩️ Rút về — Huỷ đăng bán
            </button>
          ) : (
            <button
              onClick={() => { playSound('ui_click'); onBuy(listing); }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-sm font-bold transition-colors active:scale-95"
            >
              Mua — {listing.priceAvax} AVAX
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium mt-2"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export default function MarketplaceScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: authData } = useAuth();
  const currentUserId = authData?.user?.id;
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['marketplace', 'listings'],
    queryFn: () => marketplaceApi.getListings(),
    staleTime: 15_000,
  });

  const [selected, setSelected] = useState<MarketplaceListing | null>(null);
  const [buyTarget, setBuyTarget] = useState<MarketplaceListing | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MarketplaceListing | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [sort, setSort] = useState('newest');

  const filtered = useMemo(() => {
    let result = filterDifficulty === 'all'
      ? listings
      : listings.filter(l => l.boss.difficulty === filterDifficulty);

    if (sort === 'price_asc') result = [...result].sort((a, b) => parseFloat(a.priceAvax) - parseFloat(b.priceAvax));
    else if (sort === 'price_desc') result = [...result].sort((a, b) => parseFloat(b.priceAvax) - parseFloat(a.priceAvax));

    return result;
  }, [listings, filterDifficulty, sort]);

  const handleBuyRequest = (listing: MarketplaceListing) => {
    setSelected(null);
    setBuyTarget(listing);
  };

  const handleBuySuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] });
    queryClient.invalidateQueries({ queryKey: ['nft', 'my-cards'] });
  };

  const handleCancelRequest = (listing: MarketplaceListing) => {
    setSelected(null);
    setCancelTarget(listing);
    setCancelError('');
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    setCancelError('');
    try {
      const result = await marketplaceApi.cancelListing(cancelTarget.id);
      if (result.ok) {
        playSound('ui_click');
        setCancelTarget(null);
        queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] });
        queryClient.invalidateQueries({ queryKey: ['marketplace', 'my-listings'] });
        queryClient.invalidateQueries({ queryKey: ['nft', 'my-cards'] });
      } else {
        setCancelError(result.error || 'Rút về thất bại');
      }
    } catch {
      setCancelError('Lỗi kết nối, vui lòng thử lại');
    }
    setCancelLoading(false);
  };

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center px-4 pt-safe pb-3 border-b border-gray-800">
        <button onClick={() => { playSound('ui_back'); navigate(-1); }} className="w-8 h-8 flex items-center justify-center text-gray-400">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-white font-bold text-lg">Chợ NFT</h1>
        <div className="w-8" />
      </div>

      {/* Main Shop Tabs */}
      <div className="flex w-full px-4 mt-3 mb-1">
        <div className="flex w-[66.6%] bg-gray-800/80 p-1 rounded-2xl border border-gray-700/50">
          <button
            onClick={() => { playSound('ui_click'); window.location.href = '/shop'; }}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-gray-200 transition-all"
          >
            🏪 Chợ OGN
          </button>
          <button className="flex-1 py-2 rounded-xl text-xs font-bold bg-gray-700 text-purple-400 shadow-sm transition-all border border-gray-600/50">
            🎴 Chợ NFT
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-4 py-3 space-y-2 border-b border-gray-800/50">
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {DIFFICULTY_FILTERS.map(f => {
            const active = filterDifficulty === f.key;
            const r = f.key !== 'all' ? RARITY[f.key] : null;
            return (
              <button
                key={f.key}
                onClick={() => { playSound('ui_tab'); setFilterDifficulty(f.key); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${active
                  ? r ? `${r.bg} ${r.border} border ${r.color}` : 'bg-white/20 border border-white/30 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">Sắp xếp:</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-gray-800 text-gray-300 text-xs rounded-lg px-2 py-1 border border-gray-700 outline-none"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto pb-28 px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full" />
            <span className="text-gray-400 text-sm">Đang tải...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="text-6xl">🏪</div>
            <p className="text-gray-300 font-semibold text-lg">Chưa có NFT nào đang bán</p>
            <p className="text-gray-500 text-sm">Hãy là người đầu tiên rao bán!</p>
            <button
              onClick={() => navigate('/nft-gallery')}
              className="mt-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-white text-sm font-bold transition-colors"
            >
              🎴 Đến Bộ Sưu Tập để Đăng Bán
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-400 text-xs mb-3">{filtered.length} NFT đang bán</p>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(listing => {
                const r = RARITY[listing.boss.difficulty] || RARITY.hard;
                const ct = CARD_TYPE[listing.nft.cardType] || CARD_TYPE.last_hit;
                return (
                  <button
                    key={listing.id}
                    onClick={() => { playSound('ui_click'); setSelected(listing); }}
                    className={`rounded-2xl border ${r.border} ${r.bg} overflow-hidden text-left transition-transform active:scale-95`}
                  >
                    {listing.nft.imageUrl ? (
                      <img src={listing.nft.imageUrl} alt={listing.boss.name} className="w-full aspect-[2/3] object-cover" onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextElementSibling as HTMLElement)?.classList.remove('hidden'); }} />
                    ) : null}
                    <div className={`w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-5xl${listing.nft.imageUrl ? ' hidden' : ''}`}>🎴</div>
                    <div className="px-3 py-2 space-y-1">
                      <p className="text-white text-xs font-bold truncate">{listing.boss.name}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold ${r.color}`}>{r.label}</span>
                        <span className="text-[10px] text-gray-400">{ct.icon}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 text-xs font-bold">{listing.priceAvax} AVAX</span>
                      </div>
                      <p className="text-gray-500 text-[10px] truncate">by {listing.seller.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>

      <div className="z-50 shrink-0"><BottomNav /></div>

      {selected && (
        <ListingDetail
          listing={selected}
          onClose={() => setSelected(null)}
          onBuy={handleBuyRequest}
          onCancel={handleCancelRequest}
          currentUserId={currentUserId}
        />
      )}

      {/* Cancel / Rút về confirm modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={() => setCancelTarget(null)}>
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-2">
              <div className="text-4xl">🏷️</div>
              <h3 className="text-white font-bold text-lg">Rút NFT khỏi Chợ?</h3>
              <p className="text-gray-400 text-sm">NFT sẽ trở về Bộ Sưu Tập. Bạn có thể đăng lại bất cứ lúc nào.</p>
            </div>
            {cancelError && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">{cancelError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelLoading}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelLoading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {cancelLoading ? 'Đang rút...' : '↩️ Rút về'}
              </button>
            </div>
          </div>
        </div>
      )}

      {buyTarget && (
        <BuyConfirmModal
          listing={buyTarget}
          onClose={() => setBuyTarget(null)}
          onSuccess={handleBuySuccess}
          navigate={navigate}
        />
      )}
    </div>
  );
}
