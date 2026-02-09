import ScreenShell from '@/shared/components/ScreenShell';

const MOCK_ITEMS = [
  { id: '1', name: 'Hạt Cà Chua', emoji: '🍅', price: 200, desc: 'Cây cơ bản, dễ trồng' },
  { id: '2', name: 'Hạt Rau Muống', emoji: '🥬', price: 150, desc: 'Mọc nhanh, thưởng ít' },
  { id: '3', name: 'Hạt Dưa Leo', emoji: '🥒', price: 350, desc: 'Thưởng cao, lâu chín' },
  { id: '4', name: 'Phân bón Vàng', emoji: '✨', price: 500, desc: 'Tăng tốc 2x', hot: true },
  { id: '5', name: 'Chậu Vàng', emoji: '🏆', price: 1000, desc: 'Skin chậu đặc biệt', hot: true },
  { id: '6', name: 'Nước Thần', emoji: '💎', price: 800, desc: 'Reset cooldown tưới' },
];

export default function ShopScreen() {
  return (
    <ScreenShell>
      <div className="px-4 py-4">
        <h2 className="font-heading font-bold text-xl mb-4">🛒 Cửa hàng</h2>
        <div className="grid grid-cols-2 gap-3">
          {MOCK_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`relative bg-card rounded-2xl border p-4 flex flex-col items-center gap-2 shadow-sm transition-all active:scale-95 ${
                item.hot ? 'border-secondary gold-glow' : 'border-border'
              }`}
            >
              {item.hot && (
                <span className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Hot 🔥
                </span>
              )}
              <span className="text-4xl">{item.emoji}</span>
              <h3 className="font-heading font-semibold text-sm text-center">{item.name}</h3>
              <p className="text-[10px] text-muted-foreground text-center">{item.desc}</p>
              <button className="w-full bg-primary text-primary-foreground font-bold text-xs py-2 rounded-xl mt-auto transition-all active:scale-95">
                🪙 {item.price} OGN
              </button>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}
