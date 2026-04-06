import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CountdownTimerProps {
  startedAt: string;
  durationMinutes: number;
}

function formatTime(ms: number) {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function CountdownTimer({ startedAt, durationMinutes }: CountdownTimerProps) {
  const { t } = useTranslation();
  const endTime = new Date(startedAt).getTime() + durationMinutes * 60 * 1000;
  const [remaining, setRemaining] = useState(() => endTime - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(endTime - Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const isUrgent = remaining < 5 * 60 * 1000;
  const isCritical = remaining < 60 * 1000;

  // Brown-beige colors for normal state
  const colorClass = isCritical 
    ? 'text-red-500 animate-pulse' 
    : isUrgent 
      ? 'text-orange-400' 
      : 'text-[#fdead1]'; // Soft brownish-beige

  return (
    <div className={`flex items-center justify-center gap-2 py-2 text-sm font-bold tracking-tight ${colorClass}`}>
      <img 
        src="/assets/lobby_world_boss/icon_time.png" 
        alt="Clock Icon" 
        className="w-5 h-5 object-contain"
      />
      <span style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
        {remaining > 0 ? formatTime(remaining) : t('world_boss.info.time_out', 'Hết giờ')} {t('world_boss.info.left', 'còn lại')}
      </span>
    </div>
  );
}
