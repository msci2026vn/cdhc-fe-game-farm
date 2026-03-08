// ═══════════════════════════════════════════════════════════════
// useComboParticles — spawn floating emoji particles on combo
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { getComboInfo, COMBO_VFX } from './combat.config';

export interface ComboParticle { id: number; char: string; x: number; y: number; expiresAt?: number; }

export function useComboParticles(combo: number, showCombo: boolean) {
  const [comboParticles, setComboParticles] = useState<ComboParticle[]>([]);
  const particleId = useRef(0);

  useEffect(() => {
    if (!showCombo || combo < 2) return;
    const comboInfo = getComboInfo(combo);
    const vfx = COMBO_VFX[comboInfo.label];
    if (!vfx) return;

    // Only use first 2 particle chars and 1 instance each to reduce DOM elements
    const chars = vfx.particles.slice(0, 2);
    const particles = chars.map((char) => ({
      id: particleId.current++,
      char,
      x: 20 + Math.random() * 60,
      y: 10 + Math.random() * 30,
      expiresAt: Date.now() + 1000,
    }));
    setComboParticles(prev => {
      // Cap max particles to prevent accumulation
      const next = prev.length > 6 ? prev.slice(-4) : prev;
      return [...next, ...particles];
    });
  }, [combo, showCombo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══ GC Ticker ═══
  useEffect(() => {
    // Only run the GC timer if there are active particles on screen
    if (comboParticles.length === 0) return;

    const gcInterval = setInterval(() => {
      const now = Date.now();
      setComboParticles(prev => {
        if (prev.length === 0) return prev;
        const next = prev.filter(p => !p.expiresAt || p.expiresAt > now);
        return next.length !== prev.length ? next : prev;
      });
    }, 500);
    return () => clearInterval(gcInterval);
  }, [comboParticles.length]);

  return comboParticles;
}
