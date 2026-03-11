import { useState } from 'react';
import { useWorldBossHistory, useWorldBossHistoryLeaderboard } from '../hooks/useWorldBossHistory';
import { BottomDrawer } from './BottomDrawer';
import type { WorldBossHistoryEntry } from '../types/world-boss.types';
import { useTranslation } from 'react-i18next';

const ELEMENT_ICONS: Record<string, string> = {
  fire: '🔥', ice: '❄️', water: '💧', wind: '🌪️', poison: '☠️', chaos: '💫',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  normal: 'NORMAL', hard: 'HARD', extreme: 'EXTREME', catastrophic: 'CATASTROPHIC',
};

const MEDALS = ['🥇', '🥈', '🥉'];

function timeAgo(dateStr: string, t: any): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return t('world_boss.history.just_now', 'vừa xong');
  if (diff < 3600) return t('world_boss.history.minutes_ago', { time: Math.floor(diff / 60) });
  if (diff < 86400) return t('world_boss.history.hours_ago', { time: Math.floor(diff / 3600) });
  if (diff < 604800) return t('world_boss.history.days_ago', { time: Math.floor(diff / 86400) });
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

import { useSearchUsers } from '@/shared/hooks/useSocial';

function HistoryLeaderboardEntryRow({ entry, index, medalLabel }: { entry: any, index: number, medalLabel?: React.ReactNode }) {
  // If backend returns both, skip fetch. Otherwise use search API.
  const hasProfileInfo = !!entry.username && !!entry.avatarUrl;
  const { data } = useSearchUsers(hasProfileInfo ? '' : entry.userId);

  const searchedUser = data?.results?.find((u: any) => u.id === entry.userId) || data?.results?.[0];

  const displayName = entry.username || searchedUser?.name || entry.userId.slice(0, 10);
  const displayAvatar = entry.avatarUrl || searchedUser?.picture;
  const fallbackImg = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${entry.userId}`;

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded text-sm">
      <span className="flex items-center gap-2 text-gray-300 min-w-0">
        <span className="w-6 text-center flex-shrink-0 text-sm">
          {medalLabel}
        </span>
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 border border-gray-600">
          <img
            src={displayAvatar || fallbackImg}
            alt="avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImg;
            }}
          />
        </div>
        <span className="truncate text-xs font-mono">
          {displayName}
        </span>
      </span>
      <span className="text-yellow-400 font-mono text-xs flex-shrink-0 ml-2">
        {entry.totalDamage.toLocaleString()} dmg
      </span>
    </div>
  );
}

function HistoryLeaderboardContent({ eventId, t }: { eventId: string, t: any }) {
  const { data, isLoading } = useWorldBossHistoryLeaderboard(eventId);
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full" />
      </div>
    );
  }
  const entries = data?.leaderboard ?? [];
  if (entries.length === 0) {
    return <p className="text-xs text-gray-500 text-center py-4">{t('world_boss.history.no_data', 'Chưa có dữ liệu')}</p>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {entries.slice(0, 20).map((entry, i) => (
        <HistoryLeaderboardEntryRow
          key={entry.userId}
          entry={entry}
          index={i}
          medalLabel={i < 3 ? MEDALS[i] : <span className="text-gray-500">{i + 1}</span>}
        />
      ))}
    </div>
  );
}

function HistoryCard({
  boss,
  onSelect,
  t
}: {
  boss: WorldBossHistoryEntry;
  onSelect: (boss: WorldBossHistoryEntry) => void;
  t: any;
}) {
  const isDefeated = boss.status === 'defeated';
  const elementIcon = ELEMENT_ICONS[boss.element] ?? '⚡';
  const diffLabel = DIFFICULTY_LABELS[boss.difficulty] ?? boss.difficulty;

  return (
    <button
      onClick={() => onSelect(boss)}
      className="w-full text-left bg-gray-800 hover:bg-gray-750 active:bg-gray-700 rounded-xl p-3 border border-gray-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{elementIcon}</span>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{boss.bossName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
                {diffLabel}
              </span>
              <span className={`text-xs ${isDefeated ? 'text-red-400' : 'text-gray-500'}`}>
                {isDefeated ? t('world_boss.history.defeated') : t('world_boss.history.escaped')}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 text-xs text-gray-500">
          {boss.endedAt ? timeAgo(boss.endedAt, t) : ''}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
        <span>👥 {boss.totalParticipants}</span>
        <span>⚔️ {(boss.totalDamageDealt / 1_000_000).toFixed(1)}M dmg</span>
      </div>
    </button>
  );
}

export function HistoryList() {
  const { t } = useTranslation();
  const { data, isLoading } = useWorldBossHistory(10);
  const [selected, setSelected] = useState<WorldBossHistoryEntry | null>(null);

  const bosses = data?.bosses ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full" />
          </div>
        ) : bosses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="text-4xl">📜</div>
            <p className="text-gray-400 text-sm">{t('world_boss.history.no_data', 'Chưa có dữ liệu')}</p>
          </div>
        ) : (
          bosses.map(boss => (
            <HistoryCard key={boss.id} boss={boss} onSelect={setSelected} t={t} />
          ))
        )}
      </div>

      <BottomDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `🏆 ${selected.bossName}` : '🏆'}
      >
        {selected && <HistoryLeaderboardContent eventId={selected.id} t={t} />}
      </BottomDrawer>
    </div>
  );
}
