// ═══════════════════════════════════════════════════════════════
// PhaseTransition — Full-screen phase change animation
// Shows for ~2s when boss crosses a phase threshold
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';

interface PhaseTransitionProps {
  phase: number;
  archetypeLabel?: string;
  archetypeIcon?: string;
  description?: string;
}

export default function PhaseTransition({
  phase, archetypeLabel, archetypeIcon, description,
}: PhaseTransitionProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none">
      {/* White flash */}
      <div className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(255,255,255,0.15)' }} />

      {/* Phase info */}
      <div className="animate-scale-in text-center">
        <div className="text-4xl mb-2">{archetypeIcon || '⚔️'}</div>
        <div className="px-8 py-4 rounded-2xl font-heading text-xl font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(108,92,231,0.9), rgba(224,86,253,0.9))',
            boxShadow: '0 0 60px rgba(108,92,231,0.6)',
            border: '2px solid rgba(255,255,255,0.3)',
          }}>
          <div className="mb-1">═══ PHASE {phase} ═══</div>
          {archetypeLabel && (
            <div className="text-sm text-white/80">{archetypeIcon} {archetypeLabel}</div>
          )}
          {description && (
            <div className="text-xs text-white/60 mt-1">{description}</div>
          )}
        </div>
      </div>
    </div>
  );
}
