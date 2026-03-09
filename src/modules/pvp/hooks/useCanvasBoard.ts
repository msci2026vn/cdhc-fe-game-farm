import { useRef, useEffect, useCallback } from 'react';

// ── Gem visual config — aligned with campaign GEM_META ──
// 0=atk(⚔️) 1=hp(💚) 2=def(🛡️) 3=star(⭐) 4=junk(🪨)
const GEM_CONFIG: Array<{ bg: string; shine: string; emoji: string }> = [
  { bg: '#dc2626', shine: 'rgba(255,180,180,0.35)', emoji: '⚔️' },  // 0: atk
  { bg: '#16a34a', shine: 'rgba(150,255,180,0.35)', emoji: '💚' },  // 1: hp
  { bg: '#2563eb', shine: 'rgba(180,200,255,0.35)', emoji: '🛡️' },  // 2: def
  { bg: '#ca8a04', shine: 'rgba(255,230,100,0.35)', emoji: '⭐' },  // 3: star
  { bg: '#57534e', shine: 'rgba(200,200,200,0.20)', emoji: '🪨' },  // 4: junk
];
const EMPTY_GEM = { bg: '#1f2937', shine: 'transparent', emoji: '' };

// ── Easing functions ──
function easeOutBack(t: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function easeOutQuad(t: number) { return t * (2 - t); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ── Gem animation state (mutable, no React re-render) ──
interface GemAnim {
  type: number;           // gem type index (-1 = empty)
  renderX: number;        // current render position (CSS px)
  renderY: number;
  targetX: number;        // where it should end up
  targetY: number;
  scale: number;
  opacity: number;
  animProgress: number;   // 0→1
  animType: 'idle' | 'swap' | 'fall' | 'match' | 'spawn';
}

interface DragState {
  idx: number;
  row: number;
  col: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  targetIdx: number | null;
  fired: boolean;
}

// Haptic feedback helpers — safe no-op if unavailable
function hapticLight() {
  navigator.vibrate?.(6);
  (window as Record<string, unknown>).Telegram &&
    ((window as Record<string, unknown>).Telegram as Record<string, unknown>).WebApp &&
    (((window as Record<string, unknown>).Telegram as Record<string, unknown>).WebApp as Record<string, unknown>).HapticFeedback &&
    ((((window as Record<string, unknown>).Telegram as Record<string, unknown>).WebApp as Record<string, unknown>).HapticFeedback as Record<string, (() => void) | undefined>).selectionChanged?.();
}
function hapticMedium() {
  navigator.vibrate?.([12, 0, 8]);
  (window as Record<string, unknown>).Telegram &&
    ((window as Record<string, unknown>).Telegram as Record<string, unknown>).WebApp &&
    (((window as Record<string, unknown>).Telegram as Record<string, unknown>).WebApp as Record<string, unknown>).HapticFeedback &&
    ((((window as Record<string, unknown>).Telegram as Record<string, unknown>).WebApp as Record<string, unknown>).HapticFeedback as Record<string, ((s: string) => void) | undefined>).impactOccurred?.('medium');
}

export interface UseCanvasBoardOptions {
  board: number[];                                                // flat 64-element array
  onSwap?: (from: number, to: number) => void;                   // callback: flat indices
  disabled?: boolean;
}

export function useCanvasBoard({ board, onSwap, disabled }: UseCanvasBoardOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const dprRef = useRef(1);
  const cellRef = useRef(44);          // cell size in CSS px
  const gemsRef = useRef<GemAnim[]>([]); // mutable gem states
  const dragRef = useRef<DragState | null>(null);
  const prevBoardRef = useRef<number[]>([]);
  const needsDrawRef = useRef(true);   // dirty flag for RAF

  // ── Resize canvas to match parent, respecting devicePixelRatio ──
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    dprRef.current = dpr;
    const cssSize = parent.getBoundingClientRect().width;
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;
    canvas.width = Math.round(cssSize * dpr);
    canvas.height = Math.round(cssSize * dpr);
    cellRef.current = cssSize / 8;
    needsDrawRef.current = true;
  }, []);

  // ── Init gem positions from board data ──
  const initGems = useCallback((tiles: number[]) => {
    const cell = cellRef.current;
    gemsRef.current = tiles.map((type, idx) => {
      const row = Math.floor(idx / 8);
      const col = idx % 8;
      const x = col * cell;
      const y = row * cell;
      return {
        type, renderX: x, renderY: y,
        targetX: x, targetY: y,
        scale: 1, opacity: type === -1 ? 0.2 : 1,
        animProgress: 1, animType: 'idle' as const,
      };
    });
    prevBoardRef.current = [...tiles];
    needsDrawRef.current = true;
  }, []);

  // ── Draw a single gem onto the canvas ──
  const drawGem = useCallback((
    ctx: CanvasRenderingContext2D,
    type: number,
    x: number, y: number,
    size: number,
    scale: number,
    opacity: number,
    isTarget: boolean,
  ) => {
    const gem = type >= 0 && type < GEM_CONFIG.length ? GEM_CONFIG[type] : EMPTY_GEM;
    const dpr = dprRef.current;
    const cx = (x + size / 2) * dpr;
    const cy = (y + size / 2) * dpr;
    const r = (size * scale / 2 - 2) * dpr;

    if (r <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(cx, cy);

    // Target hint: dashed border
    if (isTarget) {
      const gap = 2 * dpr;
      ctx.setLineDash([3 * dpr, 3 * dpr]);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.roundRect(-r - gap, -r - gap, (r + gap) * 2, (r + gap) * 2, 8 * dpr);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      return;
    }

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4 * dpr * scale;
    ctx.shadowOffsetY = 2 * dpr * scale;

    // Background rounded rect
    ctx.fillStyle = gem.bg;
    ctx.beginPath();
    ctx.roundRect(-r, -r, r * 2, r * 2, 7 * dpr);
    ctx.fill();

    // Shine gradient (top-left)
    ctx.shadowColor = 'transparent';
    const shineGrad = ctx.createRadialGradient(
      -r * 0.3, -r * 0.3, 0,
      -r * 0.3, -r * 0.3, r * 0.8,
    );
    shineGrad.addColorStop(0, gem.shine);
    shineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shineGrad;
    ctx.beginPath();
    ctx.roundRect(-r, -r, r * 2, r * 2, 7 * dpr);
    ctx.fill();

    // Emoji icon
    if (gem.emoji) {
      ctx.shadowColor = 'transparent';
      const fontSize = Math.round(r * 1.1);
      ctx.font = `${fontSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gem.emoji, 0, 1 * dpr);
    }

    ctx.restore();
  }, []);

  // ── RAF render loop ──
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    const dpr = dprRef.current;
    const cell = cellRef.current;
    const W = canvas.width;
    const H = canvas.height;
    const drag = dragRef.current;
    const gems = gemsRef.current;

    // Advance animations
    let animating = false;
    for (let i = 0; i < gems.length; i++) {
      const g = gems[i];
      if (g.animType === 'idle' || g.animProgress >= 1) continue;
      animating = true;
      g.animProgress = Math.min(1, g.animProgress + 0.08);
      const t = g.animProgress;

      switch (g.animType) {
        case 'swap':
        case 'fall': {
          const ease = easeOutBack(t);
          g.renderX = lerp(g.renderX, g.targetX, ease * 0.35);
          g.renderY = lerp(g.renderY, g.targetY, ease * 0.35);
          break;
        }
        case 'match': {
          g.scale = lerp(1, 1.3, easeOutQuad(Math.min(t * 2, 1)));
          g.opacity = lerp(1, 0, easeOutQuad(Math.max(0, t * 2 - 1)));
          break;
        }
        case 'spawn': {
          g.scale = lerp(0, 1, easeOutBack(t));
          g.opacity = g.type === -1 ? 0.2 : lerp(0, 1, easeOutQuad(t));
          g.renderY = lerp(g.renderY, g.targetY, easeOutBack(t) * 0.35);
          break;
        }
      }

      if (g.animProgress >= 1) {
        g.animType = 'idle';
        g.renderX = g.targetX;
        g.renderY = g.targetY;
        g.scale = 1;
        g.opacity = g.type === -1 ? 0.2 : 1;
      }
    }

    // Only redraw when animating, dragging, or dirty
    if (!animating && !drag && !needsDrawRef.current) {
      rafRef.current = requestAnimationFrame(render);
      return;
    }
    needsDrawRef.current = animating || !!drag;

    // Clear + background
    ctx.fillStyle = '#141f0a';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const pos = Math.round(i * cell * dpr) + 0.5;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(W, pos);
      ctx.stroke();
    }

    // Draw all gems (except dragged)
    for (let i = 0; i < gems.length; i++) {
      if (drag && i === drag.idx) continue;
      const g = gems[i];
      const isTarget = drag?.targetIdx === i;
      if (isTarget) {
        drawGem(ctx, g.type, g.renderX, g.renderY, cell, 0.88, 0.65, false);
        drawGem(ctx, g.type, g.renderX, g.renderY, cell, g.scale, g.opacity, true);
      } else {
        drawGem(ctx, g.type, g.renderX, g.renderY, cell, g.scale, g.opacity, false);
      }
    }

    // Draw dragged gem last (on top)
    if (drag && gems[drag.idx]) {
      const g = gems[drag.idx];
      drawGem(
        ctx, g.type,
        g.renderX + drag.offsetX,
        g.renderY + drag.offsetY,
        cell, 1.18, 1, false,
      );
    }

    rafRef.current = requestAnimationFrame(render);
  }, [drawGem]);

  // ── Pointer hit-test ──
  const getHit = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const cell = cellRef.current;
    const col = Math.floor((clientX - rect.left) / cell);
    const row = Math.floor((clientY - rect.top) / cell);
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
    return { row, col, idx: row * 8 + col };
  }, []);

  // ── Pointer event handlers (attached natively, not through React) ──
  const onPointerDown = useCallback((e: PointerEvent) => {
    if (disabled || !onSwap) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const hit = getHit(e.clientX, e.clientY);
    if (!hit) return;
    hapticLight();
    dragRef.current = {
      ...hit,
      startX: e.clientX, startY: e.clientY,
      offsetX: 0, offsetY: 0,
      targetIdx: null, fired: false,
    };
    needsDrawRef.current = true;
  }, [disabled, onSwap, getHit]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.fired) return;
    const cell = cellRef.current;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const maxOff = cell * 0.85;
    drag.offsetX = Math.max(-maxOff, Math.min(maxOff, dx));
    drag.offsetY = Math.max(-maxOff, Math.min(maxOff, dy));

    if (Math.sqrt(dx * dx + dy * dy) > 10 && drag.targetIdx === null) {
      const horiz = Math.abs(dx) >= Math.abs(dy);
      let toRow = drag.row, toCol = drag.col;
      if (horiz) toCol = dx > 0 ? drag.col + 1 : drag.col - 1;
      else toRow = dy > 0 ? drag.row + 1 : drag.row - 1;
      if (toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8) {
        drag.targetIdx = toRow * 8 + toCol;
      }
    }
    needsDrawRef.current = true;
  }, []);

  const onPointerUp = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.targetIdx !== null && !drag.fired && onSwap) {
      drag.fired = true;
      hapticMedium();
      onSwap(drag.idx, drag.targetIdx);
    }
    // Snap back
    drag.offsetX = 0;
    drag.offsetY = 0;
    needsDrawRef.current = true;
    setTimeout(() => { dragRef.current = null; needsDrawRef.current = true; }, 120);
  }, [onSwap]);

  // ── Lifecycle: setup canvas, events, RAF, resize observer ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resizeCanvas();
    initGems(board);

    canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    rafRef.current = requestAnimationFrame(render);

    const ro = new ResizeObserver(() => {
      resizeCanvas();
      // Re-calc gem target positions after resize
      const cell = cellRef.current;
      gemsRef.current.forEach((g, idx) => {
        const row = Math.floor(idx / 8);
        const col = idx % 8;
        g.targetX = col * cell;
        g.targetY = row * cell;
        g.renderX = g.targetX;
        g.renderY = g.targetY;
      });
      needsDrawRef.current = true;
    });
    ro.observe(canvas.parentElement!);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      ro.disconnect();
    };
  }, [resizeCanvas, initGems, onPointerDown, onPointerMove, onPointerUp, render, board]);

  // ── React to board changes from server ──
  useEffect(() => {
    if (!board.length || board.length !== 64) return;
    const prev = prevBoardRef.current;
    const cell = cellRef.current;
    const gems = gemsRef.current;

    // First-time init
    if (gems.length !== 64) {
      initGems(board);
      return;
    }

    let changed = false;
    for (let i = 0; i < 64; i++) {
      if (prev[i] !== board[i]) {
        changed = true;
        const g = gems[i];
        const row = Math.floor(i / 8);
        const col = i % 8;
        g.type = board[i];
        g.targetX = col * cell;
        g.targetY = row * cell;
        // Spawn animation: fall from above
        g.renderX = g.targetX;
        g.renderY = g.targetY - cell * 2;
        g.scale = 0;
        g.opacity = 0;
        g.animType = 'spawn';
        g.animProgress = 0;
      }
    }
    if (changed) {
      prevBoardRef.current = [...board];
      needsDrawRef.current = true;
    }
  }, [board, initGems]);

  return { canvasRef };
}
