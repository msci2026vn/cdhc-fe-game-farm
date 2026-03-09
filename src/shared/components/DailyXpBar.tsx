/**
 * DailyXpBar — Shows daily XP progress toward 2,000 cap
 *
 * Compact bar displayed below the XP bar in FarmHeader.
 */
import { useDailyStatus } from '../hooks/useDailyStatus';

export function DailyXpBar() {
  const { data: daily, isLoading } = useDailyStatus();

  if (isLoading || !daily) return null;

  const { used, cap } = daily.xp;
  const pct = Math.min(100, (used / cap) * 100);
  const isCapped = used >= cap;

  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-[9px] font-bold text-white/50 whitespace-nowrap">
        {isCapped ? 'XP Max' : 'XP/day'}
      </span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isCapped
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
          }}
        />
      </div>
      <span className={`text-[9px] font-bold whitespace-nowrap ${isCapped ? 'text-emerald-500' : 'text-white/50'}`}>
        {used.toLocaleString()}/{cap.toLocaleString()}
      </span>
    </div>
  );
}
