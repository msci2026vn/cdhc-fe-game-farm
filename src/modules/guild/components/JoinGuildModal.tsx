// ============================================================
// JoinGuildModal — Confirm trước khi stake AVAX để join guild
// Hiện rõ: tên guild, phí stake, warning "chỉ 1 guild"
// ============================================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useJoinGuild, type Guild } from '../hooks/useGuild';

interface Props {
  guild: Guild;
  joinFee: number;
  onClose: () => void;
}

export function JoinGuildModal({ guild, joinFee, onClose }: Props) {
  const { t } = useTranslation('guild');
  const [txHash, setTxHash] = useState<string | null>(null);
  const joinMutation = useJoinGuild();

  const handleJoin = async () => {
    try {
      const result = await joinMutation.mutateAsync(guild.id);
      setTxHash(result.txHash || 'confirmed');
    } catch (err: any) {
      alert(err?.message || t('errors.join_failed'));
    }
  };

  if (txHash) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-sm border border-blue-700/50">
          <div className="text-center">
            <div className="text-5xl mb-3">🎉</div>
            <div className="text-lg font-bold text-blue-400 mb-1">
              Đã tham gia <span className="text-white">"{guild.name}"</span>!
            </div>
            <div className="text-xs text-gray-500 font-mono mt-2 mb-4 break-all">
              {txHash.length > 20 ? `Tx: ${txHash.slice(0, 30)}...` : txHash}
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-blue-600 text-white rounded-2xl font-semibold"
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
      <div className="bg-gray-900 rounded-3xl p-5 w-full max-w-sm border border-gray-700">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Xin vào Guild</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Guild info */}
        <div className="bg-gray-800/80 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="text-3xl">🏰</div>
          <div>
            <div className="font-bold text-white">{guild.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {guild.memberCount} thành viên · {parseFloat(guild.stakedAmount).toFixed(3)} AVAX staked
            </div>
          </div>
        </div>

        {/* Fee */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Phí tham gia (stake)</span>
            <span className="text-white font-semibold">{joinFee} AVAX</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Hoàn lại khi rời</span>
            <span className="text-green-400">90%</span>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-3 mb-4">
          <p className="text-amber-300 text-xs">
            ⚠️ Bạn chỉ có thể tham gia <strong>1 guild</strong> tại một thời điểm.
            Muốn chuyển guild → rời guild hiện tại trước.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-2xl text-sm font-medium"
          >
            {t('my_guild.cancel')}
          </button>
          <button
            onClick={handleJoin}
            disabled={joinMutation.isPending}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl
              text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
          >
            {joinMutation.isPending ? 'Đang xử lý...' : `Stake ${joinFee} AVAX`}
          </button>
        </div>
      </div>
    </div>
  );
}
