import i18n from '@/i18n';
import { useState } from 'react';
import { useTranslation } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuctionList, useNextSession, useCancelQueueItem, useMyQueue } from '../hooks/useAuction';
import { AuctionCountdown } from '../components/AuctionCountdown';
import { AuctionNftCard } from '../components/AuctionNftCard';
import BottomNav from '@/shared/components/BottomNav';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { playSound } from '@/shared/audio';
import type { AuctionQueueItem } from '../types/auction.types';

type MainTab = 'auction' | 'queue' | 'history';
type SubTab = 'spotlight' | 'side';

const mainTabs: { key: MainTab; label: string }[] = [
  { key: 'auction', label: i18n.t('tab_auction') },
  { key: 'queue', label: i18n.t('tab_queue') },
  { key: 'history', label: i18n.t('tab_history') },
];

const auctionSubTabs: { key: SubTab; label: string }[] = [
  { key: 'spotlight', label: i18n.t('tab_spotlight') },
  { key: 'side', label: i18n.t('tab_side_session') },
];

export default function AuctionLobbyScreen() {
  const { t } = useTranslation();
  const [mainTab, setMainTab] = useState<MainTab>('auction');
  const [subTab, setSubTab] = useState<SubTab>('spotlight');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
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
        <h1 className="flex-1 text-center text-lg font-bold text-white">{t('auction_lobby_title')}</h1>
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
                <div className="text-xs text-amber-400 uppercase tracking-wide">{t('next_session_title')}</div>
                <div className="text-lg font-bold text-white mt-1">{nextSession.name}</div>
                <AuctionCountdown endTime={nextSession.startTime} size="lg" />
                <div className="flex gap-3 mt-2 text-sm text-gray-400">
                  <span>{t('nft_count_label', { count: nextSession.slotCount })}</span>
                  <span>{t('minutes_label', { mins: nextSession.durationMinutes })}</span>
                  <span>{t('ogn_per_bid', { cost: nextSession.bidCostOgn })}</span>
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
                  {subTab === 'spotlight' ? t('no_active_spotlight') : t('no_active_side')}
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
                      {item.status === 'queued' ? t('queue_status_waiting') :
                       item.status === 'assigned' ? t('queue_status_assigned') :
                       item.status === 'active' ? t('queue_status_active') :
                       item.status === 'ended' ? t('queue_status_ended') : t('queue_status_withdrawn')}
                    </span>
                    {item.status === 'queued' && (
                      <button
                        onClick={() => setCancelTarget(item.id)}
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
                <p className="text-gray-500">{t('no_queued_nfts')}</p>
                <p className="text-xs text-gray-600">{t('go_to_collection_hint')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="z-50 shrink-0"><BottomNav /></div>

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) {
            cancelQueue.mutate(cancelTarget, {
              onSettled: () => setCancelTarget(null),
            });
          }
        }}
        title={t('confirm_withdraw_queue_title')}
        message={t('confirm_withdraw_queue_msg')}
        confirmText={t('confirm_withdraw_queue_btn')}
        cancelText={t('cancel')}
        confirmColor="red"
        icon="↩️"
        isLoading={cancelQueue.isPending}
      />
    </div>
  );
}
