import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { marketplaceApi, type MarketplaceListing } from '@/shared/api/api-marketplace';
import MyTransactionList from '@/modules/marketplace/components/MyTransactionList';
import { playSound } from '@/shared/audio';

type Tab = 'browse' | 'my-listings' | 'history';

const RARITY = {
  normal:       { border: 'border-gray-500/40',   shadow: '',                                           badge: 'bg-gray-600/40 text-gray-300',       textColor: 'text-gray-300',   label: 'Thường' },
  hard:         { border: 'border-amber-500/50',   shadow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',   badge: 'bg-amber-500/20 text-amber-300',     textColor: 'text-amber-300',  label: 'Hiếm' },
  extreme:      { border: 'border-purple-500/50',  shadow: 'shadow-[0_0_12px_rgba(168,85,247,0.2)]',   badge: 'bg-purple-500/20 text-purple-300',   textColor: 'text-purple-300', label: 'Sử thi' },
  catastrophic: { border: 'border-red-500/60',     shadow: 'shadow-[0_0_16px_rgba(239,68,68,0.25)]',   badge: 'bg-red-500/20 text-red-300',         textColor: 'text-red-300',    label: 'Huyền thoại' },
} as const;

type RarityKey = keyof typeof RARITY;

function getRarity(key?: string) {
  return RARITY[(key as RarityKey)] ?? RARITY.hard;
}

const CARD_ICON: Record<string, string> = {
  last_hit: '⚔️', top_damage: '💥', dual_champion: '👑',
};
const ELEMENT_ICON: Record<string, string> = {
  fire: '🔥', ice: '❄️', water: '💧', wind: '🌪️', poison: '☠️', chaos: '🌀',
};
const RARITY_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'normal', label: 'Thường' },
  { key: 'hard', label: 'Hiếm' },
  { key: 'extreme', label: 'Sử thi' },
  { key: 'catastrophic', label: 'Huyền thoại' },
];
const SORT_OPTIONS = [
  { key: 'newest', label: 'Mới nhất' },
  { key: 'price_asc', label: 'Giá thấp ↑' },
  { key: 'price_desc', label: 'Giá cao ↓' },
];
const TABS: Array<{ tab: Tab; icon: string; label: string }> = [
  { tab: 'browse', icon: '🏪', label: 'Chợ' },
  { tab: 'my-listings', icon: '📦', label: 'Của tôi' },
  { tab: 'history', icon: '📜', label: 'Lịch sử' },
];

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

// ── NFT Card (2-col grid) ─────────────────────────────
function NftListingCard({ listing, isOwn, onSelect }: {
  listing: MarketplaceListing;
  isOwn: boolean;
  onSelect: () => void;
}) {
  const r = getRarity(listing.boss.difficulty);
  const ctIcon = CARD_ICON[listing.nft.cardType] ?? '🎴';
  const elIcon = ELEMENT_ICON[listing.boss.element] ?? '';

  return (
    <button
      onClick={() => { playSound('ui_click'); onSelect(); }}
      className={`relative flex flex-col rounded-2xl overflow-hidden text-left bg-gradient-to-b from-white/[0.05] to-transparent border ${r.border} ${r.shadow} transition-transform active:scale-95`}
    >
      <div className="flex items-center justify-between px-2.5 pt-2.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.badge}`}>{r.label}</span>
        <span className="text-xs">{ctIcon}</span>
      </div>

      <div className="relative mx-2 mt-1.5">
        {listing.nft.imageUrl ? (
          <img
            src={listing.nft.imageUrl}
            alt={listing.boss.name}
            className="w-full aspect-[2/3] object-cover rounded-xl"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full aspect-[2/3] rounded-xl bg-white/[0.04] flex items-center justify-center text-4xl">🎴</div>
        )}
        {isOwn && (
          <span className="absolute top-1.5 left-1.5 bg-[#c9a84c]/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            Của tôi
          </span>
        )}
      </div>

      <div className="flex flex-col px-2.5 pt-2 pb-2.5 gap-0.5">
        <p className="text-[11px] font-bold text-white/90 leading-tight line-clamp-2">
          {elIcon} {listing.boss.name}
        </p>
        <p className="text-[13px] font-bold text-[#c9a84c] font-mono mt-1">{listing.priceAvax} AVAX</p>
        <p className="text-[10px] text-white/30 truncate">{listing.seller.name}</p>
      </div>
    </button>
  );
}

