import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// Vietnamese names for each commodity ID
const COMMODITY_VI: Record<string, { name: string; subname: string }> = {
  WHEAT:  { name: 'Lúa mì',  subname: 'Hàng hóa' },
  CORN:   { name: 'Ngô',     subname: 'Hàng hóa' },
  COFFEE: { name: 'Cà phê',  subname: 'Robusta'   },
  COTTON: { name: 'Bông',    subname: 'Sợi bông'  },
  SUGAR:  { name: 'Đường',   subname: 'Thô'       },
};

// Material icon + colour per commodity
const COMMODITY_ICON: Record<string, { icon: string; bg: string; border: string; text: string }> = {
  WHEAT:  { icon: 'grain',      bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700' },
  CORN:   { icon: 'grain',      bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700' },
  COFFEE: { icon: 'coffee',     bg: 'bg-amber-100',  border: 'border-amber-300',  text: 'text-amber-800'  },
  COTTON: { icon: 'water_drop', bg: 'bg-sky-100',    border: 'border-sky-300',    text: 'text-sky-600'    },
  SUGAR:  { icon: 'nutrition',  bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
};
const DEFAULT_ICON = { icon: 'eco', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' };

// ─── Countdown hook — counts down to 18:00 every day ─────────────────────────
function useCountdownTo18() {
  const getSecondsLeft = useCallback(() => {
    const now = new Date();
    const target = new Date(now);
    target.setHours(18, 0, 0, 0);
    if (now >= target) {
      // already past 18:00 → count to 18:00 next day
      target.setDate(target.getDate() + 1);
    }
    return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  }, []);

  const [secs, setSecs] = useState(getSecondsLeft);

  useEffect(() => {
    const id = setInterval(() => setSecs(getSecondsLeft()), 1000);
    return () => clearInterval(id);
  }, [getSecondsLeft]);

  const h  = Math.floor(secs / 3600);
  const m  = Math.floor((secs % 3600) / 60);
  const s  = secs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return { h, m, s, pad, secs };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MarketScreen() {
  const navigate = useNavigate();

  const [data, setData]                   = useState<MarketData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [predicting, setPredicting]       = useState(false);
  const [predictResult, setPredictResult] = useState<PredictResult | null>(null);

  const { h, m, s, pad, secs } = useCountdownTo18();
  const isUrgent = secs <= 3600; // last hour — pulse red

  useEffect(() => { fetchMarketData(); }, []);

  async function fetchMarketData() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BASE}/api/market/latest`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) setData(json.data);
      else setError('Không có dữ liệu thị trường');
    } catch (err) {
      console.error('[Market] fetchMarketData error:', err);
      setError('Không thể kết nối server');
    } finally {
      setLoading(false);
    }
  }

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
      if (res.status === 401) { navigate('/login'); return; }
      if (res.ok && json.success) {
        setPredictResult({
          success: true,
          direction,
          message: direction === 'up'
            ? '🔺 Đã dự đoán TĂNG! Kết quả công bố lúc 18:00.'
            : '🔻 Đã dự đoán GIẢM! Kết quả công bố lúc 18:00.',
        });
      } else {
        const code = json?.error?.code || '';
        const msg  = json?.error?.message || 'Không thể dự đoán';
        if (code === 'ALREADY_PREDICTED' || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('đã dự đoán')) {
          setPredictResult({ success: false, alreadyPredicted: true, message: '📅 Bạn đã dự đoán hôm nay rồi. Quay lại ngày mai!' });
        } else if (code === 'NOT_TRADING_DAY') {
          setPredictResult({ success: false, message: '🚫 Hôm nay không phải ngày giao dịch.' });
        } else {
          setPredictResult({ success: false, message: msg });
        }
      }
    } catch (err) {
      console.error('[Market] handlePredict error:', err);
      setPredictResult({ success: false, message: 'Lỗi kết nối, thử lại nhé!' });
    } finally {
      setPredicting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-md mx-auto h-screen flex flex-col items-center justify-center relative bg-gradient-to-b from-[#dcedc8] to-[#aed581]">
        <div className="animate-pulse text-5xl mb-3">📊</div>
        <p className="text-sm text-[#5d4037] font-semibold">Đang tải dữ liệu thị trường...</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="max-w-md mx-auto h-screen flex flex-col relative bg-gradient-to-b from-[#dcedc8] to-[#aed581] overflow-hidden">
        <div className="relative z-30 px-4 pt-4 pb-2 flex items-center justify-between">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-[#f4e4bc] border-2 border-[#8c6239] shadow-[0_2px_0_#5d4037] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all">
            <span className="material-symbols-outlined text-[#5d4037]">arrow_back</span>
          </button>
          <div className="bg-[#8c6239] px-6 py-2 rounded-xl border-2 border-[#5d4037] shadow-[0_3px_0_#3e2723] -rotate-1 relative">
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#e9c46a] rounded-full border border-[#5d4037]" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#e9c46a] rounded-full border border-[#5d4037]" />
            <h1 className="text-[#fefae0] text-lg font-bold uppercase tracking-wider drop-shadow-md">Giá Nông Sản</h1>
          </div>
          <div className="w-10" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="text-5xl">😵</div>
          <p className="text-sm text-[#5d4037] text-center font-semibold">{error || 'Không có dữ liệu'}</p>
          <button onClick={fetchMarketData}
            className="px-6 py-2.5 bg-[#8c6239] text-[#fefae0] rounded-xl font-bold text-sm border-b-4 border-[#5d4037] active:border-b-0 active:translate-y-1 transition-all">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  const isUp            = data.index.direction === 'up';
  const buttonsDisabled = predicting || !!predictResult?.success || !!predictResult?.alreadyPredicted;

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col relative bg-gradient-to-b from-[#dcedc8] to-[#aed581] shadow-2xl overflow-hidden select-none">

      {/* ── Ambient blobs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-300/30 rounded-full blur-3xl" />
        <div className="absolute top-20 -left-10 w-32 h-32 bg-yellow-200/40 rounded-full blur-3xl" />
      </div>

      {/* ── Header ── */}
      <div className="relative z-30 px-4 pt-4 pb-2 flex items-center justify-between">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#f4e4bc] border-2 border-[#8c6239] shadow-[0_2px_0_#5d4037] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all">
          <span className="material-symbols-outlined text-[#5d4037]">arrow_back</span>
        </button>

        <div className="bg-[#8c6239] px-6 py-2 rounded-xl border-2 border-[#5d4037] shadow-[0_3px_0_#3e2723] -rotate-1 relative">
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#e9c46a] rounded-full border border-[#5d4037]" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#e9c46a] rounded-full border border-[#5d4037]" />
          <h1 className="text-[#fefae0] text-lg font-bold uppercase tracking-wider drop-shadow-md">Giá Nông Sản</h1>
        </div>

        <button onClick={fetchMarketData}
          className="w-10 h-10 rounded-full bg-[#f4e4bc] border-2 border-[#8c6239] shadow-[0_2px_0_#5d4037] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all text-[#5d4037]">
          <span className="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 relative z-10 pb-4" style={{ scrollbarWidth: 'none' }}>

        {/* ── Countdown to 18:00 ── */}
        <div
          className="p-1 rounded-2xl"
          style={{
            background: '#5d4037',
            border: '3px solid #3e2723',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.1), 0 4px 0 #1a0f0a, 0 6px 12px rgba(0,0,0,0.35)',
          }}
        >
          <div className="bg-[#3e2723] rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-xl ${isUrgent ? 'text-red-400 animate-pulse' : 'text-[#e9c46a]'}`}>
                schedule
              </span>
              <div>
                <div className="text-[10px] text-[#bcaaa4] uppercase tracking-widest font-semibold">Công bố kết quả lúc</div>
                <div className="text-[#e9c46a] text-xs font-bold">18:00 hằng ngày</div>
              </div>
            </div>

            {/* Countdown digits */}
            <div className="flex items-center gap-1">
              {[pad(h), pad(m), pad(s)].map((unit, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span
                    className={`w-9 text-center py-1 rounded-lg font-black text-lg tabular-nums
                      ${isUrgent ? 'bg-red-900/60 text-red-300' : 'bg-[#1a0f0a]/60 text-[#fefae0]'}`}
                  >
                    {unit}
                  </span>
                  {i < 2 && (
                    <span className={`font-black text-lg pb-0.5 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-[#e9c46a]'}`}>:</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Composite Index ── */}
        <div
          className="p-1 rounded-2xl"
          style={{
            background: '#8c6239',
            border: '3px solid #5d4037',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), 0 4px 0 #3e2723, 0 6px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div className="bg-[#fefae0] rounded-xl p-3 border border-[#bcaaa4] flex flex-col items-center"
            style={{ boxShadow: 'inset 0 0 20px rgba(139,69,19,0.1)' }}>
            <span className="text-xs font-bold text-[#5d4037] uppercase tracking-wide mb-1">Chỉ số tổng hợp</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-[#5d4037]">
                {typeof data.index.value === 'number' ? data.index.value.toFixed(2) : data.index.value}
              </span>
              <div className={`flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-lg mb-1 ${isUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                <span className="material-symbols-outlined text-base">{isUp ? 'trending_up' : 'trending_down'}</span>
                <span className="text-sm">{data.index.percentChange}%</span>
              </div>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(Math.abs(data.index.percentChange) * 10 + 30, 90)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Commodity Prices ── */}
        <div
          className="p-1 rounded-2xl relative"
          style={{
            background: '#8c6239',
            border: '3px solid #5d4037',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), 0 4px 0 #3e2723, 0 6px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div className="absolute -top-3 -right-2 rotate-12 z-20">
            <span className="material-symbols-outlined text-green-700 text-3xl drop-shadow-sm">eco</span>
          </div>

          <div className="bg-[#fefae0] rounded-xl p-4 border border-[#bcaaa4]"
            style={{ boxShadow: 'inset 0 0 20px rgba(139,69,19,0.1)' }}>
            <h3 className="text-center font-bold text-[#5d4037] border-b-2 border-dashed border-[#8c6239]/30 pb-2 mb-3 uppercase text-sm">
              Bảng giá hôm nay
            </h3>

            <div className="space-y-3">
              {data.prices.map(p => {
                const change   = parseFloat(p.percentChange);
                const positive = change >= 0;
                const ic       = COMMODITY_ICON[p.commodityId] || DEFAULT_ICON;
                const vi       = COMMODITY_VI[p.commodityId];
                const displayName    = p.name || vi?.name    || p.commodityId;
                const displaySubname = vi?.subname || p.commodityId;
                return (
                  <div key={p.commodityId}
                    className="flex items-center justify-between bg-white/60 p-2 rounded-lg border border-[#8c6239]/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${ic.bg} ${ic.border}`}>
                        <span className={`material-symbols-outlined ${ic.text}`}>{ic.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#5d4037]">{displayName}</span>
                        <span className="text-xs text-gray-500">{displaySubname}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-[#5d4037]">{parseFloat(p.price).toFixed(2)}</span>
                      <span className={`text-xs font-bold ${positive ? 'text-green-600' : 'text-red-500'}`}>
                        {positive ? '+' : ''}{change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-center text-[10px] text-gray-500 italic">
              Cập nhật: vừa xong
            </div>
          </div>
        </div>

        <div className="h-2" />
      </div>

      {/* ── Predict dock ── */}
      <div className="relative z-20 bg-[#5d4037] rounded-t-2xl px-4 pt-4 pb-safe border-t-4 border-[#8c6239]"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.3)' }}>

        <div className="flex items-center justify-center mb-4">
          <div className="bg-[#3e2723] px-4 py-1 rounded-full border border-[#8c6239]">
            <span className="text-[#e9c46a] font-bold text-sm uppercase tracking-wider">Dự đoán xu hướng</span>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          {/* TĂNG */}
          <button
            onClick={() => handlePredict('up')}
            disabled={buttonsDisabled}
            className={`flex-1 group relative h-20 rounded-xl border-b-4 shadow-lg overflow-hidden transition-all
              ${buttonsDisabled
                ? 'bg-gray-400 border-gray-600 cursor-not-allowed opacity-60'
                : 'bg-red-500 border-red-800 active:border-b-0 active:translate-y-1'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            {!buttonsDisabled && (
              <div className="absolute -top-10 -left-10 w-20 h-40 bg-white/20 rotate-12 group-hover:left-full transition-all duration-700" />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              {predicting
                ? <span className="material-symbols-outlined text-white text-3xl animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-white text-3xl group-hover:scale-110 transition-transform">trending_up</span>
              }
              <span className="text-white font-black text-xl uppercase tracking-wider drop-shadow-md">Tăng</span>
            </div>
          </button>

          {/* GIẢM */}
          <button
            onClick={() => handlePredict('down')}
            disabled={buttonsDisabled}
            className={`flex-1 group relative h-20 rounded-xl border-b-4 shadow-lg overflow-hidden transition-all
              ${buttonsDisabled
                ? 'bg-gray-400 border-gray-600 cursor-not-allowed opacity-60'
                : 'bg-green-500 border-green-800 active:border-b-0 active:translate-y-1'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            {!buttonsDisabled && (
              <div className="absolute -top-10 -left-10 w-20 h-40 bg-white/20 rotate-12 group-hover:left-full transition-all duration-700" />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              {predicting
                ? <span className="material-symbols-outlined text-white text-3xl animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-white text-3xl group-hover:scale-110 transition-transform">trending_down</span>
              }
              <span className="text-white font-black text-xl uppercase tracking-wider drop-shadow-md">Giảm</span>
            </div>
          </button>
        </div>

        {/* Predict result */}
        {predictResult && (
          <div className={`mb-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-center border
            ${predictResult.success
              ? 'bg-green-900/40 text-green-300 border-green-700'
              : predictResult.alreadyPredicted
                ? 'bg-blue-900/40 text-blue-300 border-blue-700'
                : 'bg-red-900/40 text-red-300 border-red-700'
            }`}
          >
            {predictResult.message}
          </div>
        )}

        {/* OGN info */}
        <div className="bg-[#3e2723]/50 rounded-lg p-2 text-center border border-[#8c6239]/30">
          <p className="text-[#fefae0] text-sm font-medium">
            Đúng: <span className="text-green-400 font-bold">+200 OGN</span>
            <span className="mx-2 text-white/30">|</span>
            Sai: <span className="text-red-400 font-bold">-150 OGN</span>
          </p>
        </div>
      </div>

    </div>
  );
}
