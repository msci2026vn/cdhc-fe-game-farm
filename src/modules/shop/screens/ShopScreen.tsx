import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/shared/components/BottomNav';
import Toast from '@/shared/components/Toast';
import PointsFlyUp from '@/shared/components/PointsFlyUp';
import { useShopItems } from '@/shared/hooks/useShopItems';
import { useShopBuy } from '@/shared/hooks/useShopBuy';
import { useOgn, useXp, useLevel } from '@/shared/hooks/usePlayerProfile';
import { useUIStore } from '@/shared/stores/uiStore';
import { playSound, audioManager } from '@/shared/audio';

type ShopTab = 'seed' | 'tool' | 'card' | 'nft';

const TABS: { key: ShopTab; label: string }[] = [
  { key: 'seed', label: 'Hạt giống' },
  { key: 'tool', label: 'Dụng cụ' },
  { key: 'card', label: 'Thẻ TP' },
  { key: 'nft', label: 'NFT' },
];

const RARITY_STYLES: Record<string, { border: string; badge: string; badgeText: string }> = {
  common: { border: 'transparent', badge: '', badgeText: '' },
  rare: { border: '#3498db', badge: '#3498db', badgeText: 'RARE' },
  epic: { border: '#9b59b6', badge: '#9b59b6', badgeText: 'EPIC' },
  legendary: { border: '#f0b429', badge: 'linear-gradient(135deg, #f0b429, #e67e22)', badgeText: '⭐ LEGEND' },
};

export default function ShopScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ShopTab>('seed');

  // BGM
  useEffect(() => {
    audioManager.preloadScene('shop');
    audioManager.startBgm('shop');
    return () => { audioManager.stopBgm(); };
  }, []);
  const [confirmItem, setConfirmItem] = useState<any>(null);
  const [buyAnim, setBuyAnim] = useState<string | null>(null);

  const level = useLevel();
  const xp = useXp();
  const ogn = useOgn();
  const showFlyUp = useUIStore((s) => s.showFlyUp);
  const addToast = useUIStore((s) => s.addToast);

  // API hooks
  const { data: shopData, isLoading } = useShopItems();
  const buyMutation = useShopBuy();

  const items = shopData?.items || [];
  const tabItems = items.filter((i) => i.category === activeTab);

  const handleBuyClick = (_item: any) => {
    playSound('ui_click');
    addToast('Chức năng đang phát triển 🚀', 'info');
  };

  const confirmBuy = () => {
    if (!confirmItem) return;
    const item = confirmItem;
    setConfirmItem(null);

    buyMutation.mutate(
      { itemId: item.id, quantity: 1 },
      {
        onSuccess: (data) => {
          playSound('shop_buy');
          setBuyAnim(item.id);
          setTimeout(() => setBuyAnim(null), 800);
          showFlyUp(`-${data.ognSpent} OGN 🛒`);
          addToast(`Đã mua ${item.name} ${item.emoji} thành công!`, 'success');
        },
        onError: (error: any) => {
          addToast(error.message || 'Không thể mua vật phẩm', 'error');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] max-w-[430px] mx-auto relative shop-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🛒</div>
          <p className="text-white font-heading">Đang tải cửa hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto relative shop-gradient flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center px-5 pt-safe pb-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center text-xl header-btn-glass">
          ←
        </button>
        <h1 className="font-heading text-[22px] font-bold">🛒 Cửa hàng</h1>
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-[20px] glass-card">
          <span>🪙</span>
          <span className="font-heading text-base font-bold" style={{ color: '#d49a1a' }}>
            {(ogn || 0).toLocaleString('vi-VN')}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex gap-1.5 px-5 mt-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); playSound('ui_tab'); }}
            className={`flex-1 py-2 rounded-[20px] text-[13px] font-bold transition-all ${tab.key === activeTab ? 'bg-game-green-mid text-white' : 'text-muted-foreground'
              }`}
            style={
              tab.key !== activeTab
                ? { background: 'rgba(255,255,255,0.5)' }
                : { boxShadow: '0 4px 12px rgba(45,138,78,0.3)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-5 pt-3 pb-24 grid grid-cols-2 gap-3 content-start"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabItems.map((item) => {
          const canAfford = ogn >= item.price;
          const rarity = item.rarity || 'common';
          const rs = RARITY_STYLES[rarity];
          const isAnimating = buyAnim === item.id;
          const isBuying = buyMutation.isPending && buyMutation.variables?.itemId === item.id;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl p-4 flex flex-col items-center gap-2 relative overflow-hidden transition-all ${isAnimating ? 'animate-scale-in' : ''
                }`}
              style={{
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                borderWidth: 2,
                borderColor: rs.border,
                background: item.owned > 0 ? 'rgba(46,204,113,0.05)' : 'white',
              }}
            >
              {rarity !== 'common' && (
                <span
                  className="absolute top-1.5 left-1.5 text-[8px] font-extrabold text-white px-2 py-0.5 rounded-full"
                  style={{ background: rs.badge }}
                >
                  {rs.badgeText}
                </span>
              )}

              {item.owned > 0 && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-bold text-white px-2 py-0.5 rounded-full bg-game-green-mid">
                  ×{item.owned}
                </span>
              )}

              {/* Season tag */}
              {item.seasonStatus === 'off_season' && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  Trái vụ ⚠️
                </span>
              )}
              {item.seasonStatus === 'in_season' && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                  Đúng vụ ✅
                </span>
              )}

              {isAnimating && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <span className="text-4xl animate-bounce">✅</span>
                </div>
              )}

              <span
                className={`text-[46px] my-1 transition-all ${isAnimating ? 'scale-125' : ''}`}
                style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
              >
                {item.emoji}
              </span>
              <span className="font-heading text-[13px] font-bold text-center leading-tight">{item.name}</span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2">
                {item.desc}
              </span>

              <button
                onClick={() => handleBuyClick(item)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-[20px] font-heading text-[11px] font-bold text-white mt-1 transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #bdc3c7, #95a5a6)',
                  boxShadow: 'none',
                }}
              >
                Đang phát triển
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      {confirmItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmItem(null)} />
          <div
            className="relative bg-white rounded-2xl p-6 mx-8 max-w-[350px] w-full animate-scale-in text-center"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <span className="text-6xl block mb-3">{confirmItem.emoji}</span>
            <h3 className="font-heading text-lg font-bold">{confirmItem.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{confirmItem.desc}</p>

            <div className="flex items-center justify-center gap-1.5 mt-3 mb-4">
              <span className="font-heading text-xl font-bold" style={{ color: '#d49a1a' }}>
                🪙 {confirmItem.price} OGN
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground mb-4">
              Số dư sau mua: 🪙 {((ogn || 0) - (confirmItem.price || 0)).toLocaleString('vi-VN')} OGN
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmItem(null)}
                className="flex-1 py-2.5 rounded-xl font-heading text-sm font-bold bg-muted text-muted-foreground active:scale-95 transition-transform"
              >
                Hủy
              </button>
              <button
                onClick={confirmBuy}
                className="flex-1 py-2.5 rounded-xl font-heading text-sm font-bold text-white active:scale-95 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, hsl(42, 87%, 55%), hsl(38, 79%, 47%))',
                  boxShadow: '0 4px 15px rgba(240,180,41,0.3)',
                }}
              >
                Xác nhận mua
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
      <Toast />
      <PointsFlyUp />
    </div>
  );
}
