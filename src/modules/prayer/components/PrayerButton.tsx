import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { playSound } from '@/shared/audio';

interface PrayerButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  cooldownSeconds?: number;
  label?: string;
}

export function PrayerButton({
  onClick,
  disabled = false,
  loading = false,
  cooldownSeconds = 0,
  label = '🙏 Cầu Nguyện',
}: PrayerButtonProps) {
  const [countdown, setCountdown] = useState(cooldownSeconds);

  useEffect(() => {
    setCountdown(cooldownSeconds);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const isCooldown = countdown > 0;
  const isDisabled = disabled || loading || isCooldown;

  return (
    <button
      onClick={() => { if (!isDisabled) playSound('prayer_submit'); onClick(); }}
      disabled={isDisabled}
      className={cn(
        'w-full py-4 rounded-2xl font-heading text-lg font-bold',
        'transition-all duration-200 active:scale-[0.97] active:translate-y-0.5',
        'relative overflow-hidden',
        isDisabled
          ? 'bg-white/10 text-white/40 cursor-not-allowed'
          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 animate-event-pulse',
      )}
    >
      {/* Cooldown overlay */}
      {isCooldown && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <span className="text-white/80 font-body text-base">
            ⏳ Cầu lại sau {countdown}s
          </span>
        </div>
      )}

      {/* Button content */}
      {loading ? (
        <span className="animate-pulse">Đang gửi...</span>
      ) : !isCooldown ? (
        label
      ) : null}
    </button>
  );
}
