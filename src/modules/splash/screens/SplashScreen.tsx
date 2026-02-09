import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LEAVES = [
  { emoji: '🍃', top: '10%', left: '10%', delay: '0s', size: 'text-4xl' },
  { emoji: '🌿', top: '25%', right: '15%', delay: '1.5s', size: 'text-3xl' },
  { emoji: '🍀', bottom: '30%', left: '8%', delay: '3s', size: 'text-5xl' },
  { emoji: '🌱', bottom: '15%', right: '10%', delay: '0.8s', size: 'text-4xl' },
  { emoji: '☘️', top: '50%', left: '50%', delay: '2s', size: 'text-[35px]' },
];

export default function SplashScreen() {
  const navigate = useNavigate();
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTapped(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  const handleTap = () => {
    if (!tapped) setTapped(true);
    navigate('/farm', { replace: true });
  };

  return (
    <div
      className="fixed inset-0 z-[200] splash-gradient flex flex-col items-center justify-center cursor-pointer"
      onClick={handleTap}
    >
      {/* Background radials */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 40%)'
      }} />

      {/* Floating leaves */}
      {LEAVES.map((leaf, i) => (
        <span
          key={i}
          className={`absolute ${leaf.size} opacity-15 animate-float-leaf`}
          style={{
            top: leaf.top, left: leaf.left, right: leaf.right, bottom: leaf.bottom,
            animationDelay: leaf.delay,
          }}
        >
          {leaf.emoji}
        </span>
      ))}

      {/* Content */}
      <div className="text-center z-10 animate-splash-in">
        <div className="w-[140px] h-[140px] mx-auto mb-5 rounded-full flex items-center justify-center animate-logo-pulse"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)' }}
        >
          <span className="text-7xl">🌳</span>
        </div>
        <h1 className="font-heading text-4xl font-bold text-white text-shadow-md tracking-wide">
          Organic Kingdom
        </h1>
        <p className="text-sm text-white/75 mt-1.5 font-semibold tracking-[2px] uppercase">
          Grow • Learn • Battle
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-12 w-[200px] h-1.5 bg-white/20 rounded-full overflow-hidden z-10">
        <div className="h-full rounded-full animate-splash-progress"
          style={{ background: 'linear-gradient(90deg, #f0b429, #ffe066)' }}
        />
      </div>

      {/* Tap text */}
      <p className="mt-14 text-white/60 text-[13px] font-semibold tracking-wider z-10"
        style={{ animation: 'fade-in-up 1s 2.5s both' }}
      >
        Chạm để bắt đầu
      </p>
    </div>
  );
}
