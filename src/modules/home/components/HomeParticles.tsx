import { memo } from 'react';

/**
 * HomeParticles — lightweight CSS-only particle overlay for the main menu.
 *
 * Design constraints (optimised for low-end mobile):
 *  • Only `transform` + `opacity` animated → GPU-composited, zero layout reflow
 *  • No JS animation loop — pure CSS @keyframes
 *  • Total DOM nodes: 7 stars + 5 leaves = 12 elements
 *  • No `will-change` (wastes GPU memory on weak devices)
 *  • Long durations (7–12 s) keep frame-rate stress low
 *  • Negative animation-delay pre-distributes particles vertically at load
 *  • respects `prefers-reduced-motion`
 */

/* ---------- Static data (no runtime randomness = predictable perf) ---------- */

const STARS: { sz: number; l: string; d: string; off: string }[] = [
  { sz: 3, l: '7%',  d: '7s',   off: '-1s'   },
  { sz: 2, l: '21%', d: '9s',   off: '-3.5s' },
  { sz: 3, l: '38%', d: '8s',   off: '-6s'   },
  { sz: 2, l: '55%', d: '10s',  off: '-2s'   },
  { sz: 4, l: '71%', d: '7.5s', off: '-5s'   },
  { sz: 2, l: '86%', d: '9.5s', off: '-1.5s' },
  { sz: 3, l: '47%', d: '8.5s', off: '-7s'   },
];

const LEAVES: { e: string; sz: number; l: string; d: string; off: string }[] = [
  { e: '🍂', sz: 15, l: '4%',  d: '9s',   off: '-2s'   },
  { e: '🍃', sz: 13, l: '29%', d: '11s',  off: '-5s'   },
  { e: '🍂', sz: 16, l: '54%', d: '10s',  off: '-8s'   },
  { e: '🍃', sz: 12, l: '77%', d: '12s',  off: '-3s'   },
  { e: '🍂', sz: 14, l: '92%', d: '9.5s', off: '-6.5s' },
];

/* ---------- Injected styles (single <style> tag) ---------- */

const CSS = `
@keyframes hp-star {
  0%   { transform: translateY(-14px) translateX(0);          opacity: 0;    }
  7%   { opacity: 0.95; }
  88%  { opacity: 0.7;  }
  100% { transform: translateY(calc(100vh + 14px)) translateX(16px); opacity: 0; }
}
@keyframes hp-leaf {
  0%   { transform: translateY(-30px) translateX(0)    rotate(-8deg);   opacity: 0;    }
  8%   { opacity: 0.85; }
  45%  { transform: translateY(37vh)  translateX(28px)  rotate(130deg);  opacity: 0.7;  }
  75%  { transform: translateY(70vh)  translateX(-6px)  rotate(215deg);  opacity: 0.5;  }
  92%  { opacity: 0.3;  }
  100% { transform: translateY(calc(100vh + 40px)) translateX(10px) rotate(315deg); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .hp-star, .hp-leaf { animation: none !important; display: none !important; }
}
`;

/* ---------- Component ---------- */

export const HomeParticles = memo(function HomeParticles() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 15 }}
    >
      <style>{CSS}</style>

      {/* Stars — tiny golden glowing dots */}
      {STARS.map((s, i) => (
        <div
          key={`s${i}`}
          className="hp-star"
          style={{
            position: 'absolute',
            left: s.l,
            top: 0,
            width:  s.sz,
            height: s.sz,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #fffde7, #ffc107)',
            boxShadow: `0 0 ${s.sz + 3}px 1px rgba(255,200,40,0.65)`,
            animation: `hp-star ${s.d} ${s.off} infinite linear`,
          }}
        />
      ))}

      {/* Autumn leaves — emoji drifting on the wind */}
      {LEAVES.map((l, i) => (
        <div
          key={`l${i}`}
          className="hp-leaf"
          style={{
            position: 'absolute',
            left: l.l,
            top: 0,
            fontSize: l.sz,
            lineHeight: 1,
            animation: `hp-leaf ${l.d} ${l.off} infinite ease-in-out`,
          }}
        >
          {l.e}
        </div>
      ))}
    </div>
  );
});
