// ═══════════════════════════════════════════════════════════════
// BossHPBar — Boss HP bar with gradient fill, damage drain, phases
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';

interface BossHPBarProps {
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  archetype?: string;
  archetypeIcon?: string;
  phase?: number;
  totalPhases?: number;
  healPerTurn?: number;
  showName?: boolean;
  centerName?: boolean;
}

function hpGradient(pct: number): string {
  if (pct > 60) return 'linear-gradient(90deg, #27ae60, #55efc4)';
  if (pct > 30) return 'linear-gradient(90deg, #f39c12, #fdcb6e)';
  return 'linear-gradient(90deg, #e74c3c, #ff6b6b)';
}

function hpGlow(pct: number): string {
  if (pct > 60) return '0 0 10px rgba(85,239,196,0.3)';
  if (pct > 30) return '0 0 10px rgba(253,203,110,0.3)';
  return '0 0 10px rgba(255,107,107,0.4)';
}

export default function BossHPBar({
  name, emoji, hp, maxHp,
  archetype, archetypeIcon,
  phase, totalPhases,
  healPerTurn,
  showName = true,
  centerName = false
}: BossHPBarProps) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100))) : 0;
  const hasPhases = totalPhases && totalPhases > 1;

  // Ghost HP bar for damage drain animation
  const [ghostPct, setGhostPct] = useState(pct);
  const prevPct = useRef(pct);

  useEffect(() => {
    if (pct < prevPct.current) {
      setGhostPct(prevPct.current);
      const timer = setTimeout(() => setGhostPct(pct), 500);
      prevPct.current = pct;
      return () => clearTimeout(timer);
    }
    setGhostPct(pct);
    prevPct.current = pct;
  }, [pct]);

  return (
    <div className="z-10 mb-0.5 w-full">
      {/* Boss name row — compact */}
      {showName && (
        <div className={`flex items-center ${centerName ? 'justify-center gap-1.5' : 'justify-between'} mb-0.5 px-1`}>
          <span className="font-heading font-black text-[13px] text-white tracking-wider drop-shadow-md"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,107,107,0.6)' }}>
            {emoji} {name}
          </span>
          <div className={`flex items-center gap-1 flex-shrink-0 ${centerName ? 'absolute right-1 top-[-2px]' : ''}`}>
            {hasPhases && (
              <span className="text-[8px] font-bold px-1 py-0.5 rounded"
                style={{ background: 'rgba(108,92,231,0.2)', color: '#a29bfe' }}>
                P{phase}/{totalPhases}
              </span>
            )}
            {healPerTurn !== undefined && healPerTurn > 0 && (
              <span className="text-[8px] font-bold px-1 py-0.5 rounded"
                style={{ background: 'rgba(85,239,196,0.15)', color: '#55efc4' }}>
                +{healPerTurn}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* HP bar Container */}
      <div className="w-full h-4 rounded-full overflow-hidden relative bg-black/40 border border-white/10 shadow-inner">
        
        {/* Ghost bar (damage drain) */}
        <div className="absolute inset-y-0 left-0 rounded-full hp-ghost-bar transition-all duration-500"
          style={{
            width: `${ghostPct}%`,
            background: 'rgba(255,255,255,0.2)',
            opacity: ghostPct > pct ? 1 : 0,
          }} />

        {/* Real fill */}
        <div className="h-full rounded-full relative z-[1] hp-bar-fill transition-all duration-300 ease-out"
          style={{
            width: `${pct}%`,
            background: hpGradient(pct),
            boxShadow: hpGlow(pct),
          }}>
          {/* Subtle glass shine */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
        </div>

        {/* Phase markers */}
        {hasPhases && Array.from({ length: totalPhases - 1 }).map((_, i) => {
          const markerPct = ((totalPhases - 1 - i) / totalPhases) * 100;
          return (
            <div key={i} className="absolute top-0 bottom-0 w-0.5 z-[2] bg-white/20"
              style={{ left: `${markerPct}%` }} />
          );
        })}

        {/* HP text */}
        <span className="absolute inset-0 flex items-center justify-center font-heading text-[11px] font-bold text-white z-[3] tracking-wider"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
          {hp.toLocaleString()} / {maxHp.toLocaleString()}
        </span>
      </div>

      {/* Low HP pulse indicator */}
      {pct > 0 && pct <= 25 && (
        <div className="h-px mt-0.5 rounded-full animate-pulse"
          style={{ background: 'linear-gradient(90deg, #e74c3c, transparent)', width: `${pct}%` }} />
      )}
    </div>
  );
}
