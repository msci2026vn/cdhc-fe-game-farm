import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuctionList, useNextSession, useCancelQueueItem, useMyQueue } from '../hooks/useAuction';
import { AuctionCountdown } from '../components/AuctionCountdown';
import { AuctionNftCard } from '../components/AuctionNftCard';
import BottomNav from '@/shared/components/BottomNav';
import { playSound } from '@/shared/audio';
import type { AuctionQueueItem } from '../types/auction.types';

type MainTab = 'auction' | 'queue' | 'history';
type SubTab = 'spotlight' | 'side';

const mainTabs: { key: MainTab; label: string }[] = [
  { key: 'auction', label: '⚡ Đấu giá' },
  { key: 'queue', label: '📦 Hàng chờ' },
  { key: 'history', label: '📋 Lịch sử' },
];

const auctionSubTabs: { key: SubTab; label: string }[] = [
  { key: 'spotlight', label: '⭐ Spotlight' },
  { key: 'side', label: '🏷️ Phiên phụ' },
];

export default function AuctionLobbyScreen() {
  const [mainTab, setMainTab] = useState<MainTab>('auction');
  const [subTab, setSubTab] = useState<SubTab>('spotlight');
  const navigate = useNavigate();
  const { data: nextSession } = useNextSession();
  const { data: auctions, isLoading } = useAuctionList(
    undefined,
    'active',
    mainTab === 'auction' ? subTab : undefined,
  );
  const { data: myQueue, isLoading: queueLoading } = useMyQueue();
  const cancelQueue = useCancelQueueItem();

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

        {/* Main tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 mb-3">
          {mainTabs.map(t => (
            <button
              key={t.key}
              onClick={() => {
                playSound('ui_tab');
                if (t.key === 'history') {
                  navigate('/auction/history');
                  return;
                }
                setMainTab(t.key);
              }}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                mainTab === t.key
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sub-tabs (auction only) */}
        {mainTab === 'auction' && (
          <div className="flex gap-1 mb-4">
            {auctionSubTabs.map(t => (
              <button
                key={t.key}
                onClick={() => { playSound('ui_tab'); setSubTab(t.key); }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                  subTab === t.key
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-gray-800 text-gray-500 hover:text-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab: Đấu giá */}
        {mainTab === 'auction' && (
          <>
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

            {/* Auction grid */}
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full" />
              </div>
            ) : !auctions?.length ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <span className="text-4xl">🎯</span>
                <p className="text-gray-500">
                  Chưa có {subTab === 'spotlight' ? 'Spotlight' : 'phiên phụ'} nào đang diễn ra
                </p>
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
          </>
        )}

        {/* Tab: Hàng chờ */}
        {mainTab === 'queue' && (
          <div className="space-y-3">
            {queueLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full" />
              </div>
            ) : myQueue && myQueue.length > 0 ? (
              myQueue.map((item: AuctionQueueItem) => (
                <div key={item.id} className="bg-gray-800/60 rounded-xl p-3 flex items-center gap-3 border border-gray-700">
                  {/* NFT image */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                    {item.nftImageUrl ? (
                      <img src={item.nftImageUrl} alt={item.nftName || ''} className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🎴</div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.nftName || `Token #${item.tokenId}`}</p>
                    <p className="text-xs text-gray-400">{item.nftRarity} • {item.startPriceAvax} AVAX</p>
                    <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  {/* Status + actions */}
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === 'queued' ? 'bg-yellow-500/20 text-yellow-400' :
                      item.status === 'assigned' ? 'bg-blue-500/20 text-blue-400' :
                      item.status === 'active' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {item.status === 'queued' ? 'Đang chờ' :
                       item.status === 'assigned' ? 'Đã vào phiên' :
                       item.status === 'active' ? 'Đang đấu giá' :
                       item.status === 'ended' ? 'Đã kết thúc' : 'Đã rút'}
                    </span>
                    {item.status === 'queued' && (
                      <button
                        onClick={() => {
                          if (confirm('Rút NFT khỏi hàng chờ?')) {
                            cancelQueue.mutate(item.id);
                          }
                        }}
                        disabled={cancelQueue.isPending}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        ↩️ Rút về
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <span className="text-4xl">📦</span>
                <p className="text-gray-500">Bạn chưa gửi NFT nào</p>
                <p className="text-xs text-gray-600">Vào Bộ Sưu Tập để gửi NFT đấu giá!</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="z-50 shrink-0"><BottomNav /></div>
    </div>
  );
}
