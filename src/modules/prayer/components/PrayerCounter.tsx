import { AnimatedNumber } from '@/shared/components/AnimatedNumber';
import { usePrayerGlobal } from '../hooks/usePrayerGlobal';

export function PrayerCounter() {
  const { data } = usePrayerGlobal();

  return (
    <div className="text-center py-6">
      <div className="text-4xl mb-2">🌍</div>
      <div className="flex items-center justify-center gap-1">
        <AnimatedNumber
          value={data?.totalPrayers || 0}
          className="font-heading text-3xl text-white font-bold"
        />
      </div>
      <p className="text-white/70 text-sm mt-1">lời cầu nguyện đã gửi đi</p>
      {data?.todayPrayers !== undefined && data.todayPrayers > 0 && (
        <p className="text-white/50 text-xs mt-1">
          Hôm nay: {data.todayPrayers.toLocaleString('vi-VN')}
        </p>
      )}
    </div>
  );
}
