interface WorldBossCampaignResultProps {
  result: {
    totalDamage: number;
    maxCombo: number;
    rank: number | null;
    duration: number;
    isSyncing?: boolean;
    syncError?: boolean;
  };
  isSyncing?: boolean;
  onFightAgain: () => void;
  onExit: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

import { useTranslation } from 'react-i18next';

export function WorldBossCampaignResult({ result, isSyncing, onFightAgain, onExit }: WorldBossCampaignResultProps) {
  const { t } = useTranslation();
  
  // Realtime syncing status
  const currentSyncing = isSyncing || result.isSyncing;
  const currentError = !currentSyncing && result.syncError;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-6 text-center border border-gray-600 relative overflow-hidden">
        {/* Syncing Overlay / Indicator */}
        {currentSyncing && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/20">
            <div className="h-full bg-blue-500 animate-progress-buffer w-full origin-left" />
          </div>
        )}

        <h2 className="text-xl font-bold text-red-400 mb-1">
          {currentSyncing ? 'Đang đồng bộ...' : t('world_boss.result.session_ended')}
        </h2>
        <p className="text-gray-400 text-xs mb-5">
          {currentSyncing ? 'Vui lòng chờ giây lát để ghi nhận điểm...' : t('world_boss.result.defeated')}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`bg-gray-700/60 rounded-xl p-3 border transition-colors ${currentSyncing ? 'border-blue-500/30' : currentError ? 'border-red-500/30' : 'border-transparent'}`}>
            <div className="text-yellow-400 text-xl font-bold flex items-center justify-center gap-1">
              {result.totalDamage.toLocaleString()}
              {currentSyncing ? (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              ) : currentError ? (
                <span className="text-[10px] text-red-500">⚠️</span>
              ) : (
                <span className="text-[10px] text-green-500">✓</span>
              )}
            </div>
            <div className="text-gray-400 text-[10px] mt-0.5 uppercase tracking-wider font-bold">Damage</div>
          </div>
          <div className="bg-gray-700/60 rounded-xl p-3">
            <div className="text-orange-400 text-xl font-bold">{result.maxCombo}</div>
            <div className="text-gray-400 text-[10px] mt-0.5 uppercase tracking-wider font-bold">Max Combo</div>
          </div>
          <div className="bg-gray-700/60 rounded-xl p-3">
            <div className="text-blue-400 text-xl font-bold">
              {result.rank != null ? `#${result.rank}` : '--'}
            </div>
            <div className="text-gray-400 text-[10px] mt-0.5 uppercase tracking-wider font-bold">Rank</div>
          </div>
          <div className="bg-gray-700/60 rounded-xl p-3">
            <div className="text-green-400 text-xl font-bold">{formatDuration(result.duration)}</div>
            <div className="text-gray-400 text-[10px] mt-0.5 uppercase tracking-wider font-bold">{t('world_boss.result.time_label')}</div>
          </div>
        </div>

        {currentError && (
          <div className="mb-4 p-2 bg-red-900/20 border border-red-900/40 rounded-lg text-[10px] text-red-400">
            Mạng yếu: Một số điểm chưa được xác nhận.
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-xl transition-colors text-sm"
          >
            {t('world_boss.result.exit')}
          </button>
          <button
            onClick={onFightAgain}
            disabled={currentSyncing}
            className={`flex-1 py-3 font-bold rounded-xl transition-colors text-sm ${
              currentSyncing ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {t('world_boss.result.continue_attack')}
          </button>
        </div>
      </div>
    </div>
  );
}
