// ═══════════════════════════════════════════════════════════════
// Input handlers — handleTap, handleSwipe, swap validation
// ═══════════════════════════════════════════════════════════════

import type { Dispatch, SetStateAction } from 'react';
import type { Gem } from '@/shared/match3/board.utils';
import { areAdjacent, findMatches, COLS, ROWS } from '@/shared/match3/board.utils';
import type { FightResult } from '@/shared/match3/combat.types';
import { playSound } from '@/shared/audio';

export interface InputHandlerDeps {
  grid: Gem[];
  selected: number | null;
  animating: boolean;
  result: FightResult;
  setSelected: Dispatch<SetStateAction<number | null>>;
  setAnimating: Dispatch<SetStateAction<boolean>>;
  setGrid: Dispatch<SetStateAction<Gem[]>>;
  processMatches: (grid: Gem[], combo: number) => void;
}

export function handleTapImpl(deps: InputHandlerDeps, idx: number): void {
  const { grid, selected, animating, result, setSelected, setAnimating, setGrid, processMatches } = deps;

  if (animating || result !== 'fighting') return;
  if (selected === null) { setSelected(idx); playSound('gem_select'); return; }
  if (selected === idx) { setSelected(null); return; }
  if (!areAdjacent(selected, idx)) { setSelected(idx); playSound('gem_select'); return; }

  setAnimating(true);
  setSelected(null);
  playSound('gem_swap');
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
  setTimeout(() => processMatches(newGrid, 0), 200);
}

export function handleSwipeImpl(
  deps: Omit<InputHandlerDeps, 'selected'>,
  idx: number,
  direction: 'up' | 'down' | 'left' | 'right',
): void {
  const { grid, animating, result, setSelected, setAnimating, setGrid, processMatches } = deps;

  if (animating || result !== 'fighting') return;

  let targetIdx = -1;
  const row = Math.floor(idx / COLS);
  const col = idx % COLS;

  if (direction === 'up' && row > 0) targetIdx = idx - COLS;
  else if (direction === 'down' && row < ROWS - 1) targetIdx = idx + COLS;
  else if (direction === 'left' && col > 0) targetIdx = idx - 1;
  else if (direction === 'right' && col < COLS - 1) targetIdx = idx + 1;

  if (targetIdx === -1) return;

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
  setTimeout(() => processMatches(newGrid, 0), 200);
}
