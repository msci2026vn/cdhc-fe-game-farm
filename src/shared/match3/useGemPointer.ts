// ═══════════════════════════════════════════════════════════════
// useGemPointer — shared drag-to-swipe / tap-to-select handling
// ═══════════════════════════════════════════════════════════════

import { useRef } from 'react';

export function useGemPointer(
  handleTap: (idx: number) => void,
  handleSwipe: (idx: number, direction: 'up' | 'down' | 'left' | 'right') => void,
) {
  const dragRef = useRef<{ idx: number; x: number; y: number } | null>(null);

  const handlePointerDown = (idx: number, e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      handleTap(idx);
      return;
    }
    e.preventDefault();
    dragRef.current = { idx, x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || e.pointerType === 'mouse') return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 12) {
      const startIdx = dragRef.current.idx;
      dragRef.current = null;
      if (absDx > absDy) {
        handleSwipe(startIdx, dx > 0 ? 'right' : 'left');
      } else {
        handleSwipe(startIdx, dy > 0 ? 'down' : 'up');
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    if (e.pointerType !== 'mouse') {
      handleTap(dragRef.current.idx);
    }
    dragRef.current = null;
  };

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}
