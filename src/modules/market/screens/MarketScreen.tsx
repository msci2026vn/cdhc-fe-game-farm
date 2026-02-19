import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface MarketData {
  index: { value: number; direction: string; percentChange: number };
  prices: Array<{
    commodityId: string;
    price: string;
    percentChange: string;
    emoji: string;
  }>;
}

export default function MarketScreen() {
  const navigate = useNavigate();
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/market/latest')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
      })
      .catch(() => {
        // API not ready yet — show placeholder data
        setData({
          index: { value: 1250, direction: 'up', percentChange: 2.3 },
          prices: [
            { commodityId: 'Lúa gạo', price: '120.50', percentChange: '1.20', emoji: '🌾' },
            { commodityId: 'Cà phê', price: '350.00', percentChange: '-0.80', emoji: '☕' },
            { commodityId: 'Cao su', price: '210.30', percentChange: '3.10', emoji: '🌳' },
            { commodityId: 'Hồ tiêu', price: '450.00', percentChange: '-1.50', emoji: '🌶️' },
            { commodityId: 'Điều', price: '280.00', percentChange: '0.60', emoji: '🥜' },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-[100dvh] max-w-[430px] mx-auto flex items-center justify-center bg-gradient-to-b from-teal-50 to-green-50">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-2">📊</div>
          <p className="text-sm text-gray-500">Đang tải dữ liệu thị trường...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[100dvh] max-w-[430px] mx-auto flex items-center justify-center bg-gradient-to-b from-teal-50 to-green-50">
        <div className="text-center">
          <div className="text-4xl mb-2">😵</div>
          <p className="text-sm text-gray-500">Không có dữ liệu thị trường</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto flex flex-col bg-gradient-to-b from-teal-50 to-green-50">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-safe pb-3 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-gray-700">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>📊</span> Giá Nông Sản
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
        {/* Composite Index */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Chỉ số tổng hợp</div>
          <div className="text-3xl font-black mt-1 flex items-baseline gap-2">
            {data.index.value.toLocaleString()}
            <span className={`text-lg font-bold ${data.index.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {data.index.direction === 'up' ? '▲' : '▼'} {data.index.percentChange}%
            </span>
          </div>
        </div>

        {/* Commodity Prices */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider px-1">Bảng giá hôm nay</h2>
          {data.prices.map(p => {
            const change = parseFloat(p.percentChange);
            return (
              <div key={p.commodityId} className="bg-white rounded-xl p-3.5 flex justify-between items-center shadow-sm border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="font-semibold text-gray-800">{p.commodityId}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{parseFloat(p.price).toFixed(2)}</div>
                  <div className={`text-sm font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Predict Buttons */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">Dự đoán xu hướng</h2>
          <div className="flex gap-3">
            <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-xl font-bold text-lg active:scale-95 transition-all shadow-md">
              🔺 TĂNG
            </button>
            <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-xl font-bold text-lg active:scale-95 transition-all shadow-md">
              🔻 GIẢM
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            Đúng: +200 OGN | Sai: -150 OGN
          </p>
        </div>
      </div>
    </div>
  );
}
