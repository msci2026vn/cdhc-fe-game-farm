// ============================================================
// CreateGuildModal — Admin-Editable
// LỚP 1: getPos('CreateGuildModal') — positions the inner modal panel
// LỚP 3: text từ t('guild.create.*')
// LỚP 4: creationFee từ props (gốc từ useGuildConfig)
// ============================================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIPositions } from '@/shared/hooks/useUIPositions';
import { useCreateGuild } from '../hooks/useGuild';

interface Props {
  onClose: () => void;
  creationFee: number; // LỚP 4: nhận từ parent, không hardcode
}

export function CreateGuildModal({ onClose, creationFee }: Props) {
  const { t } = useTranslation('guild');
  const { getPos } = useUIPositions('guild');
  const [name, setName] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const createMutation = useCreateGuild();

  const handleSubmit = async () => {
    if (name.trim().length < 3) return;
    try {
      const result = await createMutation.mutateAsync(name.trim());
      setTxHash(result.txHash);
    } catch (err: any) {
      alert(err?.message || t('errors.create_failed'));
    }
  };

  if (txHash) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4">
        {/* LỚP 1: admin can reposition the modal panel */}
        <div
          style={getPos('CreateGuildModal')}
          className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-green-600"
        >
          <div className="text-center">
            <div className="text-4xl mb-3">🎉</div>
            <div className="text-lg font-bold text-green-400 mb-1">
              {t('create.success_title', { name })}
            </div>
            <div className="text-xs text-gray-500 font-mono break-all mb-4">
              Tx: {txHash.slice(0, 20)}...
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-green-500 text-black rounded-xl font-semibold"
            >
              {t('create.done')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4">
      {/* LỚP 1: admin can reposition the modal panel */}
      <div
        style={getPos('CreateGuildModal')}
        className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{t('create.modal_title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        {/* LỚP 4: fee từ props (không hardcode) */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4 text-sm">
          <div className="flex justify-between text-gray-400 mb-1">
            <span>{t('create.fee_label')}</span>
            <span className="text-white font-semibold">{creationFee} AVAX</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>{t('create.refund_label')}</span>
            <span className="text-green-400">{t('create.refund_value')}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">{t('create.name_label')}</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('create.name_placeholder')}
            maxLength={32}
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-3
              border border-gray-700 focus:border-green-500 focus:outline-none text-sm"
          />
          <div className="text-right text-xs text-gray-600 mt-1">{name.length}/32</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm"
          >
            {t('create.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={name.trim().length < 3 || createMutation.isPending}
            className="flex-1 py-3 bg-green-500 text-black rounded-xl font-semibold text-sm
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            {createMutation.isPending ? t('create.submitting') : t('create.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
