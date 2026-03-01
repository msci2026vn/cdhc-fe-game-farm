// ═══════════════════════════════════════════════════════════════
// Auto-play MCTS engine — Monte Carlo Tree Search for VIP Lv4-5
// Looks 2 moves ahead via random rollouts to find setups
// (bomb→rainbow chains, cascade setups) that greedy misses
// ═══════════════════════════════════════════════════════════════

import type { Gem, GemType } from '../match3/board.utils';
import {
  COLS, ROWS,
  findMatches, findMatchGroups,
  collectTriggeredCells, applyGravity,
} from '../match3/board.utils';
import type { SimulationResult, ValidSwap } from './auto-simulator';
import { findAllValidSwaps } from './auto-simulator';
import { scoreMove, type ScorerGameState } from './auto-scorer';

const MAX_CASCADE = 50;
const GRID_SIZE = ROWS * COLS;
const ROLLOUT_DEPTH = 2;
const ROLLOUT_DISCOUNT = 0.6;
const MAX_EXPLORE_SWAPS = 50;
const TOP_K = 5;
const TIME_BUDGET_MS = 150;

let mctsId = 2_000_000;

// ═══ Exported types ═══

export interface MCTSResult {
  bestSwap: ValidSwap;
  avgScore: number;
  simulations: number;
  exploredSwaps: number;
}

// ═══ simulateAndGetGrid — cascade sim that returns final grid ═══

function simulateAndGetGrid(
  grid: Gem[],
  posA: number,
  posB: number,
): { result: SimulationResult; gridAfter: Gem[] } {
  const sim: (Gem | null)[] = grid.map(g => (g ? { ...g } : null));
  [sim[posA], sim[posB]] = [sim[posB], sim[posA]];

  const zeroGems = { atk: 0, hp: 0, def: 0, star: 0 };

  if (findMatches(sim as Gem[]).size === 0) {
    return {
      result: {
        isValid: false, totalGems: zeroGems,
        cascadeDepth: 0, specialGemsCreated: 0,
        specialGemsTriggered: 0, totalGemsCleared: 0,
      },
      gridAfter: grid,
    };
  }

  const totalGems = { ...zeroGems };
  let cascadeDepth = 0;
  let specialGemsCreated = 0;
  let specialGemsTriggered = 0;
  let totalGemsCleared = 0;

  for (let step = 0; step < MAX_CASCADE; step++) {
    const groups = findMatchGroups(sim as Gem[], step === 0 ? posA : undefined);
    if (groups.length === 0) break;

    const matchedSet = new Set<number>();
    const spawns: Array<{ pos: number; special: string; type: GemType }> = [];

    for (const group of groups) {
      for (const pos of group.positions) matchedSet.add(pos);
      if (group.specialSpawn) {
        spawns.push({ pos: group.specialSpawn.pos, special: group.specialSpawn.special, type: group.type });
        specialGemsCreated++;
      }
    }

    for (const pos of matchedSet) {
      if (sim[pos]?.special) specialGemsTriggered++;
    }

    const expandedSet = collectTriggeredCells(sim as Gem[], matchedSet);

    for (const pos of expandedSet) {
      const gem = sim[pos];
      if (gem) {
        totalGems[gem.type]++;
        if (!matchedSet.has(pos) && gem.special) specialGemsTriggered++;
      }
    }
    totalGemsCleared += expandedSet.size;

    for (const pos of expandedSet) sim[pos] = null;

    for (const spawn of spawns) {
      sim[spawn.pos] = {
        type: spawn.type,
        id: mctsId++,
        special: spawn.special as Gem['special'],
      };
    }

    const filled = applyGravity(sim as Gem[]);
    for (let i = 0; i < GRID_SIZE; i++) sim[i] = filled[i];

    cascadeDepth++;
    if (findMatches(sim as Gem[]).size === 0) break;
  }

  return {
    result: {
      isValid: true, totalGems, cascadeDepth,
      specialGemsCreated, specialGemsTriggered, totalGemsCleared,
    },
    gridAfter: sim as Gem[],
  };
}

