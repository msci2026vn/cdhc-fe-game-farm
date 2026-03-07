import { useState, useEffect, useCallback } from 'react';

interface Props {
  endTime: string;
  onExpired?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

function calcRemaining(endTime: string) {
  const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
  return {
    total: diff,
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function AuctionCountdown({ endTime, onExpired, size = 'md' }: Props) {
  const [rem, setRem] = useState(() => calcRemaining(endTime));

  const tick = useCallback(() => {
    const r = calcRemaining(endTime);
    setRem(r);
    if (r.total <= 0) onExpired?.();
  }, [endTime, onExpired]);

  useEffect(() => {
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [tick]);

  const expired = rem.total <= 0;
  const urgent = rem.total <= 60_000;
  const warning = rem.total <= 300_000;

  const colorClass = expired
    ? 'text-gray-500'
    : urgent
      ? 'text-red-500 animate-pulse font-bold'
      : warning
        ? 'text-yellow-400 animate-pulse'
        : 'text-white';

  const display = size === 'lg'
    ? `${pad(rem.hours)}:${pad(rem.minutes)}:${pad(rem.seconds)}`
    : `${pad(rem.minutes)}:${pad(rem.seconds)}`;

  const sizeClass = size === 'lg'
    ? 'text-2xl font-mono font-bold'
    : size === 'sm'
      ? 'text-sm font-mono'
      : 'text-lg font-mono font-semibold';

  return (
    <span className={`${sizeClass} ${colorClass} tabular-nums`}>
      {expired ? '00:00' : display}
    </span>
  );
}
