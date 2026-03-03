import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { nftApi, type NftCard } from '@/shared/api/api-nft';
import BottomNav from '@/shared/components/BottomNav';
import { playSound } from '@/shared/audio';

const RARITY: Record<string, { color: string; bg: string; border: string; label: string }> = {
  normal:       { color: 'text-gray-400',   bg: 'bg-gray-500/20',   border: 'border-gray-500/40',  label: 'Common' },
  hard:         { color: 'text-amber-400',  bg: 'bg-amber-500/20',  border: 'border-amber-500/40', label: 'Rare' },
  extreme:      { color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40', label: 'Epic' },
  catastrophic: { color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/40',   label: 'Legendary' },
};

const CARD_TYPE: Record<string, { icon: string; label: string }> = {
  last_hit:      { icon: '⚔️', label: 'Người Hạ Gục Boss' },
  top_damage:    { icon: '💥', label: 'Chiến Binh Mạnh Nhất' },
  dual_champion: { icon: '👑', label: 'Dual Champion' },
};

const ELEMENT_ICON: Record<string, string> = {
  fire: '🔥', ice: '❄️', water: '💧', wind: '🌪️', poison: '☠️', chaos: '🌀',
};

function CardGrid({ cards, onSelect }: { cards: NftCard[]; onSelect: (c: NftCard) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => {
        const r = RARITY[card.bossDifficulty || 'hard'] || RARITY.hard;
        const ct = CARD_TYPE[card.nftCardType] || CARD_TYPE.last_hit;
        return (
          <button
            key={`${card.eventId}-${card.nftCardType}`}
            onClick={() => { playSound('ui_click'); onSelect(card); }}
            className={`rounded-2xl border ${r.border} ${r.bg} overflow-hidden text-left transition-transform active:scale-95`}
          >
            {card.nftCardImageUrl ? (
              <img src={card.nftCardImageUrl} alt={card.bossName} className="w-full aspect-[2/3] object-cover" />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-5xl">🎴</div>
            )}
            <div className="px-3 py-2 space-y-1">
              <p className="text-white text-xs font-bold truncate">{card.bossName || 'Boss'}</p>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold ${r.color}`}>{r.label}</span>
                <span className="text-[10px] text-gray-400">{ct.icon}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CardDetail({ card, onClose }: { card: NftCard; onClose: () => void }) {
  const r = RARITY[card.bossDifficulty || 'hard'] || RARITY.hard;
  const ct = CARD_TYPE[card.nftCardType] || CARD_TYPE.last_hit;
  const elIcon = ELEMENT_ICON[card.bossElement || ''] || '';

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center overflow-y-auto py-8 px-4" onClick={onClose}>
      <div className="w-full max-w-sm flex flex-col items-center gap-5" onClick={e => e.stopPropagation()}>
        {/* Card image */}
        <div
          className={`rounded-2xl overflow-hidden border-2 ${r.border}`}
          style={{ width: 260, height: 380 }}
        >
          {card.nftCardImageUrl ? (
            <img src={card.nftCardImageUrl} alt={card.bossName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-6xl">🎴</div>
          )}
        </div>

        {/* Info */}
        <div className="w-full space-y-3">
          {/* Boss name + element */}
          <div className="text-center">
            <h2 className="text-white text-xl font-bold">
              {elIcon} {card.bossName || 'Boss'}
            </h2>
            <span className={`text-sm font-bold ${r.color}`}>{r.label}</span>
          </div>

          {/* Card type */}
          <div className={`${r.bg} ${r.border} border rounded-xl px-4 py-3 text-center`}>
            <span className="text-lg mr-2">{ct.icon}</span>
            <span className="text-white font-semibold text-sm">{ct.label}</span>
          </div>

          {/* Stats */}
          <div className="bg-gray-800/80 rounded-xl p-4 space-y-2">
            {card.damage != null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">💥 Damage</span>
                <span className="text-yellow-400 font-bold">{card.damage.toLocaleString()}</span>
              </div>
            )}
            {card.rank != null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">🏆 Xếp hạng</span>
                <span className="text-blue-400 font-bold">#{card.rank}</span>
              </div>
            )}
          </div>

          {/* Snowscan link */}
          {card.nftTxHash && (
            <a
              href={`https://snowscan.xyz/tx/${card.nftTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors"
            >
              🔗 Xem trên Snowscan
            </a>
          )}

          {/* IPFS link */}
          {card.nftMetadataUri && (
            <a
              href={card.nftMetadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/')}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2 text-gray-500 text-xs hover:text-gray-400"
            >
              📄 Metadata IPFS
            </a>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium mt-2"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export default function NftGalleryScreen() {
  const navigate = useNavigate();
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['nft', 'my-cards'],
    queryFn: () => nftApi.getMyCards(),
    staleTime: 30_000,
  });
  const [selected, setSelected] = useState<NftCard | null>(null);

  const mintedCards = cards.filter(c => c.nftMintStatus === 'minted');

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center px-4 pt-safe pb-3 border-b border-gray-800">
        <button onClick={() => { playSound('ui_back'); navigate(-1); }} className="w-8 h-8 flex items-center justify-center text-gray-400">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-white font-bold text-lg">🎴 Bộ Sưu Tập NFT</h1>
        <div className="w-8" />
      </div>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto pb-28 px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full" />
            <span className="text-gray-400 text-sm">Đang tải bộ sưu tập...</span>
          </div>
        ) : mintedCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="text-6xl">🎴</div>
            <p className="text-gray-300 font-semibold text-lg">Chưa có thẻ NFT nào</p>
            <p className="text-gray-500 text-sm">Hạ gục World Boss để nhận thẻ đầu tiên!</p>
            <button
              onClick={() => navigate('/world-boss')}
              className="mt-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-medium transition-colors"
            >
              ⚔️ Đi đánh Boss
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-400 text-xs mb-3">{mintedCards.length} thẻ</p>
            <CardGrid cards={mintedCards} onSelect={setSelected} />
          </>
        )}
      </main>

      <div className="z-50 shrink-0"><BottomNav /></div>

      {selected && <CardDetail card={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
