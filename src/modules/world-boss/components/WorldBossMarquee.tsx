import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWorldBoss } from '../hooks/useWorldBoss';

export function WorldBossMarquee() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data } = useWorldBoss();
  const [isAnimating, setIsAnimating] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (!data?.active || !data.boss) return null;

  const getElementLabel = (type: string) => {
    switch (type) {
      case 'fire': return { icon: '🔥', label: t('world_boss.marquee.fire') };
      case 'ice': return { icon: '❄️', label: t('world_boss.marquee.ice') };
      case 'water': return { icon: '💧', label: t('world_boss.marquee.water') };
      case 'wind': return { icon: '🌀', label: t('world_boss.marquee.wind') };
      case 'poison': return { icon: '☠️', label: t('world_boss.marquee.poison') };
      case 'chaos': return { icon: '💥', label: t('world_boss.marquee.chaos') };
      default: return { icon: '⚠️', label: type };
    }
  };

  const boss = data.boss;
  const el = getElementLabel(boss.element);
  const message = t('world_boss.marquee.appear_message', { icon: el.icon, bossName: boss.bossName, label: el.label });

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
