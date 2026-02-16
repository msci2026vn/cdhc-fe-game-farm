// ═══════════════════════════════════════════════════════════════
// PlayerHPBar — Player HP bar + shield bar + DEF indicator
// ═══════════════════════════════════════════════════════════════

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

  return (
    <div className={`flex gap-1.5 mb-1.5 rounded-lg transition-all duration-200 ${isHit ? 'ring-1 ring-red-500/60 bg-red-500/10 animate-screen-shake' : ''}`}>
      {/* HP */}
      <div className="flex-1">
        <div className="flex justify-between text-[9px] font-bold mb-0.5" style={{ color: '#55efc4' }}>
          <span>❤️ HP</span>
          <span>{hp.toLocaleString()}/{maxHp.toLocaleString()}</span>
        </div>
        <div className={`h-2.5 rounded-md overflow-hidden relative ${isCritical ? 'animate-pulse' : ''}`}
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-md transition-all duration-500"
            style={{
              width: `${hpPct}%`,
              background: hpPct > 30 ? 'linear-gradient(90deg, #00b894, #55efc4)' : 'linear-gradient(90deg, #e74c3c, #ff6b6b)',
              boxShadow: isCritical ? '0 0 8px rgba(231,76,60,0.5)' : 'none',
            }} />
          {/* Glass shine */}
          <div className="absolute inset-x-0 top-0 h-1/2"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)' }} />
        </div>
      </div>

      {/* Shield */}
      <div className="flex-1">
        <div className="flex justify-between text-[9px] font-bold mb-0.5" style={{ color: '#74b9ff' }}>
          <span>🛡️ DEF {def}</span>
          <span>{shield}</span>
        </div>
        <div className="h-2.5 rounded-md overflow-hidden relative"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-md transition-all duration-500"
            style={{
              width: `${shieldPct}%`,
              background: 'linear-gradient(90deg, #0984e3, #74b9ff)',
            }} />
          <div className="absolute inset-x-0 top-0 h-1/2"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)' }} />
        </div>
      </div>
    </div>
  );
}
