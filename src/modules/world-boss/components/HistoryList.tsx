import { useState } from 'react';
import { useWorldBossHistory, useWorldBossHistoryLeaderboard } from '../hooks/useWorldBossHistory';
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
  // Skip search if backend already provides username; avatar falls back to dicebear.
  const hasProfileInfo = !!entry.username;
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
      className="w-full text-left active:scale-[0.98] transition-transform"
      style={{
        backgroundImage: "url('/assets/lobby_world_boss/frame_wood_history.png')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        padding: '16px 20px',
        minHeight: '110px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        border: 'none',
        backgroundColor: 'transparent',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0 drop-shadow-sm">{elementIcon}</span>
          <div className="min-w-0">
            <p className="text-white text-base font-black truncate drop-shadow-md">{boss.bossName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-gray-300 bg-black/30 px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-wider">
                {diffLabel}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/20 ${isDefeated ? 'text-red-400 border border-red-500/30' : 'text-gray-400 border border-gray-500/30'}`}>
                {isDefeated ? t('world_boss.history.defeated').toUpperCase() : t('world_boss.history.escaped').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-tighter opacity-80">
          {boss.endedAt ? timeAgo(boss.endedAt, t) : ''}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] font-bold text-gray-300">
        <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded">
          <span className="opacity-70">👥</span> {boss.totalParticipants}
        </span>
        <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded">
          <span className="opacity-70">⚔️</span> {(boss.totalDamageDealt / 1_000_000).toFixed(1)}M dmg
        </span>
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

      {/* Centered Modal: Xếp hạng chi tiết */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          onClick={() => setSelected(null)}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Content Box with Wood Frame */}
          <div
            className="relative w-full max-w-[800px] h-[85vh] animate-in zoom-in-95 duration-200 flex flex-col items-center justify-center p-2"
            onClick={e => e.stopPropagation()}
          >
            {/* Background Frame Image (Non-stretched) */}
            <img
              src="/assets/lobby_world_boss/frame_historical_details.png"
              alt="frame"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />

            {/* Modal Content - Absolute Positioned to fit inside the frame */}
            <div className="relative z-10 w-[85%] h-[70%] flex flex-col mt-16">
              {/* Nút đóng - Đặt bên trong lòng khung gỗ cùng với nội dung */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-[50px] right-[-23px] active:scale-95 transition-transform z-30"
              >
                <img
                  src="/assets/lobby_world_boss/btn_close.png"
                  alt="Close"
                  className="w-10 h-10 object-contain"
                />
              </button>

              {/* Header with Title Frame */}
              <div
                className="flex items-center justify-center mb-0 relative"
                style={{ transform: 'translateY(-55px)' }}
              >
                <div
                  style={{
                    backgroundImage: "url('/assets/lobby_world_boss/frame_title_history.png')",
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    width: '320px',
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 20px',
                  }}
                >
                  <h3 className="text-sm font-black text-[#5d4037] drop-shadow-sm uppercase tracking-wider text-center pt-1">
                    {selected ? `🏆 ${selected.bossName}` : '🏆'}
                  </h3>
                </div>
              </div>

              {/* Spacer để giữ vị trí cho các mục bên dưới */}
              <div className="h-10" />

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 custom-scrollbar pb-4">
                <HistoryLeaderboardContent eventId={selected.id} t={t} />
              </div>

              {/* Footer / Info */}
              <div className="text-[14px] font-black text-yellow-500/90 text-center italic mt-4 uppercase tracking-wider">
                Top 20 {t('world_boss.history.ranking_info', 'bảng xếp hạng')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
