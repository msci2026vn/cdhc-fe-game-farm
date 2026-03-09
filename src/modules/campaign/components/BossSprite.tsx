// ═══════════════════════════════════════════════════════════════
// BossSprite — Renders boss sprite with external CSS filters
// Uses key={src} to force React remount → SVG internal animation reset
// Falls back to old CSS animation classes when no multi-state sprites
// ═══════════════════════════════════════════════════════════════

import type { BossSpriteState } from '../hooks/useBossSprite';

interface BossSpriteProps {
  src: string | undefined;
  state: BossSpriteState;
  hasSprites: boolean;
  emoji: string;
  name: string;
  enrageMultiplier: number;
  shieldBuff: boolean;
  reflectBuff: boolean;
  skillWarning: boolean;
  bossDead: boolean;
  isBurning?: boolean;
  className?: string;
}

export function BossSprite({
  src,
  state,
  hasSprites,
  emoji,
  name,
  enrageMultiplier,
  shieldBuff,
  reflectBuff,
  skillWarning,
  bossDead,
  isBurning = false,
  className = '',
}: BossSpriteProps) {
  // Simplified: use a single lightweight border glow instead of expensive drop-shadow filters
  // drop-shadow is one of the most expensive CSS filters on mobile GPU
  let borderGlow = 'none';
  if (enrageMultiplier >= 1.3) {
    const intensity = Math.min(0.6, (enrageMultiplier - 1.3) * 2 + 0.3);
    borderGlow = `0 0 15px rgba(231,76,60,${intensity})`;
  }
  if (shieldBuff) borderGlow += ', 0 0 12px rgba(116,185,255,0.5)';
  if (reflectBuff) borderGlow += ', 0 0 12px rgba(168,85,247,0.5)';

  // For bosses WITHOUT multi-state sprites, keep old CSS animation classes
  // Removed grayscale class — CSS filter:grayscale is very expensive on mobile GPU
  // Dead state handled by opacity inline style below
  const wrapperClasses = hasSprites
    ? (isBurning ? 'animate-fire-flicker' : '')
    : `animate-boss-idle ${skillWarning ? 'animate-boss-attack' : ''} ${isBurning ? 'animate-fire-flicker' : ''}`;

  return (
    <div
      className={`${wrapperClasses} ${className}`}
      style={{
        opacity: bossDead ? 0.3 : undefined,
      }}
    >
      {src ? (
        <img
          key={src}
          src={src}
          alt={name}
          className="w-40 h-40 object-contain select-none pointer-events-none"
          /* Removed filter:drop-shadow — too expensive on mobile GPU */
          draggable={false}
        />
      ) : (
        <span className="text-[48px]">{emoji}</span>
      )}
    </div>
  );
}