// ═══ rollout — random moves ahead, discounted scoring ═══

function rollout(grid: Gem[], state: ScorerGameState, depth: number): number {
  if (depth <= 0) return 0;

  const swaps = findAllValidSwaps(grid);
  if (swaps.length === 0) return 0;

  const pick = swaps[Math.floor(Math.random() * swaps.length)];
  const { result, gridAfter } = simulateAndGetGrid(grid, pick.posA, pick.posB);
  if (!result.isValid) return 0;

  const score = scoreMove(result, state);
  return score + rollout(gridAfter, state, depth - 1) * ROLLOUT_DISCOUNT;
}

// ═══ mctsSearch — main entry point ═══

export function mctsSearch(
  grid: Gem[],
  state: ScorerGameState,
  simCount: number,
  locked?: Set<number>,
): MCTSResult | null {
  if (simCount <= 0) return null;

  const validSwaps = findAllValidSwaps(grid, locked);
  if (validSwaps.length === 0) return null;
  if (validSwaps.length === 1) {
    const { result } = simulateAndGetGrid(grid, validSwaps[0].posA, validSwaps[0].posB);
    return {
      bestSwap: validSwaps[0],
      avgScore: result.isValid ? scoreMove(result, state) : 0,
      simulations: 1,
      exploredSwaps: 1,
    };
  }

  // Limit explore phase to MAX_EXPLORE_SWAPS
  const exploreSwaps = validSwaps.length > MAX_EXPLORE_SWAPS
    ? shuffle(validSwaps).slice(0, MAX_EXPLORE_SWAPS)
    : validSwaps;

  // Track scores per swap (keyed by "posA,posB")
  const stats = new Map<string, { totalScore: number; visits: number; swap: ValidSwap }>();
  for (const swap of exploreSwaps) {
    stats.set(`${swap.posA},${swap.posB}`, { totalScore: 0, visits: 0, swap });
  }

  const startTime = performance.now();
  let totalSims = 0;

  // Phase 1: Explore — try each swap at least once
  for (const swap of exploreSwaps) {
    if (performance.now() - startTime > TIME_BUDGET_MS) break;

    const score = runSimulation(grid, swap, state);
    const key = `${swap.posA},${swap.posB}`;
    const entry = stats.get(key)!;
    entry.totalScore += score;
    entry.visits += 1;
    totalSims++;
  }

  // Phase 2: Exploit — focus on top-K swaps
  if (totalSims < simCount && performance.now() - startTime < TIME_BUDGET_MS) {
    const topK = [...stats.values()]
      .sort((a, b) => (b.totalScore / b.visits) - (a.totalScore / a.visits))
      .slice(0, Math.min(TOP_K, stats.size));

    while (totalSims < simCount) {
      if (performance.now() - startTime > TIME_BUDGET_MS) break;

      const pick = topK[Math.floor(Math.random() * topK.length)];
      const score = runSimulation(grid, pick.swap, state);
      pick.totalScore += score;
      pick.visits += 1;
      totalSims++;
    }
  }

  // Select best swap by average score
  let bestEntry: { totalScore: number; visits: number; swap: ValidSwap } | null = null;
  let bestAvg = -Infinity;

  for (const entry of stats.values()) {
    if (entry.visits === 0) continue;
    const avg = entry.totalScore / entry.visits;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestEntry = entry;
    }
  }

  if (!bestEntry) return null;

  return {
    bestSwap: bestEntry.swap,
    avgScore: bestAvg,
    simulations: totalSims,
    exploredSwaps: stats.size,
  };
}

// ═══ Internal helpers ═══

function runSimulation(grid: Gem[], swap: ValidSwap, state: ScorerGameState): number {
  const { result, gridAfter } = simulateAndGetGrid(grid, swap.posA, swap.posB);
  if (!result.isValid) return 0;

  const moveScore = scoreMove(result, state);
  const rolloutScore = rollout(gridAfter, state, ROLLOUT_DEPTH);
  return moveScore + rolloutScore * ROLLOUT_DISCOUNT;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
