// ═══════════════════════════════════════════════════════════════
// ComboParticles — Floating combo emoji particles
// ═══════════════════════════════════════════════════════════════

import type { ComboParticle } from './useComboParticles';

interface Props {
  particles: ComboParticle[];
}

export default function ComboParticles({ particles }: Props) {
  return (
    <>
      {particles.map(p => (
        <span key={p.id} className="absolute z-30 animate-sparkle-up pointer-events-none text-xl"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          {p.char}
        </span>
      ))}
    </>
  );
}
