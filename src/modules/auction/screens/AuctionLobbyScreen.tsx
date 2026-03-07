import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuctionList, useNextSession } from '../hooks/useAuction';
import { AuctionCountdown } from '../components/AuctionCountdown';
import { AuctionNftCard } from '../components/AuctionNftCard';
import BottomNav from '@/shared/components/BottomNav';
import { playSound } from '@/shared/audio';

type TabKey = 'active' | 'scheduled' | 'ended';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'active', label: '🔥 Dang dien ra' },
  { key: 'scheduled', label: '📅 Sap toi' },
  { key: 'ended', label: '✅ Ket thuc' },
];

const emptyMessages: Record<TabKey, string> = {
  active: 'Chua co phien nao dang dien ra',
  scheduled: 'Chua co phien nao sap toi',
  ended: 'Chua co lich su dau gia',
};

export default function AuctionLobbyScreen() {
  const [tab, setTab] = useState<TabKey>('active');
  const navigate = useNavigate();
  const { data: nextSession } = useNextSession();
  const { data: auctions, isLoading } = useAuctionList(undefined, tab);

  const showFomo = nextSession?.status === 'scheduled' &&
    new Date(nextSession.startTime).getTime() - Date.now() < 900_000;

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center px-4 pt-4 pb-2">
        <button onClick={() => { playSound('ui_back'); navigate(-1); }}>
          <span className="material-symbols-outlined text-xl text-gray-400">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-white">Dau Gia NFT</h1>
        <div className="w-10" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">

        {/* Next session banner */}
        {nextSession && nextSession.status === 'scheduled' && (
          <div className={`bg-gradient-to-r from-amber-900/40 to-orange-900/40 border rounded-2xl p-4 mb-4 ${
            showFomo ? 'border-amber-500 animate-pulse' : 'border-amber-700/50'
          }`}>
            <div className="text-xs text-amber-400 uppercase tracking-wide">Phien tiep theo</div>
            <div className="text-lg font-bold text-white mt-1">{nextSession.name}</div>
            <AuctionCountdown endTime={nextSession.startTime} size="lg" />
            <div className="flex gap-3 mt-2 text-sm text-gray-400">
              <span>🃏 {nextSession.slotCount} NFT</span>
              <span>⏱ {nextSession.durationMinutes} phut</span>
              <span>💰 {nextSession.bidCostOgn} OGN/bid</span>
            </div>
          </div>
        )}

        {/* Tab filter */}
        <div className="flex gap-1.5 mb-4">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { playSound('ui_tab'); setTab(t.key); }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Auction grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : !auctions?.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-4xl">🏷️</span>
            <p className="text-gray-500">{emptyMessages[tab]}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {auctions.map(auction => (
              <AuctionNftCard
                key={auction.id}
                imageUrl={auction.nftImageUrl}
                tokenId={auction.tokenId}
                bidCount={auction.bidCount}
                status={auction.status}
                endTime={auction.endTime}
                variant="grid"
                onClick={() => { playSound('ui_click'); navigate(`/auction/${auction.id}`); }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="z-50 shrink-0"><BottomNav /></div>
    </div>
  );
}
