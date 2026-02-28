// ═══════════════════════════════════════════════════════════════
// LeaderboardRow — Combo leaderboard entry (top 3 medals)
// ═══════════════════════════════════════════════════════════════

import type { ComboLeaderboardEntry } from '../types/achievement.types';

interface LeaderboardRowProps {
  entry: ComboLeaderboardEntry;
  isMe?: boolean;
}

const MEDALS = ['🥇', '🥈', '🥉'];

function renderStars(stars?: number) {
  if (!stars || stars <= 0) return null;
  return '⭐'.repeat(Math.min(stars, 3));
}

export default function LeaderboardRow({ entry, isMe }: LeaderboardRowProps) {
  const isTop3 = entry.rank >= 1 && entry.rank <= 3;
  const medal = isTop3 ? MEDALS[entry.rank - 1] : null;

  return (
    <div
      className={`rounded-xl p-3 flex items-center gap-3 transition-all ${
        isMe ? 'ring-2 ring-amber-500/50' : ''
      } ${isTop3 ? 'py-3.5' : ''}`}
      style={{
        background: isMe
          ? 'rgba(245,158,11,0.1)'
          : isTop3
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.03)',
        border: `1px solid ${
          isMe ? 'rgba(245,158,11,0.3)' : isTop3 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'
        }`,
      }}
    >
      {/* Rank */}
      <div className={`shrink-0 w-8 text-center ${isTop3 ? 'text-xl' : 'text-[12px] font-bold text-white/40'}`}>
        {medal ?? `#${entry.rank}`}
      </div>

      {/* Avatar + name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {entry.avatar ? (
            <img src={entry.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px] text-white/40">
              {entry.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className={`text-[13px] font-bold truncate ${isMe ? 'text-amber-400' : 'text-white'}`}>
            {isMe ? 'Ban' : entry.userName}
          </span>
        </div>
        {entry.bossName && (
          <div className="text-[9px] text-white/30 mt-0.5 ml-9 truncate">
            {entry.bossName}
            {entry.zoneNumber ? ` — Zone ${entry.zoneNumber}` : ''}
          </div>
        )}
      </div>

      {/* Combo + stars */}
      <div className="shrink-0 text-right">
        <div className={`text-[13px] font-bold ${isTop3 ? 'text-amber-400' : 'text-white/70'}`}>
          Combo {entry.maxCombo}
        </div>
        {entry.stars != null && entry.stars > 0 && (
          <div className="text-[10px]">{renderStars(entry.stars)}</div>
        )}
      </div>
    </div>
  );
}
