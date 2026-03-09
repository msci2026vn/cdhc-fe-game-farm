import { useEffect, useState } from 'react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  delay: number;
  emoji: string;
}

const SPARKLE_EMOJIS = ['✨', '🌟', '💫', '⭐', '🙏'];

interface PrayerSparklesProps {
  active: boolean;
  onDone?: () => void;
}

export function PrayerSparkles({ active, onDone }: PrayerSparklesProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    if (!active) {
      setSparkles([]);
      return;
    }

    const count = 8 + Math.floor(Math.random() * 5);
    const newSparkles: Sparkle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      y: 40 + Math.random() * 30,
      delay: Math.random() * 0.5,
      emoji: SPARKLE_EMOJIS[Math.floor(Math.random() * SPARKLE_EMOJIS.length)]!,
    }));
    setSparkles(newSparkles);

    const timer = setTimeout(() => {
      setSparkles([]);
      onDone?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [active, onDone]);

  if (!sparkles.length) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="absolute animate-prayer-ascend text-2xl"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            animationDelay: `${s.delay}s`,
          }}
        >
          {s.emoji}
        </div>
      ))}
    </div>
  );
}
