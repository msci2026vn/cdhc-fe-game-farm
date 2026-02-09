import { useState } from 'react';
import BottomNav from '@/shared/components/BottomNav';
import Toast from '@/shared/components/Toast';
import PointsFlyUp from '@/shared/components/PointsFlyUp';
import { useFarmStore } from '@/modules/farming/stores/farmStore';
import { useUIStore } from '@/shared/stores/uiStore';
import { useActivityStore } from '@/shared/stores/activityStore';

type ShopTab = 'seeds' | 'tools' | 'cards' | 'nft';

interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  price: number;
  tab: ShopTab;
  featured?: boolean;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

const SHOP_ITEMS: ShopItem[] = [
  // Seeds
  { id: 's1', name: 'Rau Cải Hữu Cơ', emoji: '🥬', desc: 'Thu hoạch +5 OGN/giờ', price: 200, tab: 'seeds' },
  { id: 's2', name: 'Cà Chua Cherry', emoji: '🍅', desc: 'Thu hoạch +8 OGN/giờ', price: 350, tab: 'seeds', featured: true },
  { id: 's3', name: 'Ớt Sừng Trâu', emoji: '🌶️', desc: 'Thu hoạch +12 OGN/giờ', price: 500, tab: 'seeds' },
  { id: 's4', name: 'Cà Rốt Baby', emoji: '🥕', desc: 'Thu hoạch +6 OGN/giờ', price: 280, tab: 'seeds' },
  { id: 's5', name: 'Dưa Hấu Vàng', emoji: '🍉', desc: 'Thu hoạch +15 OGN/giờ', price: 800, tab: 'seeds', featured: true, rarity: 'rare' },
  { id: 's6', name: 'Nấm Truffle', emoji: '🍄', desc: 'Thu hoạch +20 OGN/giờ', price: 1200, tab: 'seeds', rarity: 'epic' },
  // Tools
  { id: 't1', name: 'Phân Bón Cao Cấp', emoji: '🧴', desc: 'Tăng tốc mọc +50%', price: 150, tab: 'tools' },
  { id: 't2', name: 'Bình Tưới Bạc', emoji: '💧', desc: 'Giảm CD tưới 50%', price: 300, tab: 'tools' },
  { id: 't3', name: 'Thuốc Trừ Sâu', emoji: '🧪', desc: 'Miễn dịch sâu 1h', price: 250, tab: 'tools' },
  { id: 't4', name: 'Đèn UV', emoji: '💡', desc: 'Cây mọc ban đêm +30%', price: 400, tab: 'tools', featured: true },
  { id: 't5', name: 'Máy Bơm Nước', emoji: '⛽', desc: 'Auto tưới 4h', price: 600, tab: 'tools', rarity: 'rare' },
  { id: 't6', name: 'Vườn Rau VIP', emoji: '💎', desc: 'Mở rộng 4 ô trồng', price: 1000, tab: 'tools', featured: true, rarity: 'epic' },
  // Cards
  { id: 'c1', name: 'Thẻ Nông Dân', emoji: '🃏', desc: '+10% OGN mỗi thu hoạch', price: 500, tab: 'cards' },
  { id: 'c2', name: 'Thẻ Thời Tiết', emoji: '🌈', desc: 'Chọn thời tiết 1h', price: 800, tab: 'cards', featured: true },
  { id: 'c3', name: 'Thẻ Tăng Tốc', emoji: '⚡', desc: 'x2 tốc độ mọc 30ph', price: 350, tab: 'cards' },
  { id: 'c4', name: 'Thẻ Bảo Vệ', emoji: '🛡️', desc: 'Cây không chết 2h', price: 600, tab: 'cards', rarity: 'rare' },
  // NFT
  { id: 'n1', name: 'NFT Cây Vàng', emoji: '🌳', desc: 'Cây hiếm, +25% OGN', price: 2000, tab: 'nft', rarity: 'legendary', featured: true },
  { id: 'n2', name: 'NFT Đất Thần', emoji: '🏝️', desc: 'Đất đặc biệt +30% tốc độ', price: 3000, tab: 'nft', rarity: 'legendary' },
  { id: 'n3', name: 'NFT Pet Cún', emoji: '🐕', desc: 'Pet auto bắt sâu', price: 1500, tab: 'nft', rarity: 'epic', featured: true },
  { id: 'n4', name: 'NFT Khung Avatar', emoji: '🖼️', desc: 'Khung huyền thoại', price: 1000, tab: 'nft', rarity: 'epic' },
  { id: 'n5', name: 'NFT Trang Trại', emoji: '🏡', desc: 'Skin trang trại độc quyền', price: 2500, tab: 'nft', rarity: 'legendary' },
  { id: 'n6', name: 'NFT Hạt Giống Cổ', emoji: '✨', desc: 'Cây cổ đại, x3 OGN', price: 5000, tab: 'nft', rarity: 'legendary', featured: true },
];

