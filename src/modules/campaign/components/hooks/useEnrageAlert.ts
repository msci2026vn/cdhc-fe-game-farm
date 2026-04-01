// ═══════════════════════════════════════════════════════════════
// useEnrageAlert — Enrage level change detection + alert popup
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import type { FightResult } from '@/shared/match3/combat.types';
import { useTranslation } from 'react-i18next';

export function useEnrageAlert(enrageMultiplier: number, result: FightResult) {
  const { t } = useTranslation();
  const enrageLevel = Math.round((enrageMultiplier - 1) * 10);
  const prevEnrageLevelRef = useRef(0);
  const [enrageAlert, setEnrageAlert] = useState<string | null>(null);

  useEffect(() => {
    if (result !== 'fighting') return;
    if (enrageLevel > prevEnrageLevelRef.current && enrageLevel > 0) {
      prevEnrageLevelRef.current = enrageLevel;
      let alertText = '';
      const percent = enrageLevel * 10;
      
      if (enrageLevel >= 9) {
        alertText = `🔥 CỰC KÌ NGUY HIỂM! +${percent}%`;
      } else if (enrageLevel >= 5) {
        alertText = `💀 RẤT NGUY HIỂM! +${percent}%`;
      } else {
        alertText = `⚠️ NGUY HIỂM! +${percent}%`;
      }
      
      setEnrageAlert(alertText);
      const timer = setTimeout(() => setEnrageAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [enrageLevel, result]);

  return { enrageLevel, enrageAlert };
}
