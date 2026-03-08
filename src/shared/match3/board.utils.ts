// ═══════════════════════════════════════════════════════════════
// Board utilities — shared grid logic for match-3 combat
// ═══════════════════════════════════════════════════════════════

export const COLS = 8;
export const ROWS = 8;
export const GEM_TYPES = ['atk', 'hp', 'def', 'star'] as const;
export type GemType = (typeof GEM_TYPES)[number];

export type SpecialGemType = 'striped_h' | 'striped_v' | 'bomb' | 'rainbow';

export interface Gem { type: GemType; id: number; special?: SpecialGemType | null; }

export type MatchPattern = 'match3' | 'match4h' | 'match4v' | 'match5' | 'L' | 'T';

export interface MatchGroup {
  positions: number[];           // flat indices of matched cells
  type: GemType;                 // gem type of the group
  pattern: MatchPattern;         // classified pattern
  specialSpawn?: { pos: number; special: SpecialGemType }; // where to spawn special gem
}

export const GEM_META: Record<GemType, { emoji: string; css: string }> = {
  atk: { emoji: '⚔️', css: 'gem-atk' },
  hp: { emoji: '💚', css: 'gem-hp' },
  def: { emoji: '🛡️', css: 'gem-def' },
  star: { emoji: '⭐', css: 'gem-star' },
};

let nextId = 0;
export const randomGem = (): Gem => ({ type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)], id: nextId++ });

export function createGrid(): Gem[] {
  const grid: Gem[] = [];
  for (let i = 0; i < ROWS * COLS; i++) {
    let gem = randomGem();
    const col = i % COLS; const row = Math.floor(i / COLS);
    while (
      (col >= 2 && grid[i - 1].type === gem.type && grid[i - 2].type === gem.type) ||
      (row >= 2 && grid[i - COLS].type === gem.type && grid[i - 2 * COLS].type === gem.type)
    ) { gem = randomGem(); }
    grid.push(gem);
  }
  return grid;
}

export function findMatches(grid: Gem[]): Set<number> {
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

// ═══ Advanced match detection — classifies match-3/4/5/L/T patterns ═══

interface Run { positions: number[]; type: GemType; direction: 'h' | 'v'; }

function findRuns(grid: Gem[]): Run[] {
  const runs: Run[] = [];
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const idx = r * COLS + c;
      const t = grid[idx].type;
      const positions = [idx];
      let nc = c + 1;
      while (nc < COLS && grid[r * COLS + nc].type === t) { positions.push(r * COLS + nc); nc++; }
      if (positions.length >= 3) runs.push({ positions, type: t, direction: 'h' });
      c = nc;
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const idx = r * COLS + c;
      const t = grid[idx].type;
      const positions = [idx];
      let nr = r + 1;
      while (nr < ROWS && grid[nr * COLS + c].type === t) { positions.push(nr * COLS + c); nr++; }
      if (positions.length >= 3) runs.push({ positions, type: t, direction: 'v' });
      r = nr;
    }
  }
  return runs;
}

