import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '@/shared/components/Toast';
import PointsFlyUp from '@/shared/components/PointsFlyUp';
import { useShopItems } from '@/shared/hooks/useShopItems';
import { useShopBuy } from '@/shared/hooks/useShopBuy';
import { useOgn, useXp, useLevel } from '@/shared/hooks/usePlayerProfile';
import { useUIStore } from '@/shared/stores/uiStore';
import { playSound, audioManager } from '@/shared/audio';
import AutoPlayShopSection from '../components/AutoPlayShopSection';
import { useTranslation } from 'react-i18next';

type ShopTab = 'seed' | 'tool' | 'card' | 'nft' | 'autoplay';

const TABS: { key: ShopTab; labelKey: string }[] = [
  { key: 'seed', labelKey: 'shop_seed' },
  { key: 'tool', labelKey: 'shop_tool' },
  { key: 'card', labelKey: 'shop_card' },
  { key: 'autoplay', labelKey: 'shop_autoplay' },
];

const RARITY_STYLES: Record<string, { border: string; badge: string; badgeText: string }> = {
  common: { border: 'transparent', badge: '', badgeText: '' },
  rare: { border: '#3498db', badge: '#3498db', badgeText: 'RARE' },
  epic: { border: '#9b59b6', badge: '#9b59b6', badgeText: 'EPIC' },
  legendary: { border: '#f0b429', badge: 'linear-gradient(135deg, #f0b429, #e67e22)', badgeText: '⭐ LEGEND' },
};

export default function ShopScreen() {
  const { t } = useTranslation();
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
    addToast(t('feature_in_development'), 'info');
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
          addToast(t('buy_success', { name: item.name, emoji: item.emoji }), 'success');
        },
        onError: (error: any) => {
          addToast(error.message || t('buy_error_generic'), 'error');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] max-w-[430px] mx-auto relative shop-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🛒</div>
          <p className="text-white font-heading">{t('loading_shop')}</p>
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
        <h1 className="font-heading text-[22px] font-bold">{t('shop_title')}</h1>
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-[20px] glass-card">
          <img src="/icons/ogn_coin.png" alt="coin" className="w-4 h-4 object-contain" />
          <span className="font-heading text-base font-bold" style={{ color: '#d49a1a' }}>
            {(ogn || 0).toLocaleString('vi-VN')}
          </span>
        </div>
      </div>

      {/* Main Shop Tabs */}
      <div className="flex w-full px-5 mb-2">
        <div className="flex w-[66.6%] bg-white/40 p-1 rounded-2xl backdrop-blur-md border border-white/50">
          <button className="flex-1 py-2 rounded-xl text-xs font-bold bg-white text-green-700 shadow-sm transition-all border border-green-200">
            {t('ogn_market')}
          </button>
          <button
            onClick={() => { playSound('ui_click'); window.location.href = '/marketplace'; }}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 transition-all"
          >
            {t('nft_market')}
          </button>
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
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Auto-play tab */}
      {activeTab === 'autoplay' && (
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-3 pb-24" style={{ scrollbarWidth: 'none' }}>
          <AutoPlayShopSection />
        </div>
      )}

      {/* Grid */}
      {activeTab !== 'autoplay' && <div
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
                  {t('off_season_tag')}
                </span>
              )}
              {item.seasonStatus === 'in_season' && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                  {t('in_season_tag')}
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
                {t('feature_in_development').replace(' 🚀', '')}
              </button>
            </div>
          );
        })}
      </div>}

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

              <span className="font-heading text-xl font-bold flex items-center justify-center gap-1.5" style={{ color: '#d49a1a' }}>
                <img src="/icons/ogn_coin.png" alt="coin" className="w-6 h-6 object-contain" /> {confirmItem.price} OGN
              </span>

            <p className="text-[11px] text-muted-foreground mb-4">
              {t('balance_after_purchase', { amount: ((ogn || 0) - (confirmItem.price || 0)).toLocaleString('vi-VN') })}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmItem(null)}
                className="flex-1 py-2.5 rounded-xl font-heading text-sm font-bold bg-muted text-muted-foreground active:scale-95 transition-transform"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmBuy}
                className="flex-1 py-2.5 rounded-xl font-heading text-sm font-bold text-white active:scale-95 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, hsl(42, 87%, 55%), hsl(38, 79%, 47%))',
                  boxShadow: '0 4px 15px rgba(240,180,41,0.3)',
                }}
              >
                {t('confirm_buy')}
              </button>
            </div>
          </div>
        </div>
      )}

            <Toast />
      <PointsFlyUp />
    </div>
  );
}
