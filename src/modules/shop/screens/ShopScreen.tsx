import { useState } from 'react';
import BottomNav from '@/shared/components/BottomNav';
import { useFarmStore } from '@/modules/farming/stores/farmStore';

const TABS = ['Hạt giống', 'Dụng cụ', 'Thẻ TP', 'NFT'];

const ITEMS = [
  { id: '1', name: 'Rau Cải Hữu Cơ', emoji: '🥬', desc: 'Thu hoạch +5 OGN/giờ', price: 200 },
  { id: '2', name: 'Cà Chua Cherry', emoji: '🍅', desc: 'Thu hoạch +8 OGN/giờ', price: 350, featured: true },
  { id: '3', name: 'Ớt Sừng Trâu', emoji: '🌶️', desc: 'Thu hoạch +12 OGN/giờ', price: 500 },
  { id: '4', name: 'Cà Rốt Baby', emoji: '🥕', desc: 'Thu hoạch +6 OGN/giờ', price: 280 },
  { id: '5', name: 'Phân Bón Cao Cấp', emoji: '🧴', desc: 'Tăng tốc +50%', price: 150 },
  { id: '6', name: 'Vườn Rau VIP', emoji: '💎', desc: 'Mở rộng 4 ô trồng', price: 1000, featured: true },
];

export default function ShopScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const ogn = useFarmStore((s) => s.ogn);

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative shop-gradient flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-5 pt-[50px] pb-4">
        <h1 className="font-heading text-[22px] font-bold">🛒 Cửa hàng</h1>
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-[20px] glass-card">
          <span>🪙</span>
          <span className="font-heading text-base font-bold" style={{ color: '#d49a1a' }}>{ogn.toLocaleString('vi-VN')} OGN</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-5 mt-2">
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`px-4 py-2 rounded-[20px] text-[13px] font-bold transition-all ${
              i === activeTab
                ? 'bg-game-green-mid text-white'
                : 'text-muted-foreground'
            }`}
            style={i !== activeTab ? { background: 'rgba(255,255,255,0.5)' } : { boxShadow: '0 4px 12px rgba(45,138,78,0.3)' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24 grid grid-cols-2 gap-3 content-start"
        style={{ scrollbarWidth: 'none' }}>
        {ITEMS.map((item) => (
          <div key={item.id}
            className={`bg-white rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-[0.96] relative overflow-hidden ${
              item.featured ? 'border-2 border-game-gold-DEFAULT' : ''
            }`}
            style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            {item.featured && (
              <span className="absolute top-2 -right-5 text-[9px] font-extrabold text-white px-6 py-0.5 rotate-[35deg]"
                style={{ background: '#f0b429' }}>⭐ HOT</span>
            )}
            <span className="text-[46px] my-1" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>{item.emoji}</span>
            <span className="font-heading text-[13px] font-bold text-center">{item.name}</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">{item.desc}</span>
            <span className="flex items-center gap-1 px-4 py-1.5 rounded-[20px] btn-gold font-heading text-[13px] font-bold text-white mt-1">
              🪙 {item.price}
            </span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
