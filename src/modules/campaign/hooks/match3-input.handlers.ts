// ═══════════════════════════════════════════════════════════════
// Campaign input handlers — handleTap, handleSwipe
// Adds: isPaused, isStunned, lockedGems checks
// ═══════════════════════════════════════════════════════════════

import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type { Gem } from '@/shared/match3/board.utils';
import { areAdjacent, findMatches, COLS, ROWS } from '@/shared/match3/board.utils';
import type { FightResult } from '@/shared/match3/combat.types';
import { playSound } from '@/shared/audio';

export interface CampaignInputDeps {
  grid: Gem[];
  selected: number | null;
  animating: boolean;
  result: FightResult;
  isPausedRef: MutableRefObject<boolean>;
  isStunnedRef: MutableRefObject<boolean>;
  lockedGemsRef: MutableRefObject<Set<number>>;
  setSelected: Dispatch<SetStateAction<number | null>>;
  setAnimating: Dispatch<SetStateAction<boolean>>;
  setGrid: Dispatch<SetStateAction<Gem[]>>;
  processMatches: (grid: Gem[], combo: number, swapPair?: [number, number]) => void;
}

export function handleCampaignTapImpl(deps: CampaignInputDeps, idx: number): void {
  const {
    grid, selected, animating, result,
    isPausedRef, isStunnedRef, lockedGemsRef,
    setSelected, setAnimating, setGrid, processMatches,
  } = deps;

  if (animating || result !== 'fighting' || isPausedRef.current || isStunnedRef.current) return;
  // Gem lock: can't interact with locked gems
  if (lockedGemsRef.current.has(idx)) return;
  if (selected === null) { playSound('gem_select'); setSelected(idx); return; }
  if (selected === idx) { setSelected(null); return; }
  if (!areAdjacent(selected, idx)) { playSound('gem_select'); setSelected(idx); return; }

  playSound('gem_swap');
  setAnimating(true);
  setSelected(null);
  const newGrid = [...grid];
  [newGrid[selected], newGrid[idx]] = [newGrid[idx], newGrid[selected]];

  const matched = findMatches(newGrid);
  if (matched.size === 0) {
    setGrid(newGrid);
    setTimeout(() => {
      playSound('gem_no_match');
      const reverted = [...newGrid];
      [reverted[selected], reverted[idx]] = [reverted[idx], reverted[selected]];
      setGrid(reverted);
      setAnimating(false);
    }, 300);
    return;
  }

  setGrid(newGrid);
  setTimeout(() => processMatches(newGrid, 0, [selected, idx]), 200);
}

export function handleCampaignSwipeImpl(
  deps: Omit<CampaignInputDeps, 'selected'>,
  idx: number,
  direction: 'up' | 'down' | 'left' | 'right',
): void {
  const {
    grid, animating, result,
    isPausedRef, isStunnedRef, lockedGemsRef,
    setSelected, setAnimating, setGrid, processMatches,
  } = deps;

  if (animating || result !== 'fighting' || isPausedRef.current || isStunnedRef.current) return;
  if (lockedGemsRef.current.has(idx)) return;

  let targetIdx = -1;
  const row = Math.floor(idx / COLS);
  const col = idx % COLS;

  if (direction === 'up' && row > 0) targetIdx = idx - COLS;
  else if (direction === 'down' && row < ROWS - 1) targetIdx = idx + COLS;
  else if (direction === 'left' && col > 0) targetIdx = idx - 1;
  else if (direction === 'right' && col < COLS - 1) targetIdx = idx + 1;

  if (targetIdx === -1 || lockedGemsRef.current.has(targetIdx)) return;

  playSound('gem_swap');
  setAnimating(true);
  setSelected(null);
  const newGrid = [...grid];
  [newGrid[idx], newGrid[targetIdx]] = [newGrid[targetIdx], newGrid[idx]];

  const matched = findMatches(newGrid);
  if (matched.size === 0) {
    setGrid(newGrid);
    setTimeout(() => {
      playSound('gem_no_match');
      const reverted = [...newGrid];
      [reverted[idx], reverted[targetIdx]] = [reverted[targetIdx], reverted[idx]];
      setGrid(reverted);
      setAnimating(false);
    }, 300);
    return;
  }

  setGrid(newGrid);
  setTimeout(() => processMatches(newGrid, 0, [idx, targetIdx]), 200);
}
