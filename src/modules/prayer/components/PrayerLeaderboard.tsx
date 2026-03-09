import { usePrayerLeaderboard } from '../hooks/usePrayerLeaderboard';

export function PrayerLeaderboard() {
  const { data, isLoading } = usePrayerLeaderboard(10);

  if (isLoading) return <div className="text-white/50 text-center py-4 text-sm">Đang tải...</div>;
  if (!data?.length) return <div className="text-white/50 text-center py-4 text-sm">Chưa có dữ liệu</div>;

  return (
    <div className="space-y-2">
      <h3 className="font-heading text-base text-white font-bold px-1">🏆 Bảng xếp hạng</h3>
      {data.map((entry, i) => (
        <div key={entry.userId} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2">
          <span className="font-heading text-lg w-7 text-center">
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${entry.rank}`}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{entry.userName}</p>
            <p className="text-white/50 text-xs">{entry.totalPrayers} lời cầu nguyện</p>
          </div>
          {entry.currentStreak > 0 && (
            <span className="text-xs text-orange-400">🔥{entry.currentStreak}</span>
          )}
        </div>
      ))}
    </div>
  );
}
