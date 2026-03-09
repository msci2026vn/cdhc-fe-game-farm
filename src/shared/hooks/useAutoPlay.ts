import { useEffect, useRef, useCallback, useState } from 'react';

// ═══ Grid constants (same as match-3 hooks) ═══
const COLS = 6;
const ROWS = 6;
const GEM_TYPES = ['atk', 'hp', 'def', 'star'] as const;
type GemType = (typeof GEM_TYPES)[number];

interface Gem { type: GemType; id: number; }

// ═══ findMatches — same logic as useMatch3 ═══
function findMatches(grid: Gem[]): Set<number> {
  const matched = new Set<number>();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 3; c++) {
      const idx = r * COLS + c; const t = grid[idx].type; let len = 1;
      while (c + len < COLS && grid[idx + len].type === t) len++;
      if (len >= 3) { for (let k = 0; k < len; k++) matched.add(idx + k); }
      if (len > 1) c += len - 2;
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 3; r++) {
      const idx = r * COLS + c; const t = grid[idx].type; let len = 1;
      while (r + len < ROWS && grid[idx + len * COLS].type === t) len++;
      if (len >= 3) { for (let k = 0; k < len; k++) matched.add(idx + k * COLS); }
      if (len > 1) r += len - 2;
    }
  }
  return matched;
}

// ═══ Score a set of matched gems — prioritize ATK/star for damage ═══
function scoreMatches(grid: Gem[], matched: Set<number>): number {
  let score = 0;
  matched.forEach(idx => {
    const type = grid[idx].type;
    if (type === 'atk') score += 3;
    else if (type === 'star') score += 2;
    else score += 1; // hp, def
  });
  return score;
}

type Direction = 'up' | 'down' | 'left' | 'right';

interface BestMove {
  idx: number;
  direction: Direction;
  score: number;
}

// ═══ Find the best swap on the grid ═══
function findBestMove(grid: Gem[], lockedGems?: Set<number>): BestMove | null {
  let best: BestMove | null = null;

  for (let idx = 0; idx < ROWS * COLS; idx++) {
    if (lockedGems?.has(idx)) continue;

    const row = Math.floor(idx / COLS);
    const col = idx % COLS;

    // Only check right and down to avoid duplicate swaps
    const swaps: { dir: Direction; target: number }[] = [];
    if (col < COLS - 1) swaps.push({ dir: 'right', target: idx + 1 });
    if (row < ROWS - 1) swaps.push({ dir: 'down', target: idx + COLS });

    for (const { dir, target } of swaps) {
      if (lockedGems?.has(target)) continue;

      // Simulate swap
      const sim = [...grid];
      [sim[idx], sim[target]] = [sim[target], sim[idx]];

      const matched = findMatches(sim);
      if (matched.size === 0) continue;

      const score = scoreMatches(sim, matched);
      if (!best || score > best.score) {
        best = { idx, direction: dir, score };
      }
    }
  }

  return best;
}

// ═══ Auto-play hook interface ═══
interface UseAutoPlayParams {
  grid: Gem[];
  animating: boolean;
  result: 'fighting' | 'victory' | 'defeat';
  handleSwipe: (idx: number, direction: Direction) => void;
  handleDodge: () => void;
  fireUltimate: () => void;
  ultCharge: number;
  skillWarning: unknown;
  isVip: boolean;
  // Campaign-specific
  lockedGems?: Set<number>;
  isStunned?: boolean;
  isPaused?: boolean;
}

export function useAutoPlay({
  grid, animating, result,
  handleSwipe, handleDodge, fireUltimate,
  ultCharge, skillWarning, isVip,
  lockedGems, isStunned, isPaused,
}: UseAutoPlayParams) {
  const [autoEnabled, setAutoEnabled] = useState(false);

  // Use refs to avoid restarting interval on every state change
  const gridRef = useRef(grid);
  const animatingRef = useRef(animating);
  const resultRef = useRef(result);
  const ultChargeRef = useRef(ultCharge);
  const skillWarningRef = useRef(skillWarning);
  const isStunnedRef = useRef(isStunned);
  const isPausedRef = useRef(isPaused);
  const lockedGemsRef = useRef(lockedGems);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { animatingRef.current = animating; }, [animating]);
  useEffect(() => { resultRef.current = result; }, [result]);
  useEffect(() => { ultChargeRef.current = ultCharge; }, [ultCharge]);
  useEffect(() => { skillWarningRef.current = skillWarning; }, [skillWarning]);
  useEffect(() => { isStunnedRef.current = isStunned; }, [isStunned]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { lockedGemsRef.current = lockedGems; }, [lockedGems]);

  // Stable refs for callbacks
  const handleSwipeRef = useRef(handleSwipe);
  const handleDodgeRef = useRef(handleDodge);
  const fireUltimateRef = useRef(fireUltimate);
  useEffect(() => { handleSwipeRef.current = handleSwipe; }, [handleSwipe]);
  useEffect(() => { handleDodgeRef.current = handleDodge; }, [handleDodge]);
  useEffect(() => { fireUltimateRef.current = fireUltimate; }, [fireUltimate]);

  // Turn off auto when not VIP or battle ends
  useEffect(() => {
    if (!isVip || result !== 'fighting') setAutoEnabled(false);
  }, [isVip, result]);

  // ═══ Auto-play interval ═══
  useEffect(() => {
    if (!autoEnabled || !isVip) return;

    const interval = setInterval(() => {
      // Skip conditions
      if (resultRef.current !== 'fighting') return;
      if (isPausedRef.current) return;
      if (isStunnedRef.current) return;

      // Auto-dodge: react to skill warning
      if (skillWarningRef.current) {
        handleDodgeRef.current();
        return;
      }

      // Auto-ult: fire when charged
      if (ultChargeRef.current >= 100) {
        fireUltimateRef.current();
        return;
      }

      // Skip if animating
      if (animatingRef.current) return;

      // Find and execute best move
      const move = findBestMove(gridRef.current, lockedGemsRef.current);
      if (move) {
        handleSwipeRef.current(move.idx, move.direction);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [autoEnabled, isVip]);

  const toggleAuto = useCallback(() => {
    if (!isVip) return;
    setAutoEnabled(prev => !prev);
  }, [isVip]);

  return { autoEnabled, toggleAuto };
}
