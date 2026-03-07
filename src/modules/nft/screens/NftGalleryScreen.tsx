import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { nftApi, type NftCard } from '@/shared/api/api-nft';
import { marketplaceApi } from '@/shared/api/api-marketplace';
import BottomNav from '@/shared/components/BottomNav';
import { playSound } from '@/shared/audio';

const RARITY: Record<string, { color: string; bg: string; border: string; label: string }> = {
  normal: { color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/40', label: 'Common' },
  hard: { color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', label: 'Rare' },
  extreme: { color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40', label: 'Epic' },
  catastrophic: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40', label: 'Legendary' },
};

const CARD_TYPE: Record<string, { icon: string; label: string }> = {
  last_hit: { icon: '⚔️', label: 'Người Hạ Gục Boss' },
  top_damage: { icon: '💥', label: 'Chiến Binh Mạnh Nhất' },
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
              <img
                src={card.nftCardImageUrl}
                alt={card.bossName}
                className="w-full aspect-[2/3] object-cover"
                onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextElementSibling as HTMLElement)?.classList.remove('hidden'); }}
              />
            ) : null}
            <div className={`w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-5xl${card.nftCardImageUrl ? ' hidden' : ''}`}>🎴</div>
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

function SellModal({
  card,
  onClose,
  onSuccess,
}: {
  card: NftCard;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const r = RARITY[card.bossDifficulty || 'hard'] || RARITY.hard;
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSell = async () => {
    if (!card.nftTokenId || !price) return;
    setLoading(true);
    setError('');
    try {
      const result = await marketplaceApi.listNft(card.nftTokenId, price);
      if (result.ok) {
        playSound('ui_click');
        setSuccess(true);
        onSuccess();
      } else {
        setError(result.error || 'Đăng bán thất bại');
      }
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        {success ? (
          <div className="text-center space-y-3">
            <div className="text-5xl">🎉</div>
            <h3 className="text-green-400 text-lg font-bold">Đã đăng bán thành công!</h3>
            <p className="text-gray-300 text-sm">Card của bạn đang hiện trên Chợ NFT</p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium"
            >
              Đóng
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-white font-bold text-lg text-center">Đăng bán NFT</h3>

            <div className="flex justify-center">
              {card.nftCardImageUrl ? (
                <img src={card.nftCardImageUrl} alt={card.bossName} className="w-32 rounded-xl" onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextElementSibling as HTMLElement)?.classList.remove('hidden'); }} />
              ) : null}
              <div className={`w-32 h-48 bg-gray-700 rounded-xl flex items-center justify-center text-4xl${card.nftCardImageUrl ? ' hidden' : ''}`}>🎴</div>
            </div>

            <p className={`text-center font-bold text-sm ${r.color}`}>{card.bossName} — {r.label}</p>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">Giá bán (AVAX)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="VD: 2.5"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-xl text-white text-lg border border-gray-600 focus:border-emerald-500 outline-none transition-colors"
              />
              {price && parseFloat(price) > 0 && (
                <p className="text-gray-500 text-xs mt-1">~ ${(parseFloat(price) * 9).toFixed(2)} USD</p>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSell}
                disabled={!price || parseFloat(price) <= 0 || loading}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang đăng...' : `Bán ${price || '?'} AVAX`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WithdrawModal({
  card,
  onClose,
  onSuccess,
}: {
  card: NftCard;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ txHash: string; snowscan: string } | null>(null);
  const validAddr = /^0x[0-9a-fA-F]{40}$/.test(address);

  const handleWithdraw = async () => {
    if (!card.nftTokenId || !validAddr) return;
    setLoading(true);
    setError('');
    try {
      const result = await nftApi.withdrawNft(card.nftTokenId, address);
      if (result.ok) {
        playSound('ui_click');
        setSuccess({ txHash: result.withdrawal.txHash, snowscan: result.withdrawal.snowscan });
        onSuccess();
      } else {
        setError(result.error || 'Rút thất bại');
      }
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        {success ? (
          <div className="text-center space-y-3">
            <div className="text-5xl">✅</div>
            <h3 className="text-green-400 text-lg font-bold">Rút NFT thành công!</h3>
            <p className="text-gray-300 text-sm">NFT đã chuyển về ví MetaMask của bạn</p>
            <p className="text-gray-500 text-xs break-all">{address}</p>
            <a
              href={success.snowscan}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-blue-400 text-sm hover:text-blue-300"
            >
              🔗 Xem trên Snowscan
            </a>
            <p className="text-yellow-400 text-xs">💡 Mở OpenSea/Joepegs để bán NFT trên marketplace ngoài</p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium"
            >
              Đóng
            </button>
          </div>
        ) : loading ? (
          <div className="text-center space-y-3 py-6">
            <div className="animate-spin w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full mx-auto" />
            <h3 className="text-white font-bold">Đang rút NFT...</h3>
            <p className="text-gray-400 text-sm">Chuyển NFT lên blockchain ~10 giây</p>
          </div>
        ) : (
          <>
            <h3 className="text-white font-bold text-lg text-center">📤 Rút NFT về ví cá nhân</h3>

            <div className="flex justify-center">
              {card.nftCardImageUrl ? (
                <img src={card.nftCardImageUrl} alt={card.bossName} className="w-28 rounded-xl" onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextElementSibling as HTMLElement)?.classList.remove('hidden'); }} />
              ) : null}
              <div className={`w-28 h-40 bg-gray-700 rounded-xl flex items-center justify-center text-4xl${card.nftCardImageUrl ? ' hidden' : ''}`}>🎴</div>
            </div>
            <p className="text-center text-white font-bold text-sm">{card.bossName}</p>

            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-xl p-3 text-sm text-yellow-300">
              ⚠️ Sau khi rút, NFT sẽ rời khỏi game. Bạn có thể bán trên OpenSea/Joepegs hoặc chuyển lại vào game sau.
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">Địa chỉ ví (MetaMask)</label>
              <input
                type="text"
                placeholder="0x..."
                value={address}
                onChange={e => setAddress(e.target.value.trim())}
                className="w-full p-3 bg-gray-700 rounded-xl text-white font-mono text-sm border border-gray-600 focus:border-blue-500 outline-none"
                spellCheck={false}
              />
              {address && !validAddr && (
                <p className="text-red-400 text-xs mt-1">Địa chỉ không hợp lệ (0x + 40 ký tự hex)</p>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleWithdraw}
                disabled={!validAddr}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận rút
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CardDetail({
  card,
  onClose,
  onSell,
  onWithdraw,
  onAuction,
}: {
  card: NftCard;
  onClose: () => void;
  onSell: (c: NftCard) => void;
  onWithdraw: (c: NftCard) => void;
  onAuction: () => void;
}) {
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
            <img src={card.nftCardImageUrl} alt={card.bossName} className="w-full h-full object-cover" onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; (img.nextElementSibling as HTMLElement)?.classList.remove('hidden'); }} />
          ) : null}
          <div className={`w-full h-full bg-gray-800 flex items-center justify-center text-6xl${card.nftCardImageUrl ? ' hidden' : ''}`}>🎴</div>
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

          {/* Action buttons — only for minted cards with tokenId */}
          {card.nftMintStatus === 'minted' && card.nftTokenId && (
            <div className="space-y-2">
              <button
                onClick={() => { playSound('ui_click'); onSell(card); }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-white text-sm font-bold transition-colors active:scale-95"
              >
                🏪 Bán NFT này
              </button>
              <button
                onClick={() => { playSound('ui_click'); onAuction(); }}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-xl text-white text-sm font-bold transition-colors active:scale-95"
              >
                ⚡ Đưa vào Đấu Giá
              </button>
              <button
                onClick={() => { playSound('ui_click'); onWithdraw(card); }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-bold transition-colors active:scale-95"
              >
                📤 Rút về ví MetaMask
              </button>
            </div>
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
  const queryClient = useQueryClient();
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['nft', 'my-cards'],
    queryFn: () => nftApi.getMyCards(),
    staleTime: 30_000,
  });
  const [selected, setSelected] = useState<NftCard | null>(null);
  const [sellCard, setSellCard] = useState<NftCard | null>(null);
  const [withdrawCard, setWithdrawCard] = useState<NftCard | null>(null);

  const mintedCards = cards.filter(c => c.nftMintStatus === 'minted');

  const handleSellRequest = (card: NftCard) => {
    setSelected(null);
    setSellCard(card);
  };

  const handleWithdrawRequest = (card: NftCard) => {
    setSelected(null);
    setWithdrawCard(card);
  };

  const handleSellSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['nft', 'my-cards'] });
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] });
  };

  const handleWithdrawSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['nft', 'my-cards'] });
  };

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col px-4 pt-safe border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between py-3">
          <button onClick={() => { playSound('ui_back'); navigate(-1); }} className="w-8 h-8 flex items-center justify-center text-gray-400">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <h1 className="flex-1 text-center text-white font-bold text-lg">Bộ Sưu Tập NFT</h1>
          <div className="w-8" />
        </div>

        {/* TABS */}
        <div className="flex w-full mb-3 bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => { playSound('ui_click'); navigate('/inventory'); }}
            className="flex-1 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 transition-all"
          >
            🌾 Nông sản
          </button>
          <button className="flex-1 py-1.5 rounded-lg text-sm font-bold bg-gray-700 text-white shadow-sm transition-all border border-gray-600/50">
            🎴 Thẻ NFT
          </button>
        </div>
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

      {selected && (
        <CardDetail
          card={selected}
          onClose={() => setSelected(null)}
          onSell={handleSellRequest}
          onWithdraw={handleWithdrawRequest}
          onAuction={() => { setSelected(null); navigate('/auction'); }}
        />
      )}

      {sellCard && (
        <SellModal
          card={sellCard}
          onClose={() => setSellCard(null)}
          onSuccess={handleSellSuccess}
        />
      )}

      {withdrawCard && (
        <WithdrawModal
          card={withdrawCard}
          onClose={() => setWithdrawCard(null)}
          onSuccess={handleWithdrawSuccess}
        />
      )}
    </div>
  );
}
