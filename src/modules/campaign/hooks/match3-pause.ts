// ═══════════════════════════════════════════════════════════════
// Pause/resume + elapsed seconds timer
// ═══════════════════════════════════════════════════════════════

import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type { FightResult } from '@/shared/match3/combat.types';

export interface PauseDeps {
  isPausedRef: MutableRefObject<boolean>;
  pausedAtRef: MutableRefObject<number | null>;
  totalPausedMsRef: MutableRefObject<number>;
  setIsPaused: Dispatch<SetStateAction<boolean>>;
}

export function pauseBattleImpl(deps: PauseDeps): void {
  const { isPausedRef, pausedAtRef, setIsPaused } = deps;
  if (isPausedRef.current) return;
  isPausedRef.current = true;
  pausedAtRef.current = Date.now();
  setIsPaused(true);
}

export function resumeBattleImpl(deps: PauseDeps): void {
  const { isPausedRef, pausedAtRef, totalPausedMsRef, setIsPaused } = deps;
  if (!isPausedRef.current) return;
  isPausedRef.current = false;
  if (pausedAtRef.current) {
    totalPausedMsRef.current += Date.now() - pausedAtRef.current;
    pausedAtRef.current = null;
  }
  setIsPaused(false);
}

export interface ElapsedTimerDeps {
  result: FightResult;
  isPausedRef: MutableRefObject<boolean>;
  fightStartTime: MutableRefObject<number>;
  totalPausedMsRef: MutableRefObject<number>;
  setElapsedSeconds: Dispatch<SetStateAction<number>>;
}

export function setupElapsedTimer(deps: ElapsedTimerDeps): () => void {
  const { isPausedRef, fightStartTime, totalPausedMsRef, setElapsedSeconds } = deps;

  const timer = setInterval(() => {
    if (isPausedRef.current) return;
    const now = Date.now();
    const totalElapsed = now - fightStartTime.current - totalPausedMsRef.current;
    setElapsedSeconds(Math.floor(Math.max(0, totalElapsed) / 1000));
  }, 1000);

  return () => clearInterval(timer);
}
