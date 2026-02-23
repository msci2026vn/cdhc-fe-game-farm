// ═══════════════════════════════════════════════════════════════
// Debuff/buff/egg countdown ticker — runs every 1s
// ═══════════════════════════════════════════════════════════════

import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type { BossState, ActiveDebuff, ActiveBossBuff, EggState } from '@/shared/match3/combat.types';

export interface DebuffTickerDeps {
  bossMaxHp: number;
  isPausedRef: MutableRefObject<boolean>;
  activeDebuffsRef: MutableRefObject<ActiveDebuff[]>;
  activeBossBuffsRef: MutableRefObject<ActiveBossBuff[]>;
  eggRef: MutableRefObject<EggState | null>;
  setBoss: Dispatch<SetStateAction<BossState>>;
  setActiveDebuffs: Dispatch<SetStateAction<ActiveDebuff[]>>;
  setActiveBossBuffs: Dispatch<SetStateAction<ActiveBossBuff[]>>;
  setEgg: Dispatch<SetStateAction<EggState | null>>;
  addPopup: (text: string, color: string) => void;
}

export function setupDebuffTicker(deps: DebuffTickerDeps): () => void {
  const {
    bossMaxHp, isPausedRef,
    activeDebuffsRef, activeBossBuffsRef, eggRef,
    setBoss, setActiveDebuffs, setActiveBossBuffs, setEgg,
    addPopup,
  } = deps;

  const ticker = setInterval(() => {
    if (isPausedRef.current) return;

    // === Player debuffs ===
    const debuffs = activeDebuffsRef.current;
    if (debuffs.length > 0) {
      // Apply burn DOT
      const burn = debuffs.find(d => d.type === 'burn');
      if (burn && burn.value > 0) {
        setBoss(prev => {
          if (prev.playerHp <= 0) return prev;
          const dmg = Math.round(prev.playerMaxHp * burn.value / 100);
          addPopup(`-${dmg} 🔥`, '#e74c3c');
          return { ...prev, playerHp: Math.max(0, prev.playerHp - dmg) };
        });
      }

      // Tick down and remove expired
      activeDebuffsRef.current = debuffs
        .map(d => ({ ...d, remainingSec: d.remainingSec - 1 }))
        .filter(d => d.remainingSec > 0);
      setActiveDebuffs([...activeDebuffsRef.current]);
    }

    // === Boss buffs (shield/reflect countdown) ===
    const buffs = activeBossBuffsRef.current;
    if (buffs.length > 0) {
      activeBossBuffsRef.current = buffs
        .map(b => ({ ...b, remainingSec: b.remainingSec - 1 }))
        .filter(b => b.remainingSec > 0);
      setActiveBossBuffs([...activeBossBuffsRef.current]);
    }

    // === Egg countdown ===
    const currentEgg = eggRef.current;
    if (currentEgg) {
      const newCountdown = currentEgg.countdown - 1;
      if (newCountdown <= 0) {
        // Egg hatches → boss heals
        const healAmount = Math.round(bossMaxHp * currentEgg.healPercent / 100);
        setBoss(prev => {
          const newHp = Math.min(prev.bossMaxHp, prev.bossHp + healAmount);
          return { ...prev, bossHp: newHp };
        });
        addPopup(`+${healAmount} 🥚→💚`, '#27ae60');
        eggRef.current = null;
        setEgg(null);
      } else {
        eggRef.current = { ...currentEgg, countdown: newCountdown };
        setEgg({ ...currentEgg, countdown: newCountdown });
      }
    }
  }, 1000);

  return () => clearInterval(ticker);
}
