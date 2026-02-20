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
  className = '',
}: BossSpriteProps) {
  // Build CSS filter from external buff/rage states
  const filters: string[] = [];

  if (enrageMultiplier >= 1.3) {
    const intensity = Math.min(0.8, (enrageMultiplier - 1.3) * 2 + 0.4);
    filters.push(`drop-shadow(0 0 20px rgba(231,76,60,0.5)) drop-shadow(0 0 10px rgba(255,50,50,${intensity}))`);
  } else {
    filters.push('drop-shadow(0 0 20px rgba(231,76,60,0.5))');
  }

  if (shieldBuff) filters.push('drop-shadow(0 0 15px rgba(116,185,255,0.7))');
  if (reflectBuff) filters.push('drop-shadow(0 0 15px rgba(168,85,247,0.7))');

  // For bosses WITHOUT multi-state sprites, keep old CSS animation classes
  const wrapperClasses = hasSprites
    ? '' // SVG has internal idle animation; attack/dead handled by src swap
    : `animate-boss-idle ${bossDead ? 'opacity-30 grayscale' : ''} ${skillWarning ? 'animate-boss-attack' : ''}`;

  return (
    <div
      className={`${wrapperClasses} ${className}`}
      style={{
        filter: filters.join(' '),
        transition: 'filter 1s ease',
      }}
    >
      {src ? (
        <img
          key={src}
          src={src}
          alt={name}
          className="w-40 h-40 object-contain drop-shadow-xl select-none pointer-events-none"
          draggable={false}
        />
      ) : (
        <span className="text-[48px]">{emoji}</span>
      )}
    </div>
  );
}
