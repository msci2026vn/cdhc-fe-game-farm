// ═══════════════════════════════════════════════════════════════
// ManaBar — Mana fill bar with drain/regen animation
// ═══════════════════════════════════════════════════════════════

interface ManaBarProps {
  mana: number;
  maxMana: number;
  dodgeCost: number;
  ultCost: number;
  /** ULT charge 0-100. When >= 100, shows SẴN SÀNG badge */
  ultCharge?: number;
}

export default function ManaBar({ mana, maxMana, dodgeCost, ultCost, ultCharge = 0 }: ManaBarProps) {
  const pct = maxMana > 0 ? Math.max(0, Math.min(100, Math.round((mana / maxMana) * 100))) : 0;
  const canDodge = mana >= dodgeCost;
  const canUlt = mana >= ultCost;
  const ultReady = ultCharge >= 100;

  return (
    <div className="mb-0.5 mt-3 relative">
      <span className="absolute -top-2.5 left-1 text-[7px] font-black text-white/90 uppercase tracking-tighter" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.8)' }}>
        Mana NÉ:{dodgeCost} ULT:{ultCost}
      </span>
      <div className="h-[18px] w-full rounded-md relative drop-shadow-md">
        {/* Background slot (Tucked inside the frame) */}
        <div className="absolute inset-[2.5px] bg-[#1a0f0a]/80 rounded-[2px]" />

        {/* Real fill */}
        <div className="absolute top-[3.5px] bottom-[3.5px] left-[3.5px] rounded-sm transition-[width] duration-500 z-[2] overflow-hidden"
          style={{
            width: `calc((100% - 7px) * ${pct} / 100)`,
            background: ultReady
              ? 'linear-gradient(180deg, #9b59b6, #ec407a, #f1c40f)'
              : 'linear-gradient(180deg, #8e44ad, #6c5ce7)',
            boxShadow: ultReady
              ? '0 0 8px rgba(236,64,122,0.6)'
              : '0 0 4px rgba(108,92,231,0.4)',
          }}>
          {/* Liquid shine */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10" />
        </div>

        {/* Dodge cost marker */}
        {maxMana > 0 && (
          <div className="absolute top-[3.5px] bottom-[3.5px] w-[1px] z-[3]"
            style={{
              left: `calc(3.5px + (100% - 7px) * ${dodgeCost / maxMana})`,
              background: 'rgba(255,255,255,0.4)',
            }} />
        )}

        {/* Ult cost marker */}
        {maxMana > 0 && (
          <div className="absolute top-[3.5px] bottom-[3.5px] w-[1px] z-[3]"
            style={{
              left: `calc(3.5px + (100% - 7px) * ${ultCost / maxMana})`,
              background: 'rgba(255,255,255,0.6)',
            }} />
        )}

        {/* Frame Overlay */}
        <img 
          src="/assets/battle/frame_bar.png" 
          alt="Mana Frame" 
          className="absolute inset-0 w-full h-full object-fill z-[3] pointer-events-none" 
        />

        {/* Status Icon (Slightly larger for impact) */}
        <img 
          src="/assets/battle/icon_mana.png" 
          alt="Mana Icon" 
          className="absolute left-[-6px] top-1/2 -translate-y-1/2 h-[22px] w-auto z-[5] drop-shadow-md pointer-events-none" 
        />

        {/* Mana Text Overlay (Compact) */}
        <div className="absolute inset-0 flex items-center justify-center pl-2 z-[4] pointer-events-none">
          <span className="text-[8px] font-black text-white tracking-tighter" style={{ textShadow: '1px 1px 1px rgba(0,0,0,1)' }}>
            {mana}/{maxMana}
          </span>
        </div>
      </div>
    </div>
  );
}

