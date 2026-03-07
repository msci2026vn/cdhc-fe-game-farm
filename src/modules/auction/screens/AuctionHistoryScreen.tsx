import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyBids, useMyListings } from '../hooks/useAuction';
import { AuctionNftCard } from '../components/AuctionNftCard';
import BottomNav from '@/shared/components/BottomNav';
import { playSound } from '@/shared/audio';

type TabKey = 'bids' | 'listings';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'bids', label: '🎯 Da bid' },
  { key: 'listings', label: '🏷️ Da ban' },
];

export default function AuctionHistoryScreen() {
  const [tab, setTab] = useState<TabKey>('bids');
  const navigate = useNavigate();
  const { data: myBids, isLoading: loadingBids } = useMyBids(tab === 'bids');
  const { data: myListings, isLoading: loadingListings } = useMyListings(tab === 'listings');

  const items = tab === 'bids' ? myBids : myListings;
  const isLoading = tab === 'bids' ? loadingBids : loadingListings;

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center px-4 pt-4 pb-2">
        <button onClick={() => { playSound('ui_back'); navigate(-1); }}>
          <span className="material-symbols-outlined text-xl text-gray-400">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-white">Lich su Dau Gia</h1>
        <div className="w-10" />
      </div>

      {/* Tab filter */}
      <div className="flex gap-1.5 px-4 mb-4">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : !items?.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-4xl">{tab === 'bids' ? '🎯' : '🏷️'}</span>
            <p className="text-gray-500">
              {tab === 'bids' ? 'Chua co phien nao ban da bid' : 'Chua co NFT nao ban da dang'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => { playSound('ui_click'); navigate(`/auction/${item.id}`); }}
                className="w-full flex items-center gap-3 bg-gray-800/50 rounded-xl p-3 text-left transition-colors hover:bg-gray-800/80"
              >
                {/* Mini image */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                  {item.nftImageUrl ? (
                    <img
                      src={item.nftImageUrl}
                      alt={`#${item.tokenId}`}
                      className="w-full h-full object-cover"
                      onError={e => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        (img.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center text-2xl${item.nftImageUrl ? ' hidden' : ''}`}>
                    🎴
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-bold">#{item.tokenId}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{item.sessionName}</p>
                  <p className="text-gray-400 text-xs">{item.bidCount} bids</p>
                </div>

                <span className="text-gray-600 text-sm">&rarr;</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="z-50 shrink-0"><BottomNav /></div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-amber-900/80 text-amber-300',
    sudden_death: 'bg-red-900/80 text-red-300',
    ended: 'bg-green-900/80 text-green-300',
    pending: 'bg-gray-700 text-gray-300',
    cancelled: 'bg-gray-700 text-gray-400',
  };
  const labels: Record<string, string> = {
    active: 'Live',
    sudden_death: 'SD',
    ended: 'End',
    pending: 'Cho',
    cancelled: 'Huy',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}
