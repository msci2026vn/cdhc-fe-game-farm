import { usePrayerHistory } from '../hooks/usePrayerHistory';

export function PrayerHistory() {
  const { data, isLoading } = usePrayerHistory();

  if (isLoading) return <div className="text-white/50 text-center py-4 text-sm">Đang tải...</div>;
  if (!data?.length) return (
    <div className="text-center py-8">
      <div className="text-4xl mb-2">📜</div>
      <p className="text-white/50 text-sm">Chưa có lời cầu nguyện nào</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <h3 className="font-heading text-base text-white font-bold px-1">📜 Lịch sử</h3>
      {data.map((item) => (
        <div key={item.id} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2">
          <p className="text-white text-sm line-clamp-2">&ldquo;{item.text}&rdquo;</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-white/40 text-xs">
              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </span>
            <div className="flex gap-2 text-xs">
              {item.ognReward > 0 && <span className="text-amber-400">+{item.ognReward} OGN</span>}
              {item.xpReward > 0 && <span className="text-blue-400">+{item.xpReward} XP</span>}
              {item.multiplier > 1 && <span className="text-yellow-300">x{item.multiplier}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
