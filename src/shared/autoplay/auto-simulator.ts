// ═══════════════════════════════════════════════════════════════
// Auto-play cascade simulator — pure simulation on grid copy
// Evaluates swap outcomes without mutating game state
// ═══════════════════════════════════════════════════════════════

import {
  type Gem,
  type GemType,
  COLS,
  ROWS,
  findMatches,
  findMatchGroups,
  collectTriggeredCells,
  applyGravity,
} from '../match3/board.utils';

const MAX_CASCADE = 50;
const GRID_SIZE = ROWS * COLS;

// ═══ Exported types ═══

/** Result of simulating a full swap cascade */
export interface SimulationResult {
  isValid: boolean;
  totalGems: { atk: number; hp: number; def: number; star: number };
  cascadeDepth: number;
  specialGemsCreated: number;
  specialGemsTriggered: number;
  totalGemsCleared: number;
}

/** A valid swap candidate */
export interface ValidSwap {
  posA: number;
  posB: number;
}

/** Quick single-step result for greedy Lv2 */
export interface QuickResult {
  isValid: boolean;
  gemCounts: { atk: number; hp: number; def: number; star: number };
  specialGemsCreated: number;
  matchedCount: number;
}

// ═══ Internal helpers ═══

const zeroGems = () => ({ atk: 0, hp: 0, def: 0, star: 0 });

let simId = 1_000_000;

// ═══ simulateSwap — full cascade simulation ═══

export function simulateSwap(
  grid: Gem[],
  posA: number,
  posB: number,
): SimulationResult {
  // Deep copy — each Gem is a new object so we can null-out cells
  const sim: (Gem | null)[] = grid.map(g => (g ? { ...g } : null));

  // Perform swap on copy
  [sim[posA], sim[posB]] = [sim[posB], sim[posA]];

  // Quick validity check — no match means invalid swap
  if (findMatches(sim as Gem[]).size === 0) {
    return {
      isValid: false, totalGems: zeroGems(),
      cascadeDepth: 0, specialGemsCreated: 0,
      specialGemsTriggered: 0, totalGemsCleared: 0,
    };
  }

  const totalGems = zeroGems();
  let cascadeDepth = 0;
  let specialGemsCreated = 0;
  let specialGemsTriggered = 0;
  let totalGemsCleared = 0;

  for (let step = 0; step < MAX_CASCADE; step++) {
    const groups = findMatchGroups(sim as Gem[], step === 0 ? posA : undefined);
    if (groups.length === 0) break;

    // Collect matched positions + planned special spawns
    const matchedSet = new Set<number>();
    const spawns: Array<{ pos: number; special: string; type: GemType }> = [];

    for (const group of groups) {
      for (const pos of group.positions) matchedSet.add(pos);
      if (group.specialSpawn) {
        spawns.push({
          pos: group.specialSpawn.pos,
          special: group.specialSpawn.special,
          type: group.type,
        });
        specialGemsCreated++;
      }
    }

    // Count existing special gems in matched set — they get triggered
    for (const pos of matchedSet) {
      if (sim[pos]?.special) specialGemsTriggered++;
    }

    // Expand via chain reactions from triggered special gems
    const expandedSet = collectTriggeredCells(sim as Gem[], matchedSet);

    // Tally all cleared gems by type
    for (const pos of expandedSet) {
      const gem = sim[pos];
      if (gem) {
        totalGems[gem.type]++;
        // Chain-triggered specials not in original matched set
        if (!matchedSet.has(pos) && gem.special) specialGemsTriggered++;
      }
    }
    totalGemsCleared += expandedSet.size;

    // Clear cells
    for (const pos of expandedSet) sim[pos] = null;

    // Place newly created special gems at spawn positions
    for (const spawn of spawns) {
      sim[spawn.pos] = {
        type: spawn.type,
        id: simId++,
        special: spawn.special as Gem['special'],
      };
    }

    // Gravity + random fill for empty cells
    const filled = applyGravity(sim as Gem[]);
    for (let i = 0; i < GRID_SIZE; i++) sim[i] = filled[i];

    cascadeDepth++;

    // Early exit if no more matches after gravity
    if (findMatches(sim as Gem[]).size === 0) break;
  }

  return {
    isValid: true,
    totalGems,
    cascadeDepth,
    specialGemsCreated,
    specialGemsTriggered,
    totalGemsCleared,
  };
}

// ═══ findAllValidSwaps — enumerate all legal swaps ═══

export function findAllValidSwaps(
  grid: Gem[],
  lockedPositions?: Set<number>,
): ValidSwap[] {
  const swaps: ValidSwap[] = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    if (lockedPositions?.has(i)) continue;
    const row = Math.floor(i / COLS);
    const col = i % COLS;

    // Right neighbor (j > i avoids duplicate pairs)
    if (col < COLS - 1) {
      const j = i + 1;
      if (!lockedPositions?.has(j)) {
        const test = [...grid];
        [test[i], test[j]] = [test[j], test[i]];
        if (findMatches(test).size > 0) swaps.push({ posA: i, posB: j });
      }
    }

    // Down neighbor
    if (row < ROWS - 1) {
      const j = i + COLS;
      if (!lockedPositions?.has(j)) {
        const test = [...grid];
        [test[i], test[j]] = [test[j], test[i]];
        if (findMatches(test).size > 0) swaps.push({ posA: i, posB: j });
      }
    }
  }

  return swaps;
}

// ═══ quickSimulate — single-step for greedy Lv2 (no cascade) ═══

export function quickSimulate(
  grid: Gem[],
  posA: number,
  posB: number,
): QuickResult {
  const sim = [...grid];
  [sim[posA], sim[posB]] = [sim[posB], sim[posA]];

  const groups = findMatchGroups(sim, posA);
  if (groups.length === 0) {
    return { isValid: false, gemCounts: zeroGems(), specialGemsCreated: 0, matchedCount: 0 };
  }

  const gemCounts = zeroGems();
  let specialGemsCreated = 0;
  const counted = new Set<number>();

  for (const group of groups) {
    for (const pos of group.positions) {
      if (!counted.has(pos)) {
        counted.add(pos);
        gemCounts[sim[pos].type]++;
      }
    }
    if (group.specialSpawn) specialGemsCreated++;
  }

  return { isValid: true, gemCounts, specialGemsCreated, matchedCount: counted.size };
}
