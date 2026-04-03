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
    <div className={`flex flex-col gap-3 transition-all duration-200 ${isHit ? 'hp-bar-hit' : ''} ${isHealing ? 'animate-heal-pulse' : ''}`}>
      {/* HP */}
      <div className="flex-1 min-w-0 relative">
        <span className="absolute -top-2.5 left-1 text-[7px] font-black text-white/90 uppercase tracking-tighter" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.8)' }}>HP</span>
        <div className={`h-[18px] w-full rounded-md relative ${isCritical ? 'hp-bar-critical' : ''} ${isFlashingDamage ? 'animate-hp-damage-flash' : ''} drop-shadow-md`}>
          {/* Background slot (Tucked inside the frame) */}
          <div className="absolute inset-[2.5px] bg-[#1a0f0a]/80 rounded-[2px]" />

          {/* Fill Track (handles 3px insets for ultra-compact scale) */}
          <div className="absolute inset-y-[3.5px] left-[3.5px] right-[3.5px] z-[1]">
            {/* Ghost bar */}
            <div className="absolute inset-y-0 left-0 transition-all duration-500 bg-white/30 rounded-sm"
              style={{ width: `${ghostHp}%`, opacity: ghostHp > hpPct ? 1 : 0 }} />
            
            {/* Real Fill */}
            <div className="h-full transition-all duration-300 rounded-sm overflow-hidden"
              style={{ 
                width: `${hpPct}%`, 
                background: 'linear-gradient(180deg, #ff4d4d, #b30000)',
                boxShadow: isCritical ? '0 0 6px rgba(255,77,77,0.7)' : '0 0 3px rgba(255,0,0,0.2)',
              }}>
              <div className="w-full h-1/2 bg-white/20" />
            </div>
          </div>

          {/* Frame Overlay */}
          <img 
            src="/assets/battle/frame_bar.png" 
            alt="Frame" 
            className="absolute inset-0 w-full h-full object-fill z-[3] pointer-events-none" 
          />

          {/* Status Icon (Slightly larger for impact) */}
          <img 
            src="/assets/battle/icon_hp.png" 
            alt="HP Icon" 
            className="absolute left-[-6px] top-1/2 -translate-y-1/2 h-[22px] w-auto z-[5] drop-shadow-md pointer-events-none" 
          />
          
          {/* HP Text Overlay (Compact) */}
          <div className="absolute inset-0 flex items-center justify-center pl-2 z-[4] pointer-events-none">
            <span className="text-[8px] font-black text-white tracking-tighter" style={{ textShadow: '1px 1px 1px rgba(0,0,0,1)' }}>
              {hp}/{maxHp}
            </span>
          </div>
        </div>
      </div>

      {/* Shield */}
      <div className="flex-1 min-w-0 relative">
        <span className="absolute -top-2.5 left-1 text-[7px] font-black text-white/90 uppercase tracking-tighter" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.8)' }}>DEF</span>
        <div className="h-[18px] w-full rounded-md relative drop-shadow-md">
          {/* Background slot (Tucked inside) */}
          <div className="absolute inset-[2.5px] bg-[#1a0f0a]/80 rounded-[2px]" />

          {/* Fill Track */}
          <div className="absolute inset-y-[3.5px] left-[3.5px] right-[3.5px] z-[1]">
            <div className="h-full transition-all duration-300 rounded-sm overflow-hidden"
              style={{ 
                width: `${shieldPct}%`, 
                background: 'linear-gradient(180deg, #3399ff, #004d99)',
                boxShadow: '0 0 4px rgba(51,153,255,0.3)',
              }}>
              <div className="w-full h-1/2 bg-white/20" />
            </div>
          </div>

          {/* Frame Overlay */}
          <img 
            src="/assets/battle/frame_bar.png" 
            alt="Def Frame" 
            className="absolute inset-0 w-full h-full object-fill z-[3] pointer-events-none" 
          />

          {/* Status Icon */}
          <img 
            src="/assets/battle/icon_def.png" 
            alt="DEF Icon" 
            className="absolute left-[-6px] top-1/2 -translate-y-1/2 h-[22px] w-auto z-[5] drop-shadow-md pointer-events-none" 
          />

          {/* Def Text Overlay (Compact) */}
          <div className="absolute inset-0 flex items-center justify-center pl-2 z-[4] pointer-events-none">
            <span className="text-[8px] font-black text-white tracking-tighter" style={{ textShadow: '1px 1px 1px rgba(0,0,0,1)' }}>
              {shield}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
