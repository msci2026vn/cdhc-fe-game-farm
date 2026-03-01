// ═══════════════════════════════════════════════════════════════
// PlayerHPBar — Player HP + Shield bars with damage drain animation
// Lightweight: CSS transitions only, GPU-accelerated
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';

interface PlayerHPBarProps {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  def: number;
  /** Flash red when player takes damage (optional, campaign only) */
  isHit?: boolean;
}

export default function PlayerHPBar({ hp, maxHp, shield, maxShield, def, isHit }: PlayerHPBarProps) {
  const hpPct = maxHp > 0 ? Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100))) : 0;
  const shieldPct = maxShield > 0 ? Math.max(0, Math.min(100, Math.round((shield / maxShield) * 100))) : 0;
  const isCritical = hpPct <= 30 && hpPct > 0;

  // Trailing "ghost" HP bar — shows where HP was before damage
  const [ghostHp, setGhostHp] = useState(hpPct);
  const prevHp = useRef(hpPct);
  const [isHealing, setIsHealing] = useState(false);
  const [isFlashingDamage, setIsFlashingDamage] = useState(false);

  useEffect(() => {
    if (hpPct < prevHp.current) {
      // HP dropped — keep ghost at old value, then drain after delay
      setGhostHp(prevHp.current);
      setIsFlashingDamage(true);
      const timer = setTimeout(() => {
        setGhostHp(hpPct);
        setIsFlashingDamage(false);
      }, 400);
      prevHp.current = hpPct;
      return () => clearTimeout(timer);
    }
    if (hpPct > prevHp.current) {
      // HP Healed
      setIsHealing(true);
      setTimeout(() => setIsHealing(false), 500); // match heal-pulse duration
    }

    // HP healed or normal sync — snap ghost immediately
    setGhostHp(hpPct);
    prevHp.current = hpPct;
  }, [hpPct]);

  return (
    <div className={`flex gap-1.5 mb-0.5 transition-all duration-200 ${isHit ? 'hp-bar-hit' : ''} ${isHealing ? 'animate-heal-pulse' : ''}`}>
      {/* HP */}
      <div className="flex-1 min-w-0">
        <div className={`flex justify-between text-[8px] font-bold mb-px`}>
          <span style={{ color: '#55efc4' }}>❤️ HP</span>
          <span style={{ color: isFlashingDamage ? '#ff6b6b' : '#55efc4' }}>{hp.toLocaleString()}/{maxHp.toLocaleString()}</span>
        </div>
        <div className={`h-2.5 rounded-md overflow-hidden relative ${isCritical ? 'hp-bar-critical' : ''} ${isFlashingDamage ? 'animate-hp-damage-flash' : ''}`}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Ghost bar (damage drain effect — red, fades behind real HP) */}
          <div className="absolute inset-y-0 left-0 rounded-md hp-ghost-bar"
            style={{
              width: `${ghostHp}%`,
              background: 'linear-gradient(90deg, #e74c3c, #ff6b6b)',
              opacity: ghostHp > hpPct ? 0.6 : 0,
            }} />

          {/* Real HP fill */}
          <div className="h-full rounded-md relative z-[1] hp-bar-fill"
            style={{
              width: `${hpPct}%`,
              background: hpPct > 60
                ? 'linear-gradient(90deg, #00b894, #55efc4)'
                : hpPct > 30
                  ? 'linear-gradient(90deg, #f39c12, #fdcb6e)'
                  : 'linear-gradient(90deg, #e74c3c, #ff6b6b)',
              boxShadow: isCritical ? '0 0 8px rgba(231,76,60,0.6)' : 'none',
            }} />

          {/* Glass shine */}
          <div className="absolute inset-x-0 top-0 h-1/2 z-[2]"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent)' }} />
        </div>
      </div>

      {/* Shield */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-[8px] font-bold mb-px" style={{ color: '#74b9ff' }}>
          <span>🛡️ DEF {def}</span>
          <span>{shield}</span>
        </div>
        <div className="h-2.5 rounded-md overflow-hidden relative"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-md hp-bar-fill"
            style={{
              width: `${shieldPct}%`,
              background: 'linear-gradient(90deg, #0984e3, #74b9ff)',
            }} />
          <div className="absolute inset-x-0 top-0 h-1/2"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent)' }} />
        </div>
      </div>
    </div>
  );
}
