// ═══════════════════════════════════════════════════════════════
// BossRageOverlay — Red pulse overlay when boss HP is critically low
// Triggers when boss HP < 25% to show boss is "enraged"
// ═══════════════════════════════════════════════════════════════

interface BossRageOverlayProps {
  bossHpPct: number;
  bossEmoji: string;
}

export default function BossRageOverlay({ bossHpPct, bossEmoji }: BossRageOverlayProps) {
  // Only show when boss HP is critically low
  if (bossHpPct > 30 || bossHpPct <= 0) return null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      {/* Red pulse edges */}
      <div className="absolute inset-0 animate-rage-pulse"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(231,76,60,0.15) 100%)',
          boxShadow: 'inset 0 0 60px rgba(231,76,60,0.3), inset 0 0 120px rgba(231,76,60,0.1)',
        }} />

      {/* RAGE text */}
      {bossHpPct <= 30 && (
        <div className="absolute top-16 right-3 animate-pulse">
          <span className="font-heading text-xs font-bold px-2 py-1 rounded-lg"
            style={{ background: 'rgba(231,76,60,0.8)', color: '#fff', boxShadow: '0 0 10px rgba(231,76,60,0.5)' }}>
            {bossEmoji} RAGE!
          </span>
        </div>
      )}
    </div>
  );
}
