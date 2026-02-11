/**
 * useLevelUpDetector — Detect level changes and trigger animation
 *
 * Watches for level increases and dispatches a custom event
 * that LevelUpOverlay component listens to.
 *
 * FIX: Uses isSuccess to detect first data load vs actual level up.
 * Only triggers when data was already loaded and level increased.
 */
import { useEffect, useRef } from 'react';
import { usePlayerProfile } from './usePlayerProfile';
import { useUIStore } from '../stores/uiStore';
import { getLevelTitle } from '../stores/playerStore';

export function useLevelUpDetector() {
  const { data: profile, isSuccess } = usePlayerProfile();
  const level = profile?.level ?? 1;

  // Track if we've received first data from server
  const dataLoadedRef = useRef(false);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    // Wait until data is successfully loaded from server
    if (!isSuccess || !profile) return;

    // First time receiving data from server — set baseline, NO trigger
    if (!dataLoadedRef.current) {
      dataLoadedRef.current = true;
      prevLevelRef.current = level;
      console.log(`[FARM-DEBUG] LevelUp detector: baseline level = ${level} (first data load)`);
      return;
    }

    // Data was already loaded — check for actual level up
    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      console.log(`[FARM-DEBUG] 🎉 REAL LEVEL UP! ${prevLevelRef.current} → ${level}`);

      // Toast notification
      useUIStore.getState().addToast(
        `Level Up! ${getLevelTitle(level)} (Level ${level})`,
        'success',
        '🆙',
        5000
      );

      // Dispatch custom event for LevelUpOverlay
      window.dispatchEvent(new CustomEvent('farmverse:levelup', {
        detail: { oldLevel: prevLevelRef.current, newLevel: level }
      }));
    }

    // Update previous level
    prevLevelRef.current = level;
  }, [level, isSuccess, profile]);

  return level;
}
