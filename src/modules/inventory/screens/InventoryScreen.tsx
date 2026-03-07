import { useInventory } from '@/shared/hooks/useInventory';
import { useSellInventory, useSellAllInventory } from '@/shared/hooks/useSellInventory';
import { useOgn } from '@/shared/hooks/usePlayerProfile';
import BottomNav from '@/shared/components/BottomNav';
import Toast from '@/shared/components/Toast';
import { playSound } from '@/shared/audio';

export default function InventoryScreen() {
  const { data, isLoading, error } = useInventory();
  const sellMutation = useSellInventory();
  const sellAllMutation = useSellAllInventory();
  const ogn = useOgn();

  const items = data?.items || [];
  const expiredItems = data?.expiredItems || [];

  // Tính tổng OGN nếu bán hết
  const totalSellPrice = items.reduce((sum, item) => sum + item.sellPrice, 0);

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col overflow-hidden">

      {/* HEADER */}
      <div className="flex-shrink-0 flex flex-col px-5 pt-safe bg-white/80 backdrop-blur-sm border-b border-amber-100">
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => { playSound('ui_back'); window.history.back(); }}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="font-bold text-xl">Kho đồ</h1>
          </div>
          <div className="w-8"></div>
        </div>

        {/* TABS */}
        <div className="flex w-full mb-3 bg-gray-100/80 p-1 rounded-xl">
          <button className="flex-1 py-1.5 rounded-lg text-sm font-bold bg-white text-gray-900 shadow-sm transition-all border border-gray-200/50">
            🌾 Nông sản
          </button>
          <button
            onClick={() => { playSound('ui_click'); window.location.href = '/nft-gallery'; }}
            className="flex-1 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition-all"
          >
            🎴 Thẻ NFT
          </button>
        </div>
      </div>

      {/* THÔNG BÁO NÔNG SẢN HÉO/HẾN HẠN */}
      {expiredItems.length > 0 && (
        <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          {expiredItems.map((item, i) => (
            <p key={i} className="text-sm text-red-600">
              🥀 {item.plantEmoji} {item.plantName} đã héo — mất trắng!
            </p>
          ))}
        </div>
      )}

      {/* DANH SÁCH NÔNG SẢN */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-4 pb-28">

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <span className="text-gray-400">Đang tải kho đồ...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <span className="text-6xl mb-4">🌾</span>
            <p className="text-gray-500 font-medium">Chưa có nông sản</p>
            <p className="text-gray-400 text-sm mt-1">Thu hoạch rau quả rồi quay lại đây bán!</p>
            <a href="/farm" className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full text-sm font-medium">
              🌱 Về nông trại
            </a>
          </div>
        )}

        {/* Grid 2 cột */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              const isSelling = sellMutation.isPending && sellMutation.variables === item.id;

              // Màu thanh tươi
              const barColor = item.freshnessPercent > 50
                ? 'bg-green-500'
                : item.freshnessPercent > 20
                  ? 'bg-yellow-500'
                  : 'bg-red-500';

              return (
                <div key={item.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 relative">

                  {/* Season tag */}
                  <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.seasonTag.includes('Đúng')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                    }`}>
                    {item.seasonTag}
                  </span>

                  {/* Emoji + Name */}
                  <div className="text-center mt-1">
                    <span className="text-4xl">{item.plantEmoji}</span>
                    <p className="font-bold text-sm mt-1">{item.plantName}</p>
                  </div>

                  {/* Freshness bar */}
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} transition-all duration-500`}
                        style={{ width: `${item.freshnessPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 text-center">
                      {item.freshnessLabel}
                    </p>
                  </div>

                  {/* Giá bán */}
                  <p className="text-center text-amber-600 font-bold text-sm mt-1">
                    {item.sellPrice} OGN
                  </p>

                  {/* Nút Bán */}
                  <button
                    onClick={() => { if (!isSelling) { playSound('shop_buy'); sellMutation.mutate(item.id); } }}
                    disabled={isSelling}
                    className={`w-full mt-2 py-1.5 rounded-xl text-sm font-bold text-white transition-all ${isSelling
                        ? 'bg-gray-300'
                        : 'bg-amber-500 hover:bg-amber-600 active:scale-95'
                      }`}
                  >
                    {isSelling ? '⏳ Đang bán...' : '💰 Bán'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NÚT BÁN HẾT (fixed bottom) */}
      {items.length > 1 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[390px]">
          <button
            onClick={() => { if (!sellAllMutation.isPending) { playSound('shop_buy'); sellAllMutation.mutate(); } }}
            disabled={sellAllMutation.isPending}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all"
          >
            {sellAllMutation.isPending
              ? '⏳ Đang bán hết...'
              : `💰 Bán hết (≈${totalSellPrice} OGN)`
            }
          </button>
        </div>
      )}

      <BottomNav />
      <Toast />
    </div>
  );
}
