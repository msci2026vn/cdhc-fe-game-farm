// ═══════════════════════════════════════════════════════════════
// useBossSprite — Manages multi-state boss SVG sprite switching
// Swaps <img src> between idle/attack/dead SVGs
// Each SVG has internal CSS @keyframes animations
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';

export type BossSpriteState = 'idle' | 'attack' | 'dead';

interface UseBossSpriteOptions {
  /** Base path without state suffix, e.g. "/assets/bosses/ruong-lua/rep-con/boss-1" */
  spritePath: string | undefined;
  /** Single fallback image (old-style single SVG) */
  fallbackImage: string | undefined;
  /** How long to show attack SVG before returning to idle (ms) */
  attackDuration?: number;
}

interface UseBossSpriteReturn {
  state: BossSpriteState;
  /** Current image src to render */
  src: string | undefined;
  /** Whether this boss has multi-state sprites */
  hasSprites: boolean;
  triggerAttack: () => void;
  triggerDead: () => void;
}

export function useBossSprite({
  spritePath,
  fallbackImage,
  attackDuration = 900,
}: UseBossSpriteOptions): UseBossSpriteReturn {
  const [state, setState] = useState<BossSpriteState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const hasSprites = !!spritePath;

  const getSrc = (s: BossSpriteState): string | undefined => {
    if (spritePath) return `${spritePath}-${s}.svg`;
    return fallbackImage;
  };

  const triggerAttack = useCallback(() => {
    if (state === 'dead') return;
    setState('attack');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setState('idle'), attackDuration);
  }, [state, attackDuration]);

  const triggerDead = useCallback(() => {
    clearTimeout(timerRef.current);
    setState('dead');
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return {
    state,
    src: getSrc(state),
    hasSprites,
    triggerAttack,
    triggerDead,
  };
}
