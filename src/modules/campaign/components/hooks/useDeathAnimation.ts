// ═══════════════════════════════════════════════════════════════
// useDeathAnimation — Death phase state machine
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import type { FightResult } from '@/shared/match3/combat.types';

export type DeathPhase = 'none' | 'dying' | 'done';

export function useDeathAnimation(result: FightResult) {
  const [deathPhase, setDeathPhase] = useState<DeathPhase>('none');

  useEffect(() => {
    if (result === 'defeat' && deathPhase === 'none') {
      setDeathPhase('dying');
      const timer = setTimeout(() => setDeathPhase('done'), 2500);
      return () => clearTimeout(timer);
    }
  }, [result, deathPhase]);

  return { deathPhase, setDeathPhase };
}
