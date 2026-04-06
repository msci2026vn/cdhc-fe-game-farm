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
    pct > 0.6 ? 'from-[#00ffcc] via-[#22d3ee] to-[#059669]' : // Magical Emerald/Cyan
    pct > 0.3 ? 'from-[#fbbf24] via-[#f59e0b] to-[#d97706]' : // Glowing Gold
    'from-[#f43f5e] via-[#e11d48] to-[#9f1239]'; // Infernal Red

  const glowColor = 
    pct > 0.6 ? 'shadow-[0_0_15px_rgba(34,211,238,0.6)]' : 
    pct > 0.3 ? 'shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 
    'shadow-[0_0_15px_rgba(225,29,72,0.6)]';

  const isLow = pct < 0.3;

  return (
    <div className="px-4 py-1">
      <div className="relative h-[48px] w-full flex items-center justify-center">
        {/* Frame Image - Moved to z-20 to be on top of the bar */}
        <div 
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            backgroundImage: "url('/assets/lobby_world_boss/frame_hp.png')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Labels below the frame if needed, but screenshot shows on top/sides */}
        {/* Left HP Label */}
        <div 
          className="absolute left-[-10px] top-[-20px] text-xs font-black text-white whitespace-nowrap z-30"
          style={{ textShadow: '0 0 6px rgba(0,0,0,1), 0 2px 2px rgba(0,0,0,1)' }}
        >
          {Math.round(displayHp).toLocaleString()} HP
        </div>
        
        {/* Right % Label */}
        <div 
          className="absolute right-[-10px] top-[-20px] text-xs font-black text-yellow-400 z-30"
          style={{ textShadow: '0 0 6px rgba(0,0,0,1), 0 2px 2px rgba(0,0,0,1)' }}
        >
          {pctDisplay}%
        </div>

        {/* Progress Bar Container - Moved to z-10 to be behind the frame */}
        <div className="relative w-[92%] h-[32px] rounded-full overflow-hidden bg-black/60 z-10 border border-white/10">
          {/* Main Magical Gradient */}
          <div
            className={`absolute inset-y-0 left-0 w-full bg-gradient-to-r ${barColor} rounded-full origin-left ${glowColor} ${isLow ? 'animate-pulse' : ''}`}
            style={{ 
              transform: `scaleX(${pct})`, 
              willChange: 'transform', 
              transition: 'none',
              boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.4)',
            }}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-[50%] skew-x-[-20deg] animate-shimmer-slow pointer-events-none" />
            
            {/* Top Shine/Glass Effect */}
            <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/20 to-transparent rounded-t-full" />
          </div>
        </div>

        {/* Centered Numbers - Moved to z-30 to be on top of everything */}
        <div 
          className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white tracking-tight z-30 pointer-events-none"
          style={{ textShadow: '0 0 6px rgba(0,0,0,1), 0 2px 2px rgba(0,0,0,1)' }}
        >
          {Math.round(displayHp).toLocaleString()} / {maxHp.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
