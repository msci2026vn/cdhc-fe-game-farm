// ═══════════════════════════════════════════════════════════════
// ComboDisplay — Tier-aware combo badge with escalating VFX
// 8 tiers: NICE → GREAT → EXCELLENT → AMAZING → EPIC → LEGENDARY → MYTHIC
// ═══════════════════════════════════════════════════════════════

import { COMBO_VFX } from '@/shared/match3/combat.config';

interface ComboDisplayProps {
  combo: number;
  show: boolean;
  label: string;
  mult: number;
  color: string;
}

// Tier → CSS animation class
const TIER_ANIM: Record<string, string> = {
  'NICE':      'combo-tier-nice',
  'GREAT':     'combo-tier-great',
  'EXCELLENT': 'combo-tier-excellent',
  'AMAZING':   'combo-tier-amazing',
  'EPIC':      'combo-tier-epic',
  'LEGENDARY': 'combo-tier-legendary',
  'MYTHIC':    'combo-tier-mythic',
};

// Tier → background gradient
const TIER_BG: Record<string, string> = {
  'NICE':      'linear-gradient(135deg, #16a34a, #22c55e)',
  'GREAT':     'linear-gradient(135deg, #2563eb, #3b82f6)',
  'EXCELLENT': 'linear-gradient(135deg, #7c3aed, #a855f7)',
  'AMAZING':   'linear-gradient(135deg, #d97706, #f59e0b)',
  'EPIC':      'linear-gradient(135deg, #b91c1c, #ef4444)',
  'LEGENDARY': 'linear-gradient(135deg, #b45309, #fbbf24, #f59e0b)',
  'MYTHIC':    'linear-gradient(135deg, #c026d3, #ff00ff, #e879f9)',
};

// Tier → glow intensity
const TIER_GLOW: Record<string, number> = {
  'NICE': 15, 'GREAT': 20, 'EXCELLENT': 30,
  'AMAZING': 40, 'EPIC': 50, 'LEGENDARY': 60, 'MYTHIC': 80,
};

export default function ComboDisplay({ combo, show, label, mult, color }: ComboDisplayProps) {
  if (!show || combo < 2) return null;

  const vfx = COMBO_VFX[label];
  const tierAnim = TIER_ANIM[label] || '';
  const tierBg = TIER_BG[label] || 'linear-gradient(135deg, #6c5ce7, #a29bfe)';
  const glowSize = TIER_GLOW[label] || 15;
  const isHighTier = combo >= 12; // AMAZING+
  const isLegendary = combo >= 30;
  const isMythic = combo >= 50;

  // For low combos (2) without a tier label — simple display
  if (!label) {
    return (
      <div className="relative animate-combo-burst pointer-events-none z-[70]">
        <div className="relative px-4 py-1.5 rounded-full font-heading font-bold text-white text-center"
          style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', boxShadow: '0 0 15px rgba(108,92,231,0.5)' }}>
          <span className="text-base">x{combo}</span>
        </div>
      </div>
    );
  }

  // Display text — spaced letters for LEGENDARY+
  const displayLabel = isLegendary ? label.split('').join(' ') : label;
  const bonusPct = mult > 1 ? `+${Math.round((mult - 1) * 100)}%` : '';

  return (
    <div className={`relative pointer-events-none z-[70] ${tierAnim}`}
      key={`combo-${combo}-${label}`}>
      {/* Expanding ring behind badge (high tiers) */}
      {isHighTier && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="combo-ring-burst" style={{ borderColor: color }} />
        </div>
      )}

      {/* Main badge */}
      <div
        className={`
          relative px-5 py-2 rounded-full font-heading font-bold text-white text-center
          ${isMythic ? 'combo-badge-mythic' : isLegendary ? 'combo-badge-legendary' : isHighTier ? 'combo-badge-high' : ''}
        `}
        style={{
          background: tierBg,
          boxShadow: `0 0 ${glowSize}px ${color}80`,
          border: isHighTier ? '2px solid rgba(255,255,255,0.5)' : 'none',
        }}
      >
        {/* Inner glow overlay */}
        {isHighTier && (
          <div className="absolute inset-0 rounded-full combo-inner-glow" />
        )}

        <span className={`relative z-10 ${vfx?.size || 'text-base'} ${isMythic ? 'combo-text-mythic' : ''}`}
          style={isMythic ? {} : { textShadow: `0 2px 4px rgba(0,0,0,0.5)` }}>
          {vfx?.emoji || '💥'} {displayLabel} x{combo}
        </span>
        {bonusPct && (
          <span className="relative z-10 block text-[10px] text-white/80 font-semibold tracking-wider">
            {bonusPct} damage
          </span>
        )}
        {mult > 1 && (
          <span className="relative z-10 block text-[9px] text-white/60 font-semibold">
            DMG x{mult}
          </span>
        )}
      </div>
    </div>
  );
}

export { COMBO_VFX };
