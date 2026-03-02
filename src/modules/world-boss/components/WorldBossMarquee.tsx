import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldBoss } from '../hooks/useWorldBoss';

const ELEMENT_CONFIG: Record<string, { icon: string; label: string }> = {
  fire:   { icon: '🔥', label: 'Lửa' },
  ice:    { icon: '❄️', label: 'Băng' },
  water:  { icon: '💧', label: 'Nước' },
  wind:   { icon: '🌀', label: 'Gió' },
  poison: { icon: '☠️', label: 'Độc' },
  chaos:  { icon: '💥', label: 'Hỗn Loạn' },
};

export function WorldBossMarquee() {
  const navigate = useNavigate();
  const { data } = useWorldBoss();
  const [isAnimating, setIsAnimating] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (!data?.active || !data.boss) return null;

  const boss = data.boss;
  const el = ELEMENT_CONFIG[boss.element] ?? { icon: '⚠️', label: boss.element };
  const message = `⚠️ ${el.icon} ${boss.bossName} (${el.label}) xuất hiện! Mau vào đánh boss bảo vệ mùa màng!`;

  const handleAnimationEnd = () => {
    setIsAnimating(false);
    timerRef.current = setTimeout(() => setIsAnimating(true), 10000);
  };

  return (
    <div
      className="relative z-10 w-full overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(90deg, #7f1d1d, #991b1b, #7f1d1d)',
        height: isAnimating ? '32px' : '0px',
        borderTop: isAnimating ? '1px solid rgba(255,255,255,0.1)' : 'none',
        borderBottom: isAnimating ? '1px solid rgba(0,0,0,0.2)' : 'none',
        transition: 'height 0.3s ease',
      }}
      onClick={() => navigate('/world-boss')}
    >
      <div
        className="whitespace-nowrap text-white text-sm font-bold leading-8 px-4"
        style={{
          willChange: 'transform',
          animation: isAnimating ? 'marquee-scroll 14s linear forwards' : 'none',
          transform: isAnimating ? undefined : 'translateX(-110%)',
        }}
        onAnimationEnd={handleAnimationEnd}
      >
        {message}
      </div>
    </div>
  );
}
