import type { WorldBossLeaderboardEntry } from '../types/world-boss.types';
import { useTranslation } from 'react-i18next';

const MEDALS = ['🥇', '🥈', '🥉'];

interface MiniLeaderboardProps {
  leaderboard: WorldBossLeaderboardEntry[];
  participantCount: number;
}

export function MiniLeaderboard({ leaderboard, participantCount }: MiniLeaderboardProps) {
  const { t } = useTranslation();
  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="px-4 py-2">
      <p className="text-xs text-gray-400 mb-2">{t('world_boss.leaderboard.participants', { count: participantCount })}</p>
      <div className="flex flex-col gap-1">
        {top3.map((entry, i) => (
          <div key={entry.userId} className="flex items-center justify-between text-sm">
            <span className="text-gray-300">
              {MEDALS[i]} {entry.userId.slice(0, 12)}...
            </span>
            <span className="font-mono text-yellow-400">{entry.damage.toLocaleString()} dmg</span>
          </div>
        ))}
        {top3.length === 0 && (
          <p className="text-xs text-gray-500">{t('world_boss.leaderboard.no_attacks')}</p>
        )}
      </div>
    </div>
  );
}
