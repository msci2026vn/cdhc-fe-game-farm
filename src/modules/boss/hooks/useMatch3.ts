import { useState, useCallback, useRef } from 'react';

const COLS = 6;
const ROWS = 6;
const GEM_TYPES = ['atk', 'hp', 'def', 'star'] as const;
export type GemType = (typeof GEM_TYPES)[number];

export interface Gem {
  type: GemType;
  id: number;
}

const GEM_META: Record<GemType, { emoji: string; css: string }> = {
  atk: { emoji: '⚔️', css: 'gem-atk' },
  hp:  { emoji: '💚', css: 'gem-hp' },
  def: { emoji: '🛡️', css: 'gem-def' },
  star:{ emoji: '⭐', css: 'gem-star' },
};

let nextId = 0;
const randomGem = (): Gem => ({ type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)], id: nextId++ });

/** Create initial grid with no pre-existing matches */
function createGrid(): Gem[] {
  const grid: Gem[] = [];
  for (let i = 0; i < ROWS * COLS; i++) {
    let gem = randomGem();
    // Prevent initial horizontal matches
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    while (
      (col >= 2 && grid[i - 1].type === gem.type && grid[i - 2].type === gem.type) ||
      (row >= 2 && grid[i - COLS].type === gem.type && grid[i - 2 * COLS].type === gem.type)
    ) {
      gem = randomGem();
    }
    grid.push(gem);
  }
  return grid;
}

function findMatches(grid: Gem[]): Set<number> {
  const matched = new Set<number>();

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 3; c++) {
      const idx = r * COLS + c;
      const t = grid[idx].type;
      let len = 1;
      while (c + len < COLS && grid[idx + len].type === t) len++;
      if (len >= 3) {
        for (let k = 0; k < len; k++) matched.add(idx + k);
      }
      if (len > 1) c += len - 2; // skip ahead
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 3; r++) {
      const idx = r * COLS + c;
      const t = grid[idx].type;
      let len = 1;
      while (r + len < ROWS && grid[idx + len * COLS].type === t) len++;
      if (len >= 3) {
        for (let k = 0; k < len; k++) matched.add(idx + k * COLS);
      }
      if (len > 1) r += len - 2;
    }
  }

  return matched;
}

function applyGravity(grid: Gem[]): Gem[] {
  const newGrid = [...grid];
  for (let c = 0; c < COLS; c++) {
    // Collect non-null gems in column from bottom to top
    const col: Gem[] = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      const g = newGrid[r * COLS + c];
      if (g) col.push(g);
    }
    // Fill column: bottom = existing gems, top = new gems
    for (let r = ROWS - 1; r >= 0; r--) {
      const fromBottom = ROWS - 1 - r;
      newGrid[r * COLS + c] = fromBottom < col.length ? col[fromBottom] : randomGem();
    }
  }
  return newGrid;
}

export interface MatchResult {
  type: GemType;
  count: number;
}

function areAdjacent(a: number, b: number): boolean {
  const ar = Math.floor(a / COLS), ac = a % COLS;
  const br = Math.floor(b / COLS), bc = b % COLS;
  return (Math.abs(ar - br) + Math.abs(ac - bc)) === 1;
}

export interface BossState {
  bossHp: number;
  bossMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  shield: number;
  ultCharge: number;
}

export interface DamagePopup {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
}

const DMG_PER_GEM: Record<GemType, number> = {
  atk: 45,
  hp: 0,
  def: 0,
  star: 25,
};

