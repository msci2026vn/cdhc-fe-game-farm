// ═══════════════════════════════════════════════════════════════
// useComboParticles — spawn floating emoji particles on combo
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { getComboInfo, COMBO_VFX } from './combat.config';

export interface ComboParticle { id: number; char: string; x: number; y: number; }

export function useComboParticles(combo: number, showCombo: boolean) {
  const [comboParticles, setComboParticles] = useState<ComboParticle[]>([]);
  const particleId = useRef(0);

  useEffect(() => {
    if (!showCombo || combo < 2) return;
    const comboInfo = getComboInfo(combo);
    const vfx = COMBO_VFX[comboInfo.label];
    if (!vfx) return;

    const particles = vfx.particles.flatMap((char) =>
      Array.from({ length: 2 }, () => ({
        id: particleId.current++,
        char,
        x: 20 + Math.random() * 60,
        y: 10 + Math.random() * 30,
      }))
    );
    setComboParticles(prev => [...prev, ...particles]);
    setTimeout(() => {
      setComboParticles(prev => prev.filter(p => !particles.some(np => np.id === p.id)));
    }, 1200);
  }, [combo, showCombo]); // eslint-disable-line react-hooks/exhaustive-deps

  return comboParticles;
}
