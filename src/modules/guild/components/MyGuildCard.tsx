// ============================================================
// MyGuildCard — Card guild của user (nổi bật)
// Leave flow: idle → confirm → leaving → done
// ============================================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLeaveGuild, type Guild } from '../hooks/useGuild';

type LeaveStep = 'idle' | 'confirm' | 'leaving' | 'done';

interface Props { guild: Guild }

export function MyGuildCard({ guild }: Props) {
  const { t } = useTranslation('guild');
  const [step, setStep] = useState<LeaveStep>('idle');
  const [txHash, setTxHash] = useState('');
  const leaveMutation = useLeaveGuild();

  const handleLeave = async () => {
    setStep('leaving');
    try {
      const result = await leaveMutation.mutateAsync();
      setTxHash(result?.txHash || 'confirmed');
      setStep('done');
    } catch (err: any) {
      setStep('idle');
      alert(err?.message || t('errors.leave_failed'));
    }
  };

  return (
    <div className="rounded-2xl border border-green-700/60 overflow-hidden">
      {/* Main info */}
      <div className="bg-gradient-to-br from-green-950/60 to-gray-900 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-green-900/50 border border-green-700/40
              flex items-center justify-center text-3xl">
              🏰
            </div>
            <div>
              <div className="text-xs text-green-400 font-semibold uppercase tracking-wider">
                {t('my_guild.label')}
              </div>
              <div className="text-lg font-bold text-white mt-0.5">{guild.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">{t('my_guild.total_stake')}</div>
            <div className="text-sm font-bold text-green-400">
              {parseFloat(guild.stakedAmount).toFixed(3)} AVAX
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm text-gray-300">
          <span>👥 {guild.memberCount} {t('my_guild.members')}</span>
          <span className="text-gray-600">•</span>
          <span className="text-xs text-gray-500 font-mono">
            {guild.owner.slice(0, 6)}...{guild.owner.slice(-4)}
          </span>
        </div>
      </div>

      {/* Leave section */}
      {step === 'idle' && (
        <div className="px-4 py-3 bg-gray-900/60 border-t border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500">{t('my_guild.refund_note')}</span>
          <button
            onClick={() => setStep('confirm')}
            className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium
              px-3 py-1.5 border border-red-900/50 rounded-lg hover:border-red-700/50"
          >
            {t('my_guild.leave')}
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="px-4 py-3 bg-red-950/30 border-t border-red-900/30">
          <p className="text-xs text-red-300 mb-3">
            ⚠️ {t('my_guild.confirm_leave')} <strong>"{guild.name}"</strong>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setStep('idle')}
              className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs"
            >
              {t('my_guild.cancel')}
            </button>
            <button
              onClick={handleLeave}
              className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-semibold"
            >
              {t('my_guild.confirm')}
            </button>
          </div>
        </div>
      )}

      {step === 'leaving' && (
        <div className="px-4 py-3 bg-gray-900/60 border-t border-gray-800 text-center">
          <span className="text-xs text-gray-400 animate-pulse">Đang xử lý giao dịch...</span>
        </div>
      )}

      {step === 'done' && (
        <div className="px-4 py-3 bg-green-950/30 border-t border-green-900/30">
          <p className="text-xs text-green-400">✅ Đã rời guild. AVAX đang được hoàn về ví.</p>
          {txHash && txHash !== 'confirmed' && (
            <p className="text-xs text-gray-600 font-mono mt-1 break-all">Tx: {txHash.slice(0, 30)}...</p>
          )}
        </div>
      )}
    </div>
  );
}
