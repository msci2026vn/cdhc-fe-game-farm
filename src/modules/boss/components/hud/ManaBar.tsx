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
    <div className="mb-0.5">
      <div className="flex justify-between items-center text-[8px] font-bold mb-px">
        <span style={{ color: '#a29bfe' }}>✨ Mana</span>
        <div className="flex items-center gap-2">
          <span style={{ color: canDodge ? '#55efc4' : '#ff6b6b' }} className="text-[8px]">
            NÉ:{dodgeCost}
          </span>
          <span style={{ color: canUlt ? '#a29bfe' : '#ff6b6b' }} className="text-[8px]">
            ULT:{ultCost}
          </span>
          {/* ULT ready badge — replaces mana count when charged */}
          {ultReady ? (
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse"
              style={{
                background: 'linear-gradient(90deg,#6c5ce7,#a29bfe,#fd79a8)',
                color: '#fff',
                boxShadow: '0 0 10px rgba(162,155,254,0.6)',
                letterSpacing: '0.3px',
              }}
            >
              ⚡ SẴN SÀNG!
            </span>
          ) : (
            <span style={{ color: '#a29bfe' }}>{mana}/{maxMana}</span>
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-md overflow-hidden relative"
        style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-md transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: ultReady
              ? 'linear-gradient(90deg, #a29bfe, #fd79a8, #fdcb6e)'
              : 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
            boxShadow: ultReady
              ? '0 0 10px rgba(253,121,168,0.5)'
              : '0 0 6px rgba(108,92,231,0.3)',
            animation: ultReady ? 'pulse 1.5s ease-in-out infinite' : undefined,
          }} />

        {/* Dodge cost marker */}
        {maxMana > 0 && (
          <div className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${Math.min(100, (dodgeCost / maxMana) * 100)}%`,
              background: 'rgba(85,239,196,0.5)',
            }} />
        )}

        {/* Ult cost marker */}
        {maxMana > 0 && (
          <div className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${Math.min(100, (ultCost / maxMana) * 100)}%`,
              background: 'rgba(162,155,254,0.5)',
            }} />
        )}

        <div className="absolute inset-x-0 top-0 h-1/2"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)' }} />
      </div>
    </div>
  );
}