export function findMatchGroups(grid: Gem[], swapPos?: number): MatchGroup[] {
  const runs = findRuns(grid);
  const hRuns = runs.filter(r => r.direction === 'h');
  const vRuns = runs.filter(r => r.direction === 'v');
  const usedH = new Set<number>();
  const usedV = new Set<number>();
  const groups: MatchGroup[] = [];

  // 1. Detect intersections (L/T shapes) between H and V runs of same type
  for (let hi = 0; hi < hRuns.length; hi++) {
    for (let vi = 0; vi < vRuns.length; vi++) {
      if (usedH.has(hi) || usedV.has(vi)) continue;
      const hr = hRuns[hi]; const vr = vRuns[vi];
      if (hr.type !== vr.type) continue;
      const hSet = new Set(hr.positions);
      const intersections = vr.positions.filter(p => hSet.has(p));
      if (intersections.length === 0) continue;

      usedH.add(hi); usedV.add(vi);
      const allPos = [...new Set([...hr.positions, ...vr.positions])];
      const interPos = intersections[0];

      // Check total length — if combined >= 5 with any run length >= 5, it's match5
      if (hr.positions.length >= 5 || vr.positions.length >= 5) {
        const spawnPos = swapPos !== undefined && allPos.includes(swapPos) ? swapPos : interPos;
        groups.push({ positions: allPos, type: hr.type, pattern: 'match5', specialSpawn: { pos: spawnPos, special: 'rainbow' } });
        continue;
      }

      // T-shape: intersection is at the middle of at least one run
      const hIdx = hr.positions.indexOf(interPos);
      const vIdx = vr.positions.indexOf(interPos);
      const isHMiddle = hIdx > 0 && hIdx < hr.positions.length - 1;
      const isVMiddle = vIdx > 0 && vIdx < vr.positions.length - 1;
      const pattern: MatchPattern = (isHMiddle || isVMiddle) ? 'T' : 'L';

      groups.push({ positions: allPos, type: hr.type, pattern, specialSpawn: { pos: interPos, special: 'bomb' } });
    }
  }

  // 2. Process remaining horizontal runs
  for (let hi = 0; hi < hRuns.length; hi++) {
    if (usedH.has(hi)) continue;
    const run = hRuns[hi]; const len = run.positions.length;
    if (len >= 5) {
      const sp = swapPos !== undefined && run.positions.includes(swapPos) ? swapPos : run.positions[Math.floor(len / 2)];
      groups.push({ positions: run.positions, type: run.type, pattern: 'match5', specialSpawn: { pos: sp, special: 'rainbow' } });
    } else if (len === 4) {
      const sp = swapPos !== undefined && run.positions.includes(swapPos) ? swapPos : run.positions[1];
      groups.push({ positions: run.positions, type: run.type, pattern: 'match4h', specialSpawn: { pos: sp, special: 'striped_h' } });
    } else {
      groups.push({ positions: run.positions, type: run.type, pattern: 'match3' });
    }
  }

  // 3. Process remaining vertical runs
  for (let vi = 0; vi < vRuns.length; vi++) {
    if (usedV.has(vi)) continue;
    const run = vRuns[vi]; const len = run.positions.length;
    if (len >= 5) {
      const sp = swapPos !== undefined && run.positions.includes(swapPos) ? swapPos : run.positions[Math.floor(len / 2)];
      groups.push({ positions: run.positions, type: run.type, pattern: 'match5', specialSpawn: { pos: sp, special: 'rainbow' } });
    } else if (len === 4) {
      const sp = swapPos !== undefined && run.positions.includes(swapPos) ? swapPos : run.positions[1];
      groups.push({ positions: run.positions, type: run.type, pattern: 'match4v', specialSpawn: { pos: sp, special: 'striped_v' } });
    } else {
      groups.push({ positions: run.positions, type: run.type, pattern: 'match3' });
    }
  }

  return groups;
}

// ═══ Special gem trigger functions ═══

export function triggerStriped(pos: number, direction: 'h' | 'v'): number[] {
  const cells: number[] = [];
  const row = Math.floor(pos / COLS);
  const col = pos % COLS;
  if (direction === 'h') {
    for (let c = 0; c < COLS; c++) cells.push(row * COLS + c);
  } else {
    for (let r = 0; r < ROWS; r++) cells.push(r * COLS + col);
  }
  return cells;
}

export function triggerBomb(pos: number): number[] {
  const cells: number[] = [];
  const row = Math.floor(pos / COLS);
  const col = pos % COLS;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = row + dr; const nc = col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) cells.push(nr * COLS + nc);
    }
  }
  return cells;
}

export function triggerRainbow(grid: Gem[], targetType: GemType): number[] {
  const cells: number[] = [];
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] && grid[i].type === targetType) cells.push(i);
  }
  return cells;
}

