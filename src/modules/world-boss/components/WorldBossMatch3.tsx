// ═══════════════════════════════════════════════════════════════
// WorldBossMatch3 — Lightweight 5-turn match-3 overlay
// Reuses board.utils.ts engine, NOT the full campaign combat
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  COLS, ROWS, GEM_META,
  createGrid, findMatchGroups, collectTriggeredCells, applyGravity,
  areAdjacent,
  type Gem, type GemType,
} from '@/shared/match3/board.utils';
import { useGemPointer } from '@/shared/match3/useGemPointer';
import type { Match3Result } from '../hooks/useWorldBossAttack';

const MAX_TURNS = 5;
const MATCH_DELAY = 300;
const CASCADE_DELAY = 250;

interface Props {
  onComplete: (result: Match3Result) => void;
  onCancel: () => void;
}

export function WorldBossMatch3({ onComplete, onCancel }: Props) {
  const [grid, setGrid] = useState<Gem[]>(() => createGrid());
  const [selected, setSelected] = useState<number | null>(null);
  const [matchedCells, setMatchedCells] = useState<Set<number>>(new Set());
  const [animating, setAnimating] = useState(false);
  const [turnsLeft, setTurnsLeft] = useState(MAX_TURNS);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  // Accumulate stats — ref for logic, state for display
  const statsRef = useRef({ gemsMatched: 0, maxCombo: 0, specialGems: 0, score: 0 });
  const completedRef = useRef(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayGems, setDisplayGems] = useState(0);
  const [displayMaxCombo, setDisplayMaxCombo] = useState(0);
  const [displaySpecials, setDisplaySpecials] = useState(0);

  // Process matches cascading
  const processCascade = useCallback(async (currentGrid: Gem[]) => {
    let g = currentGrid;
    let cascadeCombo = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const groups = findMatchGroups(g);
      if (groups.length === 0) break;

      cascadeCombo++;
      const allPositions = new Set<number>();
      let specialCount = 0;
      for (const group of groups) {
        for (const pos of group.positions) allPositions.add(pos);
        if (group.pattern !== 'match3') specialCount++;
        // Spawn special gem at group.specialSpawn if exists
        if (group.specialSpawn) {
          const { pos, special } = group.specialSpawn;
          if (g[pos]) {
            g = [...g];
            g[pos] = { ...g[pos], special };
          }
        }
      }

      // Collect triggered cells (chain reactions from specials)
      const toRemove = collectTriggeredCells(g, allPositions);

      // Update stats (ref for logic + state for display)
      statsRef.current.gemsMatched += toRemove.size;
      statsRef.current.specialGems += specialCount;
      statsRef.current.score += toRemove.size * cascadeCombo;
      setDisplayGems(statsRef.current.gemsMatched);
      setDisplaySpecials(statsRef.current.specialGems);
      setDisplayScore(statsRef.current.score);

      // Show matched cells animation
      setMatchedCells(new Set(toRemove));
      setCombo(cascadeCombo);
      setShowCombo(true);
      await delay(MATCH_DELAY);

      // Remove matched + gravity
      const nextGrid = [...g];
      for (const idx of toRemove) {
        nextGrid[idx] = null as unknown as Gem;
      }
      g = applyGravity(nextGrid);
      setGrid(g);
      setMatchedCells(new Set());
      await delay(CASCADE_DELAY);
    }

    if (cascadeCombo > statsRef.current.maxCombo) {
      statsRef.current.maxCombo = cascadeCombo;
      setDisplayMaxCombo(cascadeCombo);
    }
    setTimeout(() => setShowCombo(false), 600);
    return g;
  }, []);

  // Handle swap
  const doSwap = useCallback(async (idxA: number, idxB: number) => {
    if (animating || turnsLeft <= 0) return;
    setAnimating(true);

    const newGrid = [...grid];
    const temp = newGrid[idxA];
    newGrid[idxA] = newGrid[idxB];
    newGrid[idxB] = temp;

    // Check if swap produces matches
    const groups = findMatchGroups(newGrid, idxA);
    if (groups.length === 0) {
      // Invalid swap — swap back
      setAnimating(false);
      return;
    }

    setGrid(newGrid);
    setTurnsLeft(prev => prev - 1);
    await processCascade(newGrid);
    setAnimating(false);
  }, [grid, animating, turnsLeft, processCascade]);

  // Complete when turns exhausted
  useEffect(() => {
    if (turnsLeft <= 0 && !animating && !completedRef.current) {
      completedRef.current = true;
      setTimeout(() => {
        onComplete({ ...statsRef.current });
      }, 400);
    }
  }, [turnsLeft, animating, onComplete]);

  // Pointer handlers
  const handleTap = useCallback((idx: number) => {
    if (animating || turnsLeft <= 0) return;
    if (selected === null) {
      setSelected(idx);
    } else if (selected === idx) {
      setSelected(null);
    } else if (areAdjacent(selected, idx)) {
      const s = selected;
      setSelected(null);
      doSwap(s, idx);
    } else {
      setSelected(idx);
    }
  }, [selected, animating, turnsLeft, doSwap]);

  const handleSwipe = useCallback((idx: number, direction: 'up' | 'down' | 'left' | 'right') => {
    if (animating || turnsLeft <= 0) return;
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    let target = -1;
    if (direction === 'left' && col > 0) target = idx - 1;
    else if (direction === 'right' && col < COLS - 1) target = idx + 1;
    else if (direction === 'up' && row > 0) target = idx - COLS;
    else if (direction === 'down' && row < ROWS - 1) target = idx + COLS;
    if (target >= 0) {
      setSelected(null);
      doSwap(idx, target);
    }
  }, [animating, turnsLeft, doSwap]);

  const pointer = useGemPointer(handleTap, handleSwipe);

  const cellSize = Math.min(Math.floor((window.innerWidth - 32) / COLS), 48);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
      {/* Top bar */}
      <div className="flex items-center justify-between w-full max-w-sm px-4 mb-3">
        <button onClick={onCancel} className="text-gray-400 hover:text-white px-3 py-1 text-sm">
          Huy
        </button>
        <div className="text-white font-bold text-lg">
          Luot: {turnsLeft}/{MAX_TURNS}
        </div>
        <div className="text-yellow-400 font-bold text-sm">
          {displayScore} diem
        </div>
      </div>

      {/* Combo indicator */}
      {showCombo && combo > 1 && (
        <div className="text-yellow-300 font-bold text-2xl mb-1 animate-bounce">
          Combo x{combo}!
        </div>
      )}

      {/* Grid */}
      <div
        className="relative bg-gray-800/90 rounded-xl p-2 border border-gray-600"
        style={{ width: cellSize * COLS + 16, touchAction: 'none' }}
        onPointerMove={pointer.handlePointerMove as any}
        onPointerUp={pointer.handlePointerUp as any}
      >
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${cellSize}px)`,
          }}
        >
          {grid.map((gem, idx) => {
            const meta = GEM_META[gem.type as GemType];
            const isSelected = idx === selected;
            const isMatched = matchedCells.has(idx);
            return (
              <div
                key={gem.id}
                className={[
                  'flex items-center justify-center rounded-md text-lg transition-all duration-150 select-none',
                  meta?.css ?? '',
                  isSelected ? 'ring-2 ring-yellow-400 scale-110' : '',
                  isMatched ? 'animate-gem-pop scale-0' : '',
                  gem.special ? 'ring-1 ring-white/50' : '',
                ].join(' ')}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: isMatched ? 'rgba(255,255,255,0.3)' : undefined,
                }}
                onPointerDown={(e) => pointer.handlePointerDown(idx, e as any)}
              >
                {gem.special === 'bomb' ? '💣' :
                 gem.special === 'rainbow' ? '🌈' :
                 gem.special?.startsWith('striped') ? '✨' :
                 meta?.emoji ?? '?'}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats footer */}
      <div className="flex gap-4 mt-3 text-xs text-gray-400">
        <span>Gems: {displayGems}</span>
        <span>Max combo: {displayMaxCombo}</span>
        <span>Specials: {displaySpecials}</span>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
