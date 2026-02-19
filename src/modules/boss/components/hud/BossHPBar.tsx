// ═══════════════════════════════════════════════════════════════
// BossHPBar — Boss HP bar with gradient fill, phase markers, heal indicator
// ═══════════════════════════════════════════════════════════════

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
}

function hpGradient(pct: number): string {
  if (pct > 60) return 'linear-gradient(90deg, #27ae60, #55efc4)';
  if (pct > 30) return 'linear-gradient(90deg, #f39c12, #fdcb6e)';
  return 'linear-gradient(90deg, #e74c3c, #ff6b6b)';
}

function hpGlow(pct: number): string {
  if (pct > 60) return '0 0 12px rgba(85,239,196,0.4)';
  if (pct > 30) return '0 0 12px rgba(253,203,110,0.4)';
  return '0 0 12px rgba(255,107,107,0.5)';
}

export default function BossHPBar({
  name, emoji, hp, maxHp,
  archetype, archetypeIcon,
  phase, totalPhases,
  healPerTurn,
}: BossHPBarProps) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100))) : 0;
  const hasPhases = totalPhases && totalPhases > 1;

  return (
    <div className="z-10 mb-1">
      {/* Boss name row */}
      <div className="flex items-center justify-between mb-0.5">
        <h2 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
          <span className="text-base">{emoji}</span> {name}
        </h2>
        <div className="flex items-center gap-1.5">
          {archetype && archetype !== 'none' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              {archetypeIcon || '❓'} {archetype}
            </span>
          )}
          {hasPhases && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(108,92,231,0.2)', color: '#a29bfe' }}>
              P{phase}/{totalPhases}
            </span>
          )}
          {healPerTurn !== undefined && healPerTurn > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(85,239,196,0.15)', color: '#55efc4' }}>
              +{healPerTurn}%/t
            </span>
          )}
        </div>
      </div>

      {/* HP bar */}
      <div className="w-full h-3.5 rounded-lg overflow-hidden relative"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Fill */}
        <div className="h-full rounded-lg relative transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: hpGradient(pct),
            boxShadow: hpGlow(pct),
          }}>
          {/* Glass shine */}
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)' }} />
        </div>

        {/* Phase markers */}
        {hasPhases && Array.from({ length: totalPhases - 1 }).map((_, i) => {
          const markerPct = ((totalPhases - 1 - i) / totalPhases) * 100;
          const isReached = pct <= markerPct;
          return (
            <div key={i} className="absolute top-0 bottom-0 w-0.5"
              style={{
                left: `${markerPct}%`,
                background: isReached ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                boxShadow: isReached ? '0 0 4px rgba(255,255,255,0.4)' : 'none',
              }} />
          );
        })}

        {/* HP text */}
        <span className="absolute inset-0 flex items-center justify-center font-heading text-[11px] font-bold text-white text-shadow-sm">
          {hp.toLocaleString()} / {maxHp.toLocaleString()} HP
        </span>
      </div>

      {/* Low HP pulse */}
      {pct > 0 && pct <= 25 && (
        <div className="h-0.5 mt-0.5 rounded-full animate-pulse"
          style={{ background: 'linear-gradient(90deg, #e74c3c, transparent)', width: `${pct}%` }} />
      )}
    </div>
  );
}