export function useMatch3() {
  const [grid, setGrid] = useState<Gem[]>(createGrid);
  const [selected, setSelected] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [matchedCells, setMatchedCells] = useState<Set<number>>(new Set());
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const comboRef = useRef(0);
  const [boss, setBoss] = useState<BossState>({
    bossHp: 10000, bossMaxHp: 10000,
    playerHp: 1000, playerMaxHp: 1000,
    shield: 200, ultCharge: 0,
  });
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const popupId = useRef(0);

  const addPopup = useCallback((text: string, color: string) => {
    const id = popupId.current++;
    const x = 20 + Math.random() * 60;
    const y = 15 + Math.random() * 40;
    setPopups(prev => [...prev, { id, text, color, x, y }]);
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1400);
  }, []);

  const getMultiplier = (comboCount: number) => {
    if (comboCount <= 1) return 1;
    if (comboCount === 2) return 1.5;
    if (comboCount === 3) return 2;
    if (comboCount === 4) return 2.5;
    return 3;
  };

  const processMatches = useCallback((currentGrid: Gem[], currentCombo: number) => {
    const matched = findMatches(currentGrid);
    if (matched.size === 0) {
      // End of chain - hide combo after delay
      if (currentCombo > 1) {
        setTimeout(() => setShowCombo(false), 1500);
      } else {
        setShowCombo(false);
      }
      comboRef.current = 0;
      setAnimating(false);
      return;
    }

    const newCombo = currentCombo + 1;
    comboRef.current = newCombo;
    setCombo(newCombo);
    if (newCombo >= 2) setShowCombo(true);

    const multiplier = getMultiplier(newCombo);

    // Tally match results
    const tally: Partial<Record<GemType, number>> = {};
    matched.forEach(idx => {
      const t = currentGrid[idx].type;
      tally[t] = (tally[t] || 0) + 1;
    });

    setMatchedCells(new Set(matched));

    setTimeout(() => {
      setBoss(prev => {
        let { bossHp, playerHp, shield, ultCharge } = prev;
        const atkCount = tally.atk || 0;
        const hpCount = tally.hp || 0;
        const defCount = tally.def || 0;
        const starCount = tally.star || 0;

        const baseDmg = atkCount * DMG_PER_GEM.atk + starCount * DMG_PER_GEM.star;
        const totalDmg = Math.round(baseDmg * multiplier);
        bossHp = Math.max(0, bossHp - totalDmg);
        playerHp = Math.min(prev.playerMaxHp, playerHp + Math.round(hpCount * 30 * multiplier));
        shield = shield + Math.round(defCount * 25 * multiplier);
        ultCharge = Math.min(100, ultCharge + starCount * 8 + atkCount * 3 + (newCombo >= 2 ? 5 : 0));

        if (totalDmg > 0) {
          const label = newCombo >= 2 ? `-${totalDmg} (x${multiplier})` : `-${totalDmg}`;
          addPopup(label, newCombo >= 3 ? '#ff6b6b' : '#ffe066');
        }
        if (hpCount > 0) addPopup(`+${Math.round(hpCount * 30 * multiplier)} HP`, '#55efc4');
        if (defCount > 0) addPopup(`+${Math.round(defCount * 25 * multiplier)} 🛡️`, '#74b9ff');

        return { ...prev, bossHp, playerHp, shield, ultCharge };
      });

      const cleared = currentGrid.map((g, i) => matched.has(i) ? null : g) as (Gem | null)[];
      const fallen = applyGravity(cleared as Gem[]);
      setGrid(fallen);
      setMatchedCells(new Set());

      // Check for cascades
      setTimeout(() => processMatches(fallen, newCombo), 300);
    }, 350);
  }, [addPopup]);

  const handleTap = useCallback((idx: number) => {
    if (animating) return;

    if (selected === null) {
      setSelected(idx);
      return;
    }

    if (selected === idx) {
      setSelected(null);
      return;
    }

    if (!areAdjacent(selected, idx)) {
      setSelected(idx);
      return;
    }

    // Swap
    setAnimating(true);
    setSelected(null);
    const newGrid = [...grid];
    [newGrid[selected], newGrid[idx]] = [newGrid[idx], newGrid[selected]];

    // Check if swap creates a match
    const matched = findMatches(newGrid);
    if (matched.size === 0) {
      // Invalid swap - swap back
      setGrid(newGrid);
      setTimeout(() => {
        const reverted = [...newGrid];
        [reverted[selected], reverted[idx]] = [reverted[idx], reverted[selected]];
        setGrid(reverted);
        setAnimating(false);
      }, 300);
      return;
    }

    setGrid(newGrid);
    setTimeout(() => processMatches(newGrid, 0), 200);
  }, [grid, selected, animating, processMatches]);

  return { grid, selected, animating, matchedCells, combo, showCombo, boss, popups, handleTap, GEM_META };
}
