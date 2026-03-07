import { useState } from 'react';
import { useNextSession, useCreateAuction } from '../hooks/useAuction';
import { playSound } from '@/shared/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tokenId: number;
  nftImageUrl: string | null;
  nftName: string;
  nftRarity: string;
}

const RARITY_STYLE: Record<string, string> = {
  Common: 'text-gray-400',
  Rare: 'text-amber-400',
  Epic: 'text-purple-400',
  Legendary: 'text-red-400',
};

export function CreateAuctionModal({ isOpen, onClose, tokenId, nftImageUrl, nftName, nftRarity }: Props) {
  const { data: nextSession, isLoading: sessionLoading } = useNextSession();
  const { mutate: create, isPending } = useCreateAuction();
  const [startPrice, setStartPrice] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const slotFull = nextSession ? nextSession.slotUsed >= nextSession.slotCount : false;
  const priceValid = startPrice !== '' && parseFloat(startPrice) > 0;
  const canSubmit = nextSession && !slotFull && priceValid && !isPending;

  const handleSubmit = () => {
    if (!nextSession || !priceValid) return;
    setError('');
    create(
      { tokenId, sessionId: nextSession.id, startPriceAvax: startPrice },
      {
        onSuccess: () => {
          playSound('ui_click');
          onClose();
        },
        onError: (err: any) => {
          setError(err.message || 'Khong the tao dau gia');
        },
      },
    );
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <h3 className="text-white font-bold text-lg text-center">Dua vao Dau Gia</h3>

        {/* NFT preview */}
        <div className="flex justify-center">
          {nftImageUrl ? (
            <img
              src={nftImageUrl}
              alt={nftName}
              className="w-28 rounded-xl"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; ((e.target as HTMLImageElement).nextElementSibling as HTMLElement)?.classList.remove('hidden'); }}
            />
          ) : null}
          <div className={`w-28 h-40 bg-gray-700 rounded-xl flex items-center justify-center text-4xl${nftImageUrl ? ' hidden' : ''}`}>
            🎴
          </div>
        </div>
        <p className={`text-center font-bold text-sm ${RARITY_STYLE[nftRarity] || 'text-gray-300'}`}>
          {nftName} — {nftRarity}
        </p>

        {/* Session info */}
        {sessionLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : !nextSession ? (
          <div className="bg-gray-700/50 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-sm">Chua co phien dau gia nao sap toi.</p>
            <p className="text-gray-500 text-xs mt-1">Vui long quay lai sau.</p>
          </div>
        ) : (
          <div className="bg-gray-700/50 rounded-xl p-4 space-y-2">
            <div className="text-xs text-amber-400 uppercase tracking-wide">Phien tiep theo</div>
            <div className="text-white font-bold">{nextSession.name}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
              <span>Bat dau: {formatTime(nextSession.startTime)}</span>
              <span>{nextSession.durationMinutes} phut</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Slot:</span>
              <span className={slotFull ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                {nextSession.slotUsed}/{nextSession.slotCount}
              </span>
              {slotFull && <span className="text-red-400 text-xs">(Da day)</span>}
            </div>
          </div>
        )}

        {/* Price input — only show when session available and not full */}
        {nextSession && !slotFull && (
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Gia khoi diem (AVAX)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="VD: 0.5"
              value={startPrice}
              onChange={e => setStartPrice(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-xl text-white text-lg border border-gray-600 focus:border-amber-500 outline-none transition-colors"
            />
            {startPrice && parseFloat(startPrice) > 0 && (
              <p className="text-gray-500 text-xs mt-1">~ ${(parseFloat(startPrice) * 9).toFixed(2)} USD</p>
            )}
          </div>
        )}

        {/* Warning */}
        {nextSession && !slotFull && (
          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-xl p-3 text-sm text-yellow-300">
            NFT se bi khoa cho den khi phien ket thuc
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            Huy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Dang dang ky...' : 'Xac nhan dang ky'}
          </button>
        </div>
      </div>
    </div>
  );
}
