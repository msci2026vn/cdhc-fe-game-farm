// ═══════════════════════════════════════════════════════════════
// useEnrageAlert — Enrage level change detection + alert popup
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import type { FightResult } from '@/shared/match3/combat.types';

export function useEnrageAlert(enrageMultiplier: number, result: FightResult) {
  const enrageLevel = Math.round((enrageMultiplier - 1) * 10);
  const prevEnrageLevelRef = useRef(0);
  const [enrageAlert, setEnrageAlert] = useState<string | null>(null);

  useEffect(() => {
    if (result !== 'fighting') return;
    if (enrageLevel > prevEnrageLevelRef.current && enrageLevel > 0) {
      prevEnrageLevelRef.current = enrageLevel;
      const alerts: Record<number, string> = {
        1: '⚡ Boss tức giận! +10%',
        2: '🔥 Boss cuồng nộ! +20%',
        3: '💀 Boss điên cuồng! +30%',
      };
      setEnrageAlert(alerts[enrageLevel] || `☠️ RẤT NGUY HIỂM! +${enrageLevel * 10}%`);
      const timer = setTimeout(() => setEnrageAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [enrageLevel, result]);

  return { enrageLevel, enrageAlert };
}