// ── Listing Detail (full-screen overlay) ─────────────
function ListingDetailModal({ listing, currentUserId, onClose, onBuy, onCancel }: {
  listing: MarketplaceListing;
  currentUserId?: string;
  onClose: () => void;
  onBuy: () => void;
  onCancel: () => void;
}) {
  const r = getRarity(listing.boss.difficulty);
  const ctIcon = CARD_ICON[listing.nft.cardType] ?? '🎴';
  const elIcon = ELEMENT_ICON[listing.boss.element] ?? '';
  const isOwn = currentUserId === listing.seller.id;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center overflow-y-auto py-8 px-4" onClick={onClose}>
      <div className="w-full max-w-sm flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
        <div className={`rounded-2xl overflow-hidden border-2 ${r.border} ${r.shadow}`} style={{ width: 240, height: 360 }}>
          {listing.nft.imageUrl ? (
            <img src={listing.nft.imageUrl} alt={listing.boss.name} className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="w-full h-full bg-white/[0.04] flex items-center justify-center text-6xl">🎴</div>
          )}
        </div>

        <div className="w-full space-y-3">
          <div className="text-center">
            <h2 className="text-white text-xl font-bold font-heading">{elIcon} {listing.boss.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${r.badge}`}>{r.label}</span>
              <span className="text-sm">{ctIcon}</span>
            </div>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">Giá bán</span>
              <span className="text-[#c9a84c] font-bold text-xl font-mono">{listing.priceAvax} AVAX</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Người bán</span>
              <span className="text-white/80">{listing.seller.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Đăng bán</span>
              <span className="text-white/40">{timeAgo(listing.listedAt)}</span>
            </div>
          </div>

          {listing.nft.txHash && (
            <a href={`https://snowscan.xyz/tx/${listing.nft.txHash}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-500/10 border border-blue-500/25 rounded-xl text-blue-400 text-sm font-medium">
              🔗 Xem trên Snowscan ↗
            </a>
          )}

          {isOwn ? (
            <button onClick={() => { playSound('ui_click'); onCancel(); }}
              className="w-full py-3.5 bg-red-500/10 border border-red-500/35 rounded-xl text-red-400 text-sm font-bold active:scale-95 transition-transform">
              ↩️ Rút về — Huỷ đăng bán
            </button>
          ) : (
            <button onClick={() => { playSound('ui_click'); onBuy(); }}
              className="w-full py-3.5 rounded-xl text-black text-sm font-bold active:scale-95 transition-transform bg-gradient-to-r from-[#c9a84c] to-[#e8c56b]">
              🛒 Mua — {listing.priceAvax} AVAX
            </button>
          )}

          <button onClick={onClose} className="w-full py-3 bg-white/[0.04] rounded-xl text-white/40 text-sm">Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ── Buy Confirm Modal ─────────────────────────────────
