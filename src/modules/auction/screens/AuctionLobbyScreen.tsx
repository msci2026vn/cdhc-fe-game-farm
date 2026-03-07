import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuctionList, useNextSession, useMyListings } from '../hooks/useAuction';
import { AuctionCountdown } from '../components/AuctionCountdown';
import { AuctionNftCard } from '../components/AuctionNftCard';
import BottomNav from '@/shared/components/BottomNav';
import { playSound } from '@/shared/audio';

type TabKey = 'active' | 'scheduled' | 'ended';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'active', label: '🔥 Đang diễn ra' },
  { key: 'scheduled', label: '📅 Sắp tới' },
  { key: 'ended', label: '✅ Kết thúc' },
];

const emptyMessages: Record<TabKey, string> = {
  active: 'Chưa có phiên nào đang diễn ra',
  scheduled: 'Chưa có phiên nào sắp tới',
  ended: 'Chưa có lịch sử đấu giá',
};

export default function AuctionLobbyScreen() {
  const [tab, setTab] = useState<TabKey>('active');
  const navigate = useNavigate();
  const { data: nextSession } = useNextSession();
  const { data: auctions, isLoading } = useAuctionList(undefined, tab);
  const { data: myListings } = useMyListings();

  const showFomo = nextSession?.status === 'scheduled' &&
    new Date(nextSession.startTime).getTime() - Date.now() < 900_000;

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center px-4 pt-safe pb-2 mt-2">
        <button onClick={() => { playSound('ui_back'); navigate(-1); }} className="w-8 h-8 flex items-center justify-center text-gray-400">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-white">Đấu Giá NFT</h1>
        <div className="w-8" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">

        {/* Next session banner */}
        {nextSession && nextSession.status === 'scheduled' && (
          <div className={`bg-gradient-to-r from-amber-900/40 to-orange-900/40 border rounded-2xl p-4 mb-4 ${showFomo ? 'border-amber-500 animate-pulse' : 'border-amber-700/50'
            }`}>
            <div className="text-xs text-amber-400 uppercase tracking-wide">Phiên tiếp theo</div>
            <div className="text-lg font-bold text-white mt-1">{nextSession.name}</div>
            <AuctionCountdown endTime={nextSession.startTime} size="lg" />
            <div className="flex gap-3 mt-2 text-sm text-gray-400">
              <span>🃏 {nextSession.slotCount} NFT</span>
              <span>⏱ {nextSession.durationMinutes} phút</span>
              <span>💰 {nextSession.bidCostOgn} OGN/bid</span>
            </div>
          </div>
        )}

        {/* My listings section */}
        {myListings && myListings.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-bold text-amber-400 mb-2">NFT của tôi đang đấu giá</h3>
            <div className="space-y-2">
              {myListings.map(item => (
                <button
                  key={item.id}
                  onClick={() => { playSound('ui_click'); navigate(`/auction/${item.id}`); }}
                  className="w-full flex items-center gap-3 bg-gray-800/50 rounded-xl p-3 text-left border border-gray-700 active:scale-[0.98] transition-transform"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                    {item.nftImageUrl ? (
                      <img src={item.nftImageUrl} alt={`#${item.tokenId}`} className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🎴</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">NFT #{item.tokenId}</div>
                    <div className="text-xs text-gray-500">{item.sessionName}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'active' ? 'bg-amber-900/80 text-amber-300' :
                        item.status === 'pending' ? 'bg-gray-700 text-gray-300' :
                          item.status === 'ended' ? 'bg-green-900/80 text-green-300' :
                            'bg-gray-700 text-gray-400'
                      }`}>{
                        item.status === 'active' ? 'Đang diễn ra' :
                          item.status === 'pending' ? 'Chờ phiên' :
                            item.status === 'ended' ? 'Kết thúc' : 'Đã hủy'
                      }</span>
                    <div className="text-xs text-gray-500 mt-1">{item.bidCount} bid</div>
                  </div>
                  <span className="text-gray-600 text-sm">&rarr;</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab filter */}
        <div className="flex gap-1.5 mb-4">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { playSound('ui_tab'); setTab(t.key); }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400'
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
