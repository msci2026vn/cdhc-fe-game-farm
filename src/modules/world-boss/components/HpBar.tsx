import { useEffect, useRef, useState } from 'react';

interface HpBarProps {
  currentHp: number;
  maxHp: number;
}

export function HpBar({ currentHp, maxHp }: HpBarProps) {
  const [displayHp, setDisplayHp] = useState(currentHp);
  const rafRef = useRef<number | null>(null);
  const displayHpRef = useRef(currentHp);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const target = currentHp;
    const animate = () => {
      const current = displayHpRef.current;
      const diff = target - current;
      if (Math.abs(diff) < 1) {
        displayHpRef.current = target;
        setDisplayHp(target);
        return;
      }
      displayHpRef.current = current + diff * 0.1;
      setDisplayHp(displayHpRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [currentHp]);

  const pct = maxHp > 0 ? Math.max(0, Math.min(1, displayHp / maxHp)) : 0;
  const pctDisplay = (pct * 100).toFixed(1);

  const barColor =
    pct > 0.6 ? 'from-green-500 to-teal-400' :
    pct > 0.3 ? 'from-yellow-500 to-orange-400' :
    'from-red-600 to-red-800';

  const isLow = pct < 0.3;

  return (
    <div className="px-4 py-2">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{Math.round(displayHp).toLocaleString()} HP</span>
        <span>{pctDisplay}%</span>
      </div>
      <div
        className="relative h-6 bg-gray-800 rounded-full overflow-hidden"
        style={{ willChange: 'transform' }}
      >
        <div
          className={`absolute inset-y-0 left-0 w-full bg-gradient-to-r ${barColor} rounded-full origin-left ${isLow ? 'animate-pulse' : ''}`}
          style={{ transform: `scaleX(${pct})`, willChange: 'transform', transition: 'none' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
          {Math.round(displayHp).toLocaleString()} / {maxHp.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
