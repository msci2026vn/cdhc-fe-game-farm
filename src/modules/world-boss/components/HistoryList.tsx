import { useState } from 'react';
import { useWorldBossHistory, useWorldBossHistoryLeaderboard } from '../hooks/useWorldBossHistory';
import { BottomDrawer } from './BottomDrawer';
import type { WorldBossHistoryEntry } from '../types/world-boss.types';

const ELEMENT_ICONS: Record<string, string> = {
  fire: '🔥', ice: '❄️', water: '💧', wind: '🌪️', poison: '☠️', chaos: '💫',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  normal: 'NORMAL', hard: 'HARD', extreme: 'EXTREME', catastrophic: 'CATASTROPHIC',
};

const MEDALS = ['🥇', '🥈', '🥉'];

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
  if (diff < 604800) return Math.floor(diff / 86400) + ' ngày trước';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function HistoryLeaderboardContent({ eventId }: { eventId: string }) {
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
    return <p className="text-xs text-gray-500 text-center py-4">Chưa có dữ liệu</p>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {entries.slice(0, 20).map((entry, i) => (
        <div
          key={entry.userId}
          className="flex items-center justify-between py-1.5 px-2 rounded text-sm"
        >
          <span className="flex items-center gap-2 text-gray-300 min-w-0">
            <span className="w-6 text-center flex-shrink-0 text-sm">
              {i < 3 ? MEDALS[i] : <span className="text-gray-500">{i + 1}</span>}
            </span>
            <span className="truncate text-xs font-mono">
              {entry.username ?? entry.userId.slice(0, 10)}
            </span>
          </span>
          <span className="text-yellow-400 font-mono text-xs flex-shrink-0 ml-2">
            {entry.totalDamage.toLocaleString()} dmg
          </span>
        </div>
      ))}
    </div>
  );
}

function HistoryCard({
  boss,
  onSelect,
}: {
  boss: WorldBossHistoryEntry;
  onSelect: (boss: WorldBossHistoryEntry) => void;
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
                {isDefeated ? '💀 Bị hạ gục' : '⏰ Biến mất'}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 text-xs text-gray-500">
          {boss.endedAt ? timeAgo(boss.endedAt) : ''}
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
            <p className="text-gray-400 text-sm">Chưa có boss nào kết thúc</p>
          </div>
        ) : (
          bosses.map(boss => (
            <HistoryCard key={boss.id} boss={boss} onSelect={setSelected} />
          ))
        )}
      </div>

      <BottomDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `🏆 ${selected.bossName}` : '🏆'}
      >
        {selected && <HistoryLeaderboardContent eventId={selected.id} />}
      </BottomDrawer>
    </div>
  );
}
