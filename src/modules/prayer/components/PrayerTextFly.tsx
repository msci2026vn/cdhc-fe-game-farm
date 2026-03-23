import { useEffect, useState } from 'react';

interface PrayerTextFlyProps {
  text: string | null;
  onDone: () => void;
}

export function PrayerTextFly({ text, onDone }: PrayerTextFlyProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!text) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 1500);
    return () => clearTimeout(timer);
  }, [text, onDone]);

  if (!text) return null;

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center pointer-events-none
        transition-all [transition-duration:1500ms]
        ${visible ? 'opacity-100' : 'opacity-0 -translate-y-20'}`}
    >
      <p className="text-white/80 text-lg font-body text-center px-8 max-w-xs animate-prayer-ascend">
        &ldquo;{text}&rdquo;
      </p>
    </div>
  );
}