/** Collect all cells to remove including chain reactions from special gems */
export function collectTriggeredCells(
  grid: Gem[],
  initialRemove: Set<number>,
  swapContext?: { pos: number; targetType: GemType },
): Set<number> {
  const allRemove = new Set(initialRemove);
  const queue = [...initialRemove].filter(i => grid[i]?.special);
  const processed = new Set<number>();

  while (queue.length > 0) {
    const idx = queue.shift()!;
    if (processed.has(idx)) continue;
    processed.add(idx);
    const gem = grid[idx];
    if (!gem?.special) continue;

    let triggered: number[] = [];
    if (gem.special === 'striped_h') triggered = triggerStriped(idx, 'h');
    else if (gem.special === 'striped_v') triggered = triggerStriped(idx, 'v');
    else if (gem.special === 'bomb') triggered = triggerBomb(idx);
    else if (gem.special === 'rainbow') {
      // Rainbow: use swapped gem's type if available, otherwise most common type
      let targetType: GemType;
      if (swapContext && idx === swapContext.pos) {
        targetType = swapContext.targetType;
      } else {
        const typeCounts: Partial<Record<GemType, number>> = {};
        for (let i = 0; i < grid.length; i++) {
          if (grid[i] && !allRemove.has(i)) { typeCounts[grid[i].type] = (typeCounts[grid[i].type] || 0) + 1; }
        }
        targetType = (Object.entries(typeCounts) as [GemType, number][])
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'atk';
      }
      triggered = triggerRainbow(grid, targetType);
    }

    for (const t of triggered) {
      if (!allRemove.has(t)) {
        allRemove.add(t);
        if (grid[t]?.special && !processed.has(t)) queue.push(t); // chain!
      }
    }
  }
  return allRemove;
}

export function applyGravity(grid: Gem[]): Gem[] {
  const newGrid = [...grid];
  for (let c = 0; c < COLS; c++) {
    // Two-pointer approach for in-place gravity shift per column
    // Pointer 'writeIdx' points to the lowest available empty slot
    let writeRow = ROWS - 1;
    // Pointer 'readRow' scans upwards for gems
    for (let readRow = ROWS - 1; readRow >= 0; readRow--) {
      const g = newGrid[readRow * COLS + c];
      if (g) {
        if (writeRow !== readRow) {
          // Move gem down to the lowest empty slot
          newGrid[writeRow * COLS + c] = g;
          newGrid[readRow * COLS + c] = null as unknown as Gem; // Will be properly filled later
        }
        writeRow--;
      }
    }
    // Fill remaining empty slots at the top with new random gems
    for (let r = writeRow; r >= 0; r--) {
      newGrid[r * COLS + c] = randomGem();
    }
  }
  return newGrid;
}

export function areAdjacent(a: number, b: number): boolean {
  const ar = Math.floor(a / COLS), ac = a % COLS;
  const br = Math.floor(b / COLS), bc = b % COLS;
  return (Math.abs(ar - br) + Math.abs(ac - bc)) === 1;
}

// ═══ Idle Hints logic ═══

/**
 * Sweeps the board horizontally and vertically to find the first valid move.
 * Returns the indices of the matched gems if a move is found, otherwise null.
 */
export function findPossibleMove(grid: Gem[]): number[] | null {
  // We use an in-place swap to avoid allocating [...grid] on every single check
  // This drastically reduces Garbage Collection overhead running in the background.
  const tempGrid = [...grid]; // Clone ONCE for the whole function

  const trySwap = (idx1: number, idx2: number): number[] | null => {
    // In-place swap
    const temp = tempGrid[idx1];
    tempGrid[idx1] = tempGrid[idx2];
    tempGrid[idx2] = temp;

    const matches = findMatches(tempGrid);

    // Swap back
    tempGrid[idx2] = tempGrid[idx1];
    tempGrid[idx1] = temp;

    if (matches.size >= 3) {
      return Array.from(matches);
    }
    return null;
  };

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;

      // Try swapping right
      if (c < COLS - 1) {
        const match = trySwap(idx, idx + 1);
        if (match) return match;
      }

      // Try swapping down
      if (r < ROWS - 1) {
        const match = trySwap(idx, idx + COLS);
        if (match) return match;
      }
    }
  }

  return null;
}
