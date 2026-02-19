// ═══════════════════════════════════════════════════════════════
// ComboDisplay — Candy-crush style combo multiplier badge
// Lightweight: CSS-only effects, no extra DOM for particles
// ═══════════════════════════════════════════════════════════════

const COMBO_VFX: Record<string, { emoji: string; particles: string[]; size: string }> = {
  'COMBO': { emoji: '💥', particles: ['✨', '💫'], size: 'text-base' },
  'SUPER': { emoji: '🌟', particles: ['⚡', '💛', '✨'], size: 'text-lg' },
  'MEGA': { emoji: '🔥', particles: ['💥', '🔥', '💢'], size: 'text-xl' },
  'ULTRA': { emoji: '💜', particles: ['💎', '💠', '🌀', '✨'], size: 'text-2xl' },
  'LEGENDARY': { emoji: '👑', particles: ['🌈', '💎', '⭐', '👑'], size: 'text-2xl' },
  '🔥 GODLIKE': { emoji: '☄️', particles: ['🔥', '💀', '⚡', '💥', '☄️'], size: 'text-3xl' },
};

interface ComboDisplayProps {
  combo: number;
  show: boolean;
  label: string;
  mult: number;
  color: string;
}

export default function ComboDisplay({ combo, show, label, mult, color }: ComboDisplayProps) {
  if (!show || combo < 2) return null;

  const vfx = COMBO_VFX[label];
  const isHigh = combo >= 5;
  const isGodlike = combo >= 8;

  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-combo-burst pointer-events-none z-20">
      {/* Expanding ring behind badge (high combos only) */}
      {isHigh && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="combo-ring-burst" style={{ borderColor: color }} />
        </div>
      )}

      {/* Main badge */}
      <div
        className={`
          relative px-5 py-2 rounded-full font-heading font-bold text-white text-center
          ${isGodlike ? 'combo-badge-godlike' : isHigh ? 'combo-badge-high' : ''}
        `}
        style={{
          background: isGodlike ? 'linear-gradient(135deg, #f0932b, #e74c3c, #e056fd)' :
            combo >= 6 ? 'linear-gradient(135deg, #e056fd, #f0932b)' :
              combo >= 5 ? 'linear-gradient(135deg, #fd79a8, #e056fd)' :
                combo >= 4 ? 'linear-gradient(135deg, #e74c3c, #fd79a8)' :
                  combo >= 3 ? 'linear-gradient(135deg, #f39c12, #e74c3c)' :
                    'linear-gradient(135deg, #6c5ce7, #a29bfe)',
          boxShadow: `0 0 ${isGodlike ? 60 : isHigh ? 40 : 20}px ${color}80`,
          border: combo >= 6 ? '2px solid rgba(255,255,255,0.5)' : 'none',
        }}
      >
        {/* Inner glow overlay for high combos */}
        {isHigh && (
          <div className="absolute inset-0 rounded-full combo-inner-glow" />
        )}

        <span className={`relative z-10 ${vfx?.size || 'text-lg'}`}>
          {vfx?.emoji || '💥'} {label} x{combo}
        </span>
        <span className="relative z-10 block text-[10px] text-white/80 font-semibold tracking-wider">
          DMG ×{mult}
        </span>
      </div>
    </div>
  );
}

export { COMBO_VFX };
