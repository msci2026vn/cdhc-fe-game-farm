import { formatTime } from '../utils/format';
import { useCooldown } from '../hooks/useCooldown';
import { useEffect } from 'react';

interface CooldownTimerProps {
  seconds: number;
  onComplete?: () => void;
  className?: string;
}

export default function CooldownTimer({ seconds, onComplete, className = '' }: CooldownTimerProps) {
  const { remaining, isActive } = useCooldown(seconds);

  useEffect(() => {
    if (!isActive && seconds > 0) {
      onComplete?.();
    }
  }, [isActive, seconds, onComplete]);

  if (!isActive) return null;

  return (
    <span className={`font-mono text-sm font-bold text-muted-foreground ${className}`}>
      ⏳ {formatTime(remaining)}
    </span>
  );
}