function BuyConfirmModal({ listing, onClose, onSuccess, navigate }: {
  listing: MarketplaceListing;
  onClose: () => void;
  onSuccess: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const r = getRarity(listing.boss.difficulty);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ snowscan: string; feePercent: number; feeAvax: string } | null>(null);

  const handleBuy = async () => {
    setPhase('loading');
    try {
      const res = await marketplaceApi.buyNft(listing.id);
      if (res.ok) {
        playSound('ui_click');
        setResult({ snowscan: res.sale?.snowscan?.nft ?? '', feePercent: res.sale?.feePercent ?? 5, feeAvax: res.sale?.feeAvax ?? '' });
        setPhase('success');
        onSuccess();
      } else {
        setError(res.error ?? 'Mua thất bại');
        setPhase('error');
      }
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại');
      setPhase('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0f1a0f] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>

        {phase === 'success' && result ? (
          <div className="text-center space-y-3">
            <div className="text-5xl">🎉</div>
            <h3 className="text-emerald-400 text-lg font-bold">Mua NFT thành công!</h3>
            <p className={`text-sm font-bold ${r.textColor}`}>{listing.boss.name} — {r.label}</p>
            <div className="bg-white/[0.04] rounded-xl p-3 space-y-1.5 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Đã trả:</span>
                <span className="text-[#c9a84c] font-bold font-mono">{listing.priceAvax} AVAX</span>
              </div>
              {result.feeAvax && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Phí GD ({result.feePercent}%):</span>
                  <span className="text-white/50 font-mono">{result.feeAvax} AVAX</span>
                </div>
              )}
            </div>
            {result.snowscan && (
              <a href={result.snowscan} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-500/10 border border-blue-500/25 rounded-xl text-blue-400 text-sm">
                🔍 Xem trên Snowscan ↗
              </a>
            )}
            <button onClick={() => { onClose(); navigate('/nft-gallery'); }}
              className="w-full py-3 rounded-xl text-black text-sm font-bold bg-gradient-to-r from-[#c9a84c] to-[#e8c56b]">
              🎴 Đến Bộ Sưu Tập
            </button>
            <button onClick={onClose} className="w-full py-2.5 bg-white/[0.04] rounded-xl text-white/40 text-sm">Đóng</button>
          </div>

        ) : phase === 'loading' ? (
          <div className="text-center space-y-3 py-6">
            <div className="animate-spin w-10 h-10 border-[3px] border-[#c9a84c] border-t-transparent rounded-full mx-auto" />
            <h3 className="text-white font-bold">Đang xử lý giao dịch...</h3>
            <p className="text-white/40 text-sm">Chuyển NFT + thanh toán AVAX on-chain</p>
            <p className="text-white/25 text-xs">Có thể mất 10–30 giây</p>
          </div>

        ) : (
          <>
            <h3 className="text-white font-bold text-lg text-center">Xác nhận mua NFT</h3>

            <div className="flex justify-center">
              {listing.nft.imageUrl ? (
                <img src={listing.nft.imageUrl} alt={listing.boss.name}
                  className={`w-36 rounded-xl border ${r.border}`}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-36 h-52 bg-white/[0.04] rounded-xl flex items-center justify-center text-5xl">🎴</div>
              )}
            </div>

            <p className={`text-center font-bold text-sm ${r.textColor}`}>{listing.boss.name} — {r.label}</p>

            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Người bán</span>
                <span className="text-white/80">{listing.seller.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Giá</span>
                <span className="text-[#c9a84c] font-bold font-mono text-base">{listing.priceAvax} AVAX</span>
              </div>
              <div className="border-t border-white/[0.08] pt-2 flex justify-between text-sm font-medium">
                <span className="text-white/70">Bạn trả:</span>
                <span className="text-white font-bold font-mono">{listing.priceAvax} AVAX</span>
              </div>
            </div>

            {phase === 'error' && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">{error}</p>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 bg-white/[0.04] rounded-xl text-white/50 text-sm font-medium">Huỷ</button>
              <button onClick={handleBuy} className="flex-1 py-3 rounded-xl text-black text-sm font-bold bg-gradient-to-r from-[#c9a84c] to-[#e8c56b]">
                ✅ Xác nhận mua
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Cancel Confirm Modal ──────────────────────────────
function CancelModal({ listing, onClose, onSuccess }: {
  listing: MarketplaceListing;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await marketplaceApi.cancelListing(listing.id);
      if (res.ok) {
        playSound('ui_click');
        onSuccess();
        onClose();
      } else {
        setError(res.error ?? 'Rút về thất bại');
      }
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0f1a0f] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <div className="text-center space-y-2">
          <div className="text-4xl">🏷️</div>
          <h3 className="text-white font-bold text-lg">Rút NFT khỏi Chợ?</h3>
          <p className="text-white/45 text-sm">NFT sẽ trở về Bộ Sưu Tập. Bạn có thể đăng lại bất cứ lúc nào.</p>
        </div>
        {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-3 bg-white/[0.04] rounded-xl text-white/50 text-sm font-medium disabled:opacity-40">
            Huỷ
          </button>
          <button onClick={handleCancel} disabled={loading}
            className="flex-1 py-3 bg-red-500/15 border border-red-500/35 rounded-xl text-red-400 text-sm font-bold disabled:opacity-40">
            {loading ? 'Đang rút...' : '↩️ Rút về'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── My Listings Tab ───────────────────────────────────
function MyListingsTab({ onCancel }: { onCancel: (l: MarketplaceListing) => void }) {
  const { data: rawListings = [], isLoading } = useQuery({
    queryKey: ['marketplace', 'my-listings'],
    queryFn: () => marketplaceApi.getMyListings(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const listings = rawListings.filter((l: MarketplaceListing) => l.status === 'active');

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-white/[0.04] animate-pulse" />)}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
        <div className="text-6xl">📦</div>
        <p className="text-white/60 font-semibold text-lg">Bạn chưa đăng bán NFT nào</p>
        <p className="text-white/35 text-sm">Vào Bộ Sưu Tập để bắt đầu rao bán</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-white/30 text-xs">{listings.length} NFT đang chờ bán</p>
      {listings.map(listing => {
        const r = getRarity(listing.boss.difficulty);
        const elIcon = ELEMENT_ICON[listing.boss.element] ?? '';
        return (
          <div key={listing.id} className={`flex gap-3 rounded-xl border ${r.border} bg-white/[0.02] p-3`}>
            {listing.nft.imageUrl ? (
              <img src={listing.nft.imageUrl} alt={listing.boss.name}
                className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-16 h-24 rounded-lg bg-white/[0.04] flex items-center justify-center text-2xl flex-shrink-0">🎴</div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.badge}`}>{r.label}</span>
                <p className="text-white/90 text-sm font-bold mt-1 line-clamp-2">{elIcon} {listing.boss.name}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-[#c9a84c] font-bold font-mono text-sm">{listing.priceAvax} AVAX</p>
                  <p className="text-white/25 text-[10px]">{timeAgo(listing.listedAt)}</p>
                </div>
                <button onClick={() => { playSound('ui_click'); onCancel(listing); }}
                  className="py-1.5 px-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-[11px] font-bold active:scale-95 transition-transform">
                  ↩️ Rút
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────
export default function MarketplaceScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: authData } = useAuth();
  const currentUserId = authData?.user?.id;

  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [filterRarity, setFilterRarity] = useState('all');
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);
  const [buyTarget, setBuyTarget] = useState<MarketplaceListing | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MarketplaceListing | null>(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['marketplace', 'listings'],
    queryFn: () => marketplaceApi.getListings(),
    staleTime: 15_000,
  });

  const filtered = useMemo(() => {
    let result = filterRarity === 'all' ? listings : listings.filter(l => l.boss.difficulty === filterRarity);
    if (sort === 'price_asc') return [...result].sort((a, b) => parseFloat(a.priceAvax) - parseFloat(b.priceAvax));
    if (sort === 'price_desc') return [...result].sort((a, b) => parseFloat(b.priceAvax) - parseFloat(a.priceAvax));
    return result;
  }, [listings, filterRarity, sort]);

  const handleBuySuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] });
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'my-listings'] });
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'my-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['nft', 'my-cards'] });
  };

  const handleCancelSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] });
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'my-listings'] });
    queryClient.invalidateQueries({ queryKey: ['nft', 'my-cards'] });
  };

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-[#0a140a] to-[#060e06] flex flex-col overflow-hidden text-white">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center px-4 pt-safe pb-3 border-b border-white/[0.06] bg-[#0a140a]/80">
        <button onClick={() => { playSound('ui_back'); navigate(-1); }}
          className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center font-bold text-lg text-[#c9a84c] font-heading">🏪 Chợ NFT</h1>
        <div className="w-10" />
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-white/[0.06]">
        {TABS.map(({ tab, icon, label }) => (
          <button key={tab} onClick={() => { playSound('ui_tab'); setActiveTab(tab); }}
            className={`flex-1 py-3 text-xs font-bold transition-all relative flex items-center justify-center gap-1.5 ${
              activeTab === tab ? 'text-[#c9a84c]' : 'text-white/35 hover:text-white/60'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
            {tab === 'browse' && listings.length > 0 && (
              <span className="bg-[#c9a84c]/20 text-[#c9a84c] text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {listings.length}
              </span>
            )}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#c9a84c] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-28">

        {/* ── BROWSE ── */}
        {activeTab === 'browse' && (
          <div>
            {/* Filter bar */}
            <div className="px-4 py-3 space-y-2 border-b border-white/[0.04]">
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {RARITY_FILTERS.map(f => {
                  const active = filterRarity === f.key;
                  const r = f.key !== 'all' ? RARITY[f.key as RarityKey] : null;
                  return (
                    <button key={f.key} onClick={() => { playSound('ui_tab'); setFilterRarity(f.key); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                        active
                          ? r ? `${r.badge} border ${r.border}` : 'bg-white/15 border border-white/20 text-white'
                          : 'bg-white/[0.06] text-white/40 hover:text-white/60'
                      }`}>
                      {f.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/30 text-xs">Sắp xếp:</span>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="bg-white/[0.06] text-white/60 text-xs rounded-lg px-2.5 py-1.5 border border-white/[0.08] outline-none">
                  {SORT_OPTIONS.map(o => (
                    <option key={o.key} value={o.key} className="bg-[#0a140a] text-white">{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.04] animate-pulse" style={{ height: 260 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
                <div className="text-6xl">🏪</div>
                <p className="text-white/65 font-semibold text-lg">Chưa có NFT nào đang bán</p>
                <p className="text-white/35 text-sm">Hãy là người đầu tiên rao bán!</p>
                <button onClick={() => navigate('/nft-gallery')}
                  className="mt-2 px-6 py-3 rounded-xl text-black text-sm font-bold bg-gradient-to-r from-[#c9a84c] to-[#e8c56b]">
                  🎴 Đến Bộ Sưu Tập
                </button>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-white/25 text-xs mb-3">{filtered.length} NFT đang bán</p>
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map(listing => (
                    <NftListingCard key={listing.id} listing={listing}
                      isOwn={currentUserId === listing.seller.id}
                      onSelect={() => setSelected(listing)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MY LISTINGS ── */}
        {activeTab === 'my-listings' && (
          <MyListingsTab onCancel={listing => setCancelTarget(listing)} />
        )}

        {/* ── HISTORY ── */}
        {activeTab === 'history' && <MyTransactionList />}
      </div>

      <div className="z-50 shrink-0"></div>

      {selected && (
        <ListingDetailModal listing={selected} currentUserId={currentUserId}
          onClose={() => setSelected(null)}
          onBuy={() => { setSelected(null); setBuyTarget(selected); }}
          onCancel={() => { setSelected(null); setCancelTarget(selected); }} />
      )}

      {buyTarget && (
        <BuyConfirmModal listing={buyTarget} onClose={() => setBuyTarget(null)}
          onSuccess={handleBuySuccess} navigate={navigate} />
      )}

      {cancelTarget && (
        <CancelModal listing={cancelTarget} onClose={() => setCancelTarget(null)}
          onSuccess={handleCancelSuccess} />
      )}
    </div>
  );
}
