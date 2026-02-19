import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types (match backend response) ───────────────────────────────────────────
interface MarketIndex {
  value: number;
  direction: 'up' | 'down';
  percentChange: number;
}

interface CommodityPrice {
  commodityId: string;
  name?: string;
  price: string;
  percentChange: string;
  emoji: string;
}

interface MarketData {
  index: MarketIndex;
  prices: CommodityPrice[];
}

interface PredictResult {
  success: boolean;
  direction?: 'up' | 'down';
  message: string;
  alreadyPredicted?: boolean;
}

const BASE = 'https://sta.cdhc.vn';

// ─── Component ────────────────────────────────────────────────────────────────
export default function MarketScreen() {
  const navigate = useNavigate();

  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [predicting, setPredicting] = useState(false);
  const [predictResult, setPredictResult] = useState<PredictResult | null>(null);

  // ── Fetch market data on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetchMarketData();
  }, []);

  async function fetchMarketData() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${BASE}/api/market/latest`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError('Không có dữ liệu thị trường');
      }
    } catch (err) {
      console.error('[Market] fetchMarketData error:', err);
      setError('Không thể kết nối server');
    } finally {
      setLoading(false);
    }
  }

  // ── Predict handler ─────────────────────────────────────────────────────────
  async function handlePredict(direction: 'up' | 'down') {
    if (predicting || predictResult?.success || predictResult?.alreadyPredicted) return;

    try {
      setPredicting(true);
      setPredictResult(null);

      const res = await fetch(`${BASE}/api/market/predict`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      const json = await res.json();

      if (res.status === 401) {
        navigate('/login');
        return;
      }

      if (res.ok && json.success) {
        setPredictResult({
          success: true,
          direction,
          message: direction === 'up'
            ? '🔺 Đã dự đoán TĂNG! Kết quả công bố ngày mai.'
            : '🔻 Đã dự đoán GIẢM! Kết quả công bố ngày mai.',
        });
      } else {
        // Handle known error codes
        const code = json?.error?.code || '';
        const msg = json?.error?.message || 'Không thể dự đoán';

        if (code === 'ALREADY_PREDICTED' || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('đã dự đoán')) {
          setPredictResult({
            success: false,
            alreadyPredicted: true,
            message: '📅 Bạn đã dự đoán hôm nay rồi. Quay lại ngày mai!',
          });
        } else if (code === 'NOT_TRADING_DAY') {
          setPredictResult({
            success: false,
            message: '🚫 Hôm nay không phải ngày giao dịch.',
          });
        } else {
          setPredictResult({
            success: false,
            message: msg,
          });
        }
      }
    } catch (err) {
      console.error('[Market] handlePredict error:', err);
      setPredictResult({
        success: false,
        message: 'Lỗi kết nối, thử lại nhé!',
      });
    } finally {
      setPredicting(false);
    }
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[100dvh] max-w-[430px] mx-auto flex items-center justify-center bg-gradient-to-b from-teal-50 to-green-50">
        <div className="text-center">
          <div className="animate-pulse text-5xl mb-3">📊</div>
          <p className="text-sm text-gray-500 font-medium">Đang tải dữ liệu thị trường...</p>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="h-[100dvh] max-w-[430px] mx-auto flex flex-col bg-gradient-to-b from-teal-50 to-green-50">
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
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="text-5xl">😵</div>
          <p className="text-sm text-gray-500 text-center">{error || 'Không có dữ liệu'}</p>
          <button
            onClick={fetchMarketData}
            className="px-6 py-2.5 bg-teal-500 text-white rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  const isUp = data.index.direction === 'up';
  const buttonsDisabled = predicting || !!predictResult?.success || !!predictResult?.alreadyPredicted;

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
        <button
          onClick={fetchMarketData}
          className="ml-auto w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center active:scale-95 transition-transform text-teal-600"
          title="Làm mới"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>

        {/* ── Composite Index ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Chỉ số tổng hợp</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">
              {typeof data.index.value === 'number' ? data.index.value.toFixed(2) : data.index.value}
            </span>
            <span className={`text-base font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
              {isUp ? '▲' : '▼'} {data.index.percentChange}%
            </span>
          </div>
        </div>

        {/* ── Commodity Prices ── */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Bảng giá hôm nay</h2>
          {data.prices.map(p => {
            const change = parseFloat(p.percentChange);
            const positive = change >= 0;
            return (
              <div
                key={p.commodityId}
                className="bg-white rounded-xl px-4 py-3 flex justify-between items-center shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl leading-none">{p.emoji}</span>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm leading-tight">
                      {p.name || p.commodityId}
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">{p.commodityId}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{parseFloat(p.price).toFixed(2)}</div>
                  <div className={`text-sm font-semibold ${positive ? 'text-green-500' : 'text-red-500'}`}>
                    {positive ? '+' : ''}{change.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Predict Section ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dự đoán xu hướng</h2>

          <div className="flex gap-3">
            <button
              onClick={() => handlePredict('up')}
              disabled={buttonsDisabled}
              className={`flex-1 py-3.5 rounded-xl font-bold text-lg transition-all shadow-md
                ${buttonsDisabled
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-green-500 hover:bg-green-600 text-white active:scale-95'
                }`}
            >
              {predicting ? '⏳' : '🔺'} TĂNG
            </button>
            <button
              onClick={() => handlePredict('down')}
              disabled={buttonsDisabled}
              className={`flex-1 py-3.5 rounded-xl font-bold text-lg transition-all shadow-md
                ${buttonsDisabled
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-red-500 hover:bg-red-600 text-white active:scale-95'
                }`}
            >
              {predicting ? '⏳' : '🔻'} GIẢM
            </button>
          </div>

          {/* Predict result */}
          {predictResult && (
            <div className={`mt-3 px-4 py-3 rounded-xl text-sm font-medium text-center
              ${predictResult.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : predictResult.alreadyPredicted
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {predictResult.message}
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-3">
            Đúng: <span className="font-semibold text-green-600">+200 OGN</span>
            {' '}|{' '}
            Sai: <span className="font-semibold text-red-500">-150 OGN</span>
          </p>
        </div>

        {/* bottom padding for safe area */}
        <div className="h-4" />
      </div>
    </div>
  );
}
