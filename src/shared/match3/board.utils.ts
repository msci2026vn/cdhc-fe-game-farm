// ═══════════════════════════════════════════════════════════════
// Board utilities — shared grid logic for match-3 combat
// ═══════════════════════════════════════════════════════════════

export const COLS = 6;
export const ROWS = 6;
export const GEM_TYPES = ['atk', 'hp', 'def', 'star'] as const;
export type GemType = (typeof GEM_TYPES)[number];

export interface Gem { type: GemType; id: number; }

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

export function applyGravity(grid: Gem[]): Gem[] {
  const newGrid = [...grid];
  for (let c = 0; c < COLS; c++) {
    const col: Gem[] = [];
    for (let r = ROWS - 1; r >= 0; r--) { const g = newGrid[r * COLS + c]; if (g) col.push(g); }
    for (let r = ROWS - 1; r >= 0; r--) {
      const fromBottom = ROWS - 1 - r;
      newGrid[r * COLS + c] = fromBottom < col.length ? col[fromBottom] : randomGem();
    }
  }
  return newGrid;
}

export function areAdjacent(a: number, b: number): boolean {
  const ar = Math.floor(a / COLS), ac = a % COLS;
  const br = Math.floor(b / COLS), bc = b % COLS;
  return (Math.abs(ar - br) + Math.abs(ac - bc)) === 1;
}
