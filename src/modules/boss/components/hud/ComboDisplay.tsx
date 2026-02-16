// ═══════════════════════════════════════════════════════════════
// ComboDisplay — Combo multiplier badge overlay
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

  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-combo-burst pointer-events-none z-20">
      <div className={`px-5 py-2 rounded-full font-heading font-bold text-white text-center ${combo >= 8 ? 'animate-pulse' : ''}`}
        style={{
          background: combo >= 8 ? 'linear-gradient(135deg, #f0932b, #e74c3c, #e056fd)' :
            combo >= 6 ? 'linear-gradient(135deg, #e056fd, #f0932b)' :
              combo >= 5 ? 'linear-gradient(135deg, #fd79a8, #e056fd)' :
                combo >= 4 ? 'linear-gradient(135deg, #e74c3c, #fd79a8)' :
                  combo >= 3 ? 'linear-gradient(135deg, #f39c12, #e74c3c)' :
                    'linear-gradient(135deg, #6c5ce7, #a29bfe)',
          boxShadow: `0 0 ${combo >= 5 ? 40 : 20}px ${color}80`,
          border: combo >= 6 ? '2px solid rgba(255,255,255,0.4)' : 'none',
        }}>
        <span className={vfx?.size || 'text-lg'}>
          {vfx?.emoji || '💥'} {label} x{combo}
        </span>
        <span className="block text-[10px] text-white/80">DMG ×{mult}</span>
      </div>
    </div>
  );
}

export { COMBO_VFX };
