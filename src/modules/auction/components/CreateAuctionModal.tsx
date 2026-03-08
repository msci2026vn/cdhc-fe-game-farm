import { useState } from 'react';
import { useTranslation } from 'react';
import { useSubmitToQueue } from '../hooks/useAuction';
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
  const { t } = useTranslation(); isOpen, onClose, tokenId, nftImageUrl, nftName, nftRarity }: Props) {
  const { mutate: submitQueue, isPending } = useSubmitToQueue();
  const [startPrice, setStartPrice] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const priceValid = startPrice !== '' && parseFloat(startPrice) > 0;
  const canSubmit = priceValid && !isPending;

  const handleSubmit = () => {
    if (!priceValid) return;
    setError('');
    submitQueue(
      {
        tokenId,
        startPriceAvax: startPrice,
        nftImageUrl: nftImageUrl || null,
        nftName: nftName || null,
        nftRarity: nftRarity || null,
      },
      {
        onSuccess: () => {
          playSound('ui_click');
          onClose();
        },
        onError: (err: any) => {
          setError(err.message || 'Không thể gửi NFT vào hàng chờ');
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <h3 className="text-white font-bold text-lg text-center">{t('create_auction_title')}</h3>

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

        {/* Price input */}
        <div>
          <label className="text-gray-400 text-xs mb-1 block">{t('start_price_label')}</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder={t('start_price_placeholder')}
            value={startPrice}
            onChange={e => setStartPrice(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded-xl text-white text-lg border border-gray-600 focus:border-amber-500 outline-none transition-colors"
          />
          {startPrice && parseFloat(startPrice) > 0 && (
            <p className="text-gray-500 text-xs mt-1">~ ${(parseFloat(startPrice) * 9).toFixed(2)} USD</p>
          )}
        </div>

        {/* Warning */}
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-xl p-3 text-sm text-yellow-300">
          ⚠️ NFT sẽ bị khoá ngay. Bạn có thể rút về nếu chưa vào phiên.
        </div>

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
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? t('create_auction_submitting') : t('create_auction_submit_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
