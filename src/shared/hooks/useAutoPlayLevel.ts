// ═══════════════════════════════════════════════════════════════
// useAutoPlayLevel — manage auto-play VIP tier (localStorage)
// Purchased levels persist. Future: sync with backend API.
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';

const LEVEL_KEY = 'farmverse-autoplay-level';
const PURCHASED_KEY = 'farmverse-autoplay-purchased';

function readLevel(): number {
  try { return parseInt(localStorage.getItem(LEVEL_KEY) || '1', 10) || 1; }
  catch { return 1; }
}

function readPurchased(): number[] {
  try {
    const raw = localStorage.getItem(PURCHASED_KEY);
    return raw ? JSON.parse(raw) : [1];
  } catch { return [1]; }
}

export function useAutoPlayLevel() {
  const [level, setLevelState] = useState(readLevel);
  const [purchased, setPurchasedState] = useState<number[]>(readPurchased);

  const setLevel = useCallback((lv: number) => {
    const clamped = Math.max(1, Math.min(5, lv));
    try { localStorage.setItem(LEVEL_KEY, String(clamped)); } catch { /* noop */ }
    setLevelState(clamped);
  }, []);

  const markPurchased = useCallback((lv: number) => {
    setPurchasedState(prev => {
      if (prev.includes(lv)) return prev;
      const next = [...prev, lv].sort();
      try { localStorage.setItem(PURCHASED_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  return {
    autoPlayLevel: level,
    setAutoPlayLevel: setLevel,
    purchasedLevels: purchased,
    markPurchased,
    isPurchased: (lv: number) => lv === 1 || purchased.includes(lv),
  };
}
