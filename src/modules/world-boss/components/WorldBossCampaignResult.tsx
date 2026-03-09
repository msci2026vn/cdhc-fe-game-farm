interface WorldBossCampaignResultProps {
  result: {
    totalDamage: number;
    maxCombo: number;
    rank: number | null;
    duration: number;
  };
  onFightAgain: () => void;
  onExit: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

import { useTranslation } from 'react-i18next';

export function WorldBossCampaignResult({ result, onFightAgain, onExit }: WorldBossCampaignResultProps) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-6 text-center border border-gray-600">
        <h2 className="text-xl font-bold text-red-400 mb-1">{t('world_boss.result.session_ended')}</h2>
        <p className="text-gray-400 text-xs mb-5">{t('world_boss.result.defeated')}</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-700/60 rounded-xl p-3">
            <div className="text-yellow-400 text-xl font-bold">{result.totalDamage.toLocaleString()}</div>
            <div className="text-gray-400 text-xs mt-0.5">Damage</div>
          </div>
          <div className="bg-gray-700/60 rounded-xl p-3">
            <div className="text-orange-400 text-xl font-bold">{result.maxCombo}</div>
            <div className="text-gray-400 text-xs mt-0.5">Max Combo</div>
          </div>
          <div className="bg-gray-700/60 rounded-xl p-3">
            <div className="text-blue-400 text-xl font-bold">
              {result.rank != null ? `#${result.rank}` : '--'}
            </div>
            <div className="text-gray-400 text-xs mt-0.5">Rank</div>
          </div>
          <div className="bg-gray-700/60 rounded-xl p-3">
            <div className="text-green-400 text-xl font-bold">{formatDuration(result.duration)}</div>
            <div className="text-gray-400 text-xs mt-0.5">{t('world_boss.result.time_label')}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-xl transition-colors"
          >
            {t('world_boss.result.exit')}
          </button>
          <button
            onClick={onFightAgain}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
          >
            {t('world_boss.result.continue_attack')}
          </button>
        </div>
      </div>
    </div>
  );
}
