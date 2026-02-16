// ═══════════════════════════════════════════════════════════════
// DamagePopup — Floating damage number layer
// Re-uses the existing DamagePopup interface from useMatch3
// ═══════════════════════════════════════════════════════════════

import type { DamagePopup as PopupData } from '../../hooks/useMatch3';

interface DamagePopupLayerProps {
  popups: PopupData[];
}

export default function DamagePopupLayer({ popups }: DamagePopupLayerProps) {
  if (popups.length === 0) return null;

  return (
    <>
      {popups.map(p => (
        <span key={p.id}
          className="absolute font-heading text-2xl font-bold animate-damage-float text-shadow-sm pointer-events-none z-30"
          style={{ color: p.color, left: `${p.x}%`, top: `${p.y}%` }}>
          {p.text}
        </span>
      ))}
    </>
  );
}
