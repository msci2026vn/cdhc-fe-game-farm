import type { WorldBossLeaderboardEntry } from '../types/world-boss.types';
import { useTranslation } from 'react-i18next';

const MEDALS = ['🥇', '🥈', '🥉'];

interface FullLeaderboardProps {
  leaderboard: WorldBossLeaderboardEntry[];
  currentUserId: string | null;
}

export function FullLeaderboard({ leaderboard, currentUserId }: FullLeaderboardProps) {
  const { t } = useTranslation();
  const currentUserEntry = leaderboard.find(e => e.userId === currentUserId);
  const currentUserRank = currentUserEntry
    ? leaderboard.findIndex(e => e.userId === currentUserId) + 1
    : null;
  const currentUserInTop = currentUserRank != null && currentUserRank <= 10;

  return (
    <div>
      <div>
        {leaderboard.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">{t('world_boss.leaderboard.no_attacks')}</p>
        ) : (
          <div className="flex flex-col gap-0.5 px-4 py-2">
            {leaderboard.slice(0, 10).map((entry, i) => {
              const rank = i + 1;
              const isCurrentUser = entry.userId === currentUserId;
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between py-1.5 px-2 rounded text-sm ${isCurrentUser ? 'bg-blue-900/40 border border-blue-700/50' : ''
                    }`}
                >
                  <span className="flex items-center gap-2 text-gray-300 min-w-0">
                    <span className="w-6 text-center flex-shrink-0">
                      {rank <= 3 ? MEDALS[rank - 1] : <span className="text-gray-500">{rank}</span>}
                    </span>
                    <span className="truncate text-xs font-mono">
                      {entry.userId.slice(0, 10)}
                      {isCurrentUser && <span className="text-blue-400 ml-1">({t('common.you', 'bạn')})</span>}
                    </span>
                  </span>
                  <span className="text-yellow-400 font-mono text-xs flex-shrink-0 ml-2">
                    {entry.damage.toLocaleString()} dmg
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Current user not in top 10 */}
      {currentUserEntry && !currentUserInTop && (
        <div className="px-4 pb-2 border-t border-gray-700/50 pt-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-400 bg-blue-900/20 px-2 py-1.5 rounded border border-blue-700/30">
            <span>{t('common.you', 'Bạn')}: #{currentUserRank}</span>
            <span className="text-yellow-400">{currentUserEntry.damage.toLocaleString()} dmg</span>
          </div>
        </div>
      )}
    </div>
  );
}
