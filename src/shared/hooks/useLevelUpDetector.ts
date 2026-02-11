/**
 * useLevelUpDetector — Detect level changes and trigger animation
 *
 * Watches for level increases and dispatches a custom event
 * that LevelUpOverlay component listens to.
 *
 * Skips first render to avoid false positive on mount.
 */
import { useEffect, useRef } from 'react';
import { useLevel } from './usePlayerProfile';

export function useLevelUpDetector() {
  const level = useLevel();
  const prevLevelRef = useRef(level);
  const initialRef = useRef(true);

  useEffect(() => {
    // Skip first render (mount) — not a real level up
    if (initialRef.current) {
      initialRef.current = false;
      prevLevelRef.current = level;
      return;
    }

    if (level > prevLevelRef.current) {
      console.log(`[FARM-DEBUG] 🎉 LEVEL UP! ${prevLevelRef.current} → ${level}`);

      // Dispatch custom event for LevelUpOverlay
      window.dispatchEvent(new CustomEvent('farmverse:levelup', {
        detail: { oldLevel: prevLevelRef.current, newLevel: level }
      }));

      prevLevelRef.current = level;
    } else if (level !== prevLevelRef.current) {
      // Level decreased (shouldn't happen normally, but handle gracefully)
      prevLevelRef.current = level;
    }
  }, [level]);

  return level;
}
