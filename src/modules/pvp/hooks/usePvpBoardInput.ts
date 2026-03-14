// usePvpBoardInput.ts
// Gesture handling for PVP board — wraps shared useGemPointer
// Logic: tap-to-select → tap adjacent → send swap to server
//        drag/swipe → directly send swap
// No local match processing — server is authoritative

import { useState, useCallback } from 'react';
import { useGemPointer } from '@/shared/match3/useGemPointer';

function isAdjacent(a: number, b: number): boolean {
  const aCol = a % 8, aRow = Math.floor(a / 8);
  const bCol = b % 8, bRow = Math.floor(b / 8);
  return (Math.abs(aCol - bCol) === 1 && aRow === bRow) ||
         (Math.abs(aRow - bRow) === 1 && aCol === bCol);
}

interface UsePvpBoardInputProps {
  onSwap: (from: number, to: number) => void;
  disabled?: boolean;
}

export function usePvpBoardInput({ onSwap, disabled }: UsePvpBoardInputProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  const triggerAnimating = useCallback((ms = 400) => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), ms);
  }, []);

  // Tap: first tap selects, second tap on adjacent gem → send swap
  const handleTap = useCallback((idx: number) => {
    if (disabled || animating) return;
    if (selected === null) {
      setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    if (isAdjacent(selected, idx)) {
      onSwap(selected, idx);
      setSelected(null);
      triggerAnimating(400);
    } else {
      // Not adjacent → reselect to new gem
      setSelected(idx);
    }
  }, [disabled, animating, selected, onSwap, triggerAnimating]);

  // Swipe: compute target from direction, send swap
  const handleSwipe = useCallback((idx: number, direction: 'up' | 'down' | 'left' | 'right') => {
    if (disabled || animating) return;
    const row = Math.floor(idx / 8);
    const col = idx % 8;
    let targetIdx = -1;
    if (direction === 'up'    && row > 0) targetIdx = idx - 8;
    else if (direction === 'down'  && row < 7) targetIdx = idx + 8;
    else if (direction === 'left'  && col > 0) targetIdx = idx - 1;
    else if (direction === 'right' && col < 7) targetIdx = idx + 1;
    if (targetIdx === -1) return;
    setSelected(null);
    onSwap(idx, targetIdx);
    triggerAnimating(400);
  }, [disabled, animating, onSwap, triggerAnimating]);

  const { handlePointerDown, handlePointerMove, handlePointerUp } = useGemPointer(handleTap, handleSwipe);

  return {
    selected,
    setSelected,
    animating,
    triggerAnimating,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
