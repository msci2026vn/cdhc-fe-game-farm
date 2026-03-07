import { useMemo, useEffect, useState } from 'react';

const COLORS = ['#fbbf24', '#f97316', '#ef4444', '#fde047', '#ffffff', '#a855f7'];

interface Particle {
  id: number;
  x: number;
  color: string;
  duration: number;
  delay: number;
  size: number;
}

export function ConfettiEffect() {
  const [visible, setVisible] = useState(true);

  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      duration: 1.5 + Math.random() * 1.5,
      delay: Math.random() * 0.8,
      size: 4 + Math.random() * 6,
    })),
  []);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}