const TABS: { key: ShopTab; label: string }[] = [
  { key: 'seeds', label: 'Hạt giống' },
  { key: 'tools', label: 'Dụng cụ' },
  { key: 'cards', label: 'Thẻ TP' },
  { key: 'nft', label: 'NFT' },
];

const RARITY_STYLES: Record<string, { border: string; badge: string; badgeText: string }> = {
  common: { border: 'transparent', badge: '', badgeText: '' },
  rare: { border: '#3498db', badge: '#3498db', badgeText: 'RARE' },
  epic: { border: '#9b59b6', badge: '#9b59b6', badgeText: 'EPIC' },
  legendary: { border: '#f0b429', badge: 'linear-gradient(135deg, #f0b429, #e67e22)', badgeText: '⭐ LEGEND' },
};

export default function ShopScreen() {
  const [activeTab, setActiveTab] = useState<ShopTab>('seeds');
  const [purchased, setPurchased] = useState<string[]>([]);
  const [buyAnim, setBuyAnim] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);
  const ogn = useFarmStore((s) => s.ogn);
  const addOgn = useFarmStore((s) => s.addOgn);
  const showFlyUp = useUIStore((s) => s.showFlyUp);
  const addToast = useUIStore((s) => s.addToast);
  const addPurchase = useActivityStore((s) => s.addPurchase);

  const items = SHOP_ITEMS.filter((i) => i.tab === activeTab);

  const handleBuyClick = (item: ShopItem) => {
    if (purchased.includes(item.id)) {
      addToast('Bạn đã mua vật phẩm này rồi! 📦', 'info');
      return;
    }
    if (ogn < item.price) {
      addToast('Không đủ OGN! Hãy kiếm thêm 💰', 'error');
      return;
    }
    setConfirmItem(item);
  };

  const confirmBuy = () => {
    if (!confirmItem) return;
    const item = confirmItem;
    setConfirmItem(null);

    addOgn(-item.price);
    setPurchased((p) => [...p, item.id]);
    addPurchase({ id: item.id, name: item.name, emoji: item.emoji, desc: item.desc, rarity: item.rarity });

    // Trigger buy animation
    setBuyAnim(item.id);
    setTimeout(() => setBuyAnim(null), 800);

    showFlyUp(`-${item.price} OGN 🛒`);
    addToast(`Đã mua ${item.name} ${item.emoji} thành công!`, 'success');
  };

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative shop-gradient flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-5 pt-safe pb-4">
        <h1 className="font-heading text-[22px] font-bold">🛒 Cửa hàng</h1>
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-[20px] glass-card">
          <span>🪙</span>
          <span className="font-heading text-base font-bold" style={{ color: '#d49a1a' }}>{ogn.toLocaleString('vi-VN')} OGN</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-5 mt-2">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-[20px] text-[13px] font-bold transition-all ${
              tab.key === activeTab ? 'bg-game-green-mid text-white' : 'text-muted-foreground'
            }`}
            style={tab.key !== activeTab ? { background: 'rgba(255,255,255,0.5)' } : { boxShadow: '0 4px 12px rgba(45,138,78,0.3)' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24 grid grid-cols-2 gap-3 content-start"
        style={{ scrollbarWidth: 'none' }}>
        {items.map((item) => {
          const bought = purchased.includes(item.id);
          const canAfford = ogn >= item.price;
          const rarity = item.rarity || 'common';
          const rs = RARITY_STYLES[rarity];
          const isAnimating = buyAnim === item.id;

          return (
            <div key={item.id}
              className={`bg-white rounded-xl p-4 flex flex-col items-center gap-2 relative overflow-hidden transition-all ${
                isAnimating ? 'animate-scale-in' : ''
              }`}
              style={{
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                borderWidth: 2,
                borderColor: bought ? '#2ecc71' : rs.border,
                background: bought ? 'rgba(46,204,113,0.05)' : 'white',
              }}>
              {item.featured && (
                <span className="absolute top-2 -right-5 text-[9px] font-extrabold text-white px-6 py-0.5 rotate-[35deg]"
                  style={{ background: '#f0b429' }}>⭐ HOT</span>
              )}
              {rarity !== 'common' && (
                <span className="absolute top-1.5 left-1.5 text-[8px] font-extrabold text-white px-2 py-0.5 rounded-full"
                  style={{ background: rs.badge }}>
                  {rs.badgeText}
                </span>
              )}

              {/* Buy animation overlay */}
              {isAnimating && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <span className="text-4xl animate-bounce">✅</span>
                </div>
              )}

              <span className={`text-[46px] my-1 transition-all ${isAnimating ? 'scale-125' : ''}`}
                style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>{item.emoji}</span>
              <span className="font-heading text-[13px] font-bold text-center leading-tight">{item.name}</span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{item.desc}</span>

              <button
                onClick={() => handleBuyClick(item)}
                disabled={bought}
                className="flex items-center gap-1 px-4 py-1.5 rounded-[20px] font-heading text-[13px] font-bold text-white mt-1 transition-all active:scale-95 disabled:opacity-60"
                style={{
                  background: bought ? '#2ecc71'
                    : canAfford ? 'linear-gradient(135deg, hsl(42, 87%, 55%), hsl(38, 79%, 47%))'
                    : 'linear-gradient(135deg, #bdc3c7, #95a5a6)',
                  boxShadow: bought ? 'none' : '0 3px 10px rgba(240,180,41,0.3)',
                }}>
                {bought ? '✅ Đã mua' : canAfford ? `🪙 ${item.price}` : `🔒 ${item.price}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      {confirmItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmItem(null)} />
          <div className="relative bg-white rounded-2xl p-6 mx-8 max-w-[350px] w-full animate-scale-in text-center"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <span className="text-6xl block mb-3">{confirmItem.emoji}</span>
            <h3 className="font-heading text-lg font-bold">{confirmItem.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{confirmItem.desc}</p>

            <div className="flex items-center justify-center gap-1.5 mt-3 mb-4">
              <span className="font-heading text-xl font-bold" style={{ color: '#d49a1a' }}>🪙 {confirmItem.price} OGN</span>
            </div>

            <p className="text-[11px] text-muted-foreground mb-4">
              Số dư sau mua: 🪙 {(ogn - confirmItem.price).toLocaleString()} OGN
            </p>

            <div className="flex gap-3">
              <button onClick={() => setConfirmItem(null)}
                className="flex-1 py-2.5 rounded-xl font-heading text-sm font-bold bg-muted text-muted-foreground active:scale-95 transition-transform">
                Hủy
              </button>
              <button onClick={confirmBuy}
                className="flex-1 py-2.5 rounded-xl font-heading text-sm font-bold text-white active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(135deg, hsl(42, 87%, 55%), hsl(38, 79%, 47%))', boxShadow: '0 4px 15px rgba(240,180,41,0.3)' }}>
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
