import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketData } from '../hooks/useMarketData';
import { audioManager } from '@/shared/audio/AudioManager';
import { TabId } from '../types/market.types';

// Sub components
import MarketCountdown from '../components/MarketCountdown';
import MarketCompositeIndex from '../components/MarketCompositeIndex';
import MarketPredictDock from '../components/MarketPredictDock';
import MarketGuideModal from '../components/MarketGuideModal';
import MarketPricesTab from '../components/MarketPricesTab';
import MarketHistoryTab from '../components/MarketHistoryTab';
import MarketLeaderboardTab from '../components/MarketLeaderboardTab';

export default function MarketScreen() {
  const navigate = useNavigate();

  // BGM
  useEffect(() => {
    audioManager.startBgm('market');
    return () => { audioManager.stopBgm(); };
  }, []);

  const {
    data, loading, error, fetchMarketData,
    predicting, predictResult, streak, handlePredict,
    ratio, history, leaderboard
  } = useMarketData();

  const [activeTab, setActiveTab] = useState<TabId>('prices');
  const [showGuide, setShowGuide] = useState(false);

  const playSound = (soundId: string) => audioManager.playSound(soundId);

  // ── Loading ──
  if (loading) {
    return (
      <div className="max-w-md mx-auto h-screen flex flex-col items-center justify-center relative" style={{ background: "url('/assets/farm/nen.jpeg') center/cover no-repeat" }}>
        <div className="animate-pulse text-5xl mb-3">📊</div>
        <p className="text-sm text-[#5d4037] font-semibold">Đang tải dữ liệu thị trường...</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="max-w-md mx-auto h-screen flex flex-col relative overflow-hidden" style={{ background: "url('/assets/farm/nen.jpeg') center/cover no-repeat" }}>
        <div className="relative z-30 px-4 pt-4 pb-2 flex items-center justify-between">
          <button onClick={() => { playSound('ui_back'); navigate(-1); }}
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

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col relative shadow-2xl overflow-hidden select-none" style={{ background: "url('/assets/farm/nen.jpeg') center/cover no-repeat" }}>
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

        <MarketCountdown />
        <MarketCompositeIndex index={data.index} onShowGuide={() => setShowGuide(true)} playSound={playSound} />

        {/* ── Tab Navigation ── */}
        <div
          className="p-1 rounded-2xl"
          style={{
            background: '#8c6239',
            border: '3px solid #5d4037',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), 0 4px 0 #3e2723, 0 6px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex rounded-xl overflow-hidden">
            {([
              { id: 'prices' as TabId, label: 'Giá', icon: 'show_chart' },
              { id: 'history' as TabId, label: 'Lịch sử', icon: 'history' },
              { id: 'leaderboard' as TabId, label: 'Xếp hạng', icon: 'emoji_events' },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => { playSound('ui_tab'); setActiveTab(tab.id); }}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1 font-bold text-sm transition-all
                  ${activeTab === tab.id
                    ? 'bg-[#fefae0] text-[#5d4037]'
                    : 'bg-[#5d4037] text-[#bcaaa4] active:bg-[#4e342e]'
                  }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'prices' && <MarketPricesTab prices={data.prices} />}
        {activeTab === 'history' && <MarketHistoryTab history={history} />}
        {activeTab === 'leaderboard' && <MarketLeaderboardTab leaderboard={leaderboard} />}

        <div className="h-2" />
      </div>

      <MarketPredictDock
        predicting={predicting}
        predictResult={predictResult}
        ratio={ratio}
        streak={streak}
        onPredict={handlePredict}
        playSound={playSound}
      />

      <MarketGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        playSound={playSound}
      />
    </div>
  );
}
