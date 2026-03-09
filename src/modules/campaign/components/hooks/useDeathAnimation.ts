// ═══════════════════════════════════════════════════════════════
// useDeathAnimation — Death phase state machine
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import type { FightResult } from '@/shared/match3/combat.types';

export type DeathPhase = 'none' | 'dying' | 'done';

export function useDeathAnimation(result: FightResult) {
  const [deathPhase, setDeathPhase] = useState<DeathPhase>('none');

  useEffect(() => {
    if (result === 'defeat' || result === 'victory') {
      if (deathPhase === 'none') {
        setDeathPhase('dying');
      } else if (deathPhase === 'dying') {
        const delay = result === 'victory' ? 2000 : 2500;

        if (result === 'victory' && 'vibrate' in navigator) {
          try { navigator.vibrate([100, 50, 100, 50, 300]); } catch (e) { }
        }

        const timer = setTimeout(() => setDeathPhase('done'), delay);
        return () => clearTimeout(timer);
      }
    }
  }, [result, deathPhase]);

  return { deathPhase, setDeathPhase };
}
