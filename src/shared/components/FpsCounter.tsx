// ═══════════════════════════════════════════════════════
// FpsCounter — đo FPS thực tế qua requestAnimationFrame
// Hiển thị góc trên-trái, màu đổi theo ngưỡng:
//   ≥ 55fps  → xanh (tốt)
//   ≥ 30fps  → vàng (chấp nhận)
//   < 30fps  → đỏ (lag)
// ═══════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';

export default function FpsCounter() {
  const [fps, setFps] = useState<number | null>(null);
  const frameTimesRef = useRef<number[]>([]);
  const rafRef = useRef<number>();
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const tick = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Keep last 30 frame deltas (≈ 0.5s window)
      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 30) {
        frameTimesRef.current.shift();
      }

      // Update display every 20 frames
      if (frameTimesRef.current.length % 20 === 0) {
        const avgDelta =
          frameTimesRef.current.reduce((a, b) => a + b, 0) /
          frameTimesRef.current.length;
        const currentFps = Math.round(1000 / avgDelta);
        setFps(Math.min(currentFps, 120)); // cap display at 120
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (fps === null) return null;

  const color =
    fps >= 55 ? '#00ff88'   // xanh → mượt
    : fps >= 30 ? '#ffcc00' // vàng → chấp nhận
    : '#ff4444';            // đỏ → lag

  const label =
    fps >= 55 ? '●' : fps >= 30 ? '◐' : '○';

  return (
    <div
      style={{
        position: 'fixed',
        top: 6,
        left: 6,
        zIndex: 9999,
        pointerEvents: 'none',
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 700,
        color,
        background: 'rgba(0,0,0,0.55)',
        borderRadius: 4,
        padding: '2px 6px',
        lineHeight: 1.4,
        letterSpacing: 0.5,
        userSelect: 'none',
      }}
    >
      {label} {fps} fps
    </div>
  );
}
