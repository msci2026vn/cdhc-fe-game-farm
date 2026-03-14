import { useState, useEffect } from 'react';

export interface ActiveEffect {
  id: string;
  type: string;
  target: 'self' | 'opponent';
  durationMs?: number;
  startedAt: number;
  data?: Record<string, unknown>;
}

interface SkillOverlayProps {
  effects: ActiveEffect[];
}

export function PvpSkillOverlay({ effects }: SkillOverlayProps) {
  return (
    <>
      {effects.map(eff => (
        <SkillEffectRenderer key={eff.id} effect={eff} />
      ))}
    </>
  );
}

function SkillEffectRenderer({ effect }: { effect: ActiveEffect }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!effect.durationMs) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - effect.startedAt;
      setProgress(Math.min(100, (elapsed / effect.durationMs!) * 100));
    }, 100);
    return () => clearInterval(interval);
  }, [effect.durationMs, effect.startedAt]);

  switch (effect.type) {
    case 'man_dem':
      return <ManDemOverlay target={effect.target} />;
    case 'phong_an':
      return <PhongAnOverlay target={effect.target} zone={effect.data?.zone as number[] | undefined} />;
    case 'troi_buoc':
      return <TroiBuocOverlay target={effect.target} progress={progress} />;
    case 'ot_hiem':
      return <OtHiemOverlay target={effect.target} />;
    case 'tang_toc':
      return <TangTocOverlay target={effect.target} />;
    case 'sam_dong':
      return <SamDongFlash />;
    case 'mua_da':
      return <MuaDaParticles />;
    case 'thien_thach':
      return <ThienThachFlash />;
    default:
      return null;
  }
}

// Blackout overlay
function ManDemOverlay({ target }: { target: string }) {
  if (target !== 'self') return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: 'rgba(0,0,0,0.92)', borderRadius: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 4,
      animation: 'pvpFadeIn 0.3s ease-out',
    }}>
      <span style={{ fontSize: 40 }}>&#127761;</span>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700 }}>
        Man Dem!
      </span>
    </div>
  );
}

// Lock zone overlay
function PhongAnOverlay({ target, zone }: { target: string; zone?: number[] }) {
  if (target !== 'self' || !zone) return null;
  const cellSize = 'calc(100% / 8)';
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, zIndex: 30,
      width: `calc(${cellSize} * 3)`, height: `calc(${cellSize} * 3)`,
      border: '2px solid rgba(239,68,68,0.7)',
      background: 'rgba(239,68,68,0.15)',
      borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'pvpPulse 1.5s ease-in-out infinite',
    }}>
      <span style={{ fontSize: 22 }}>&#128274;</span>
    </div>
  );
}

// Slow indicator
function TroiBuocOverlay({ target, progress }: { target: string; progress: number }) {
  if (target !== 'self') return null;
  return (
    <div style={{
      position: 'absolute', top: 6, left: 6, zIndex: 30,
      background: 'rgba(17,24,39,0.85)', padding: '4px 10px',
      borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
      animation: 'pvpSlideIn 0.3s ease-out',
    }}>
      <span style={{ fontSize: 14 }}>&#9939;&#65039;</span>
      <div style={{ width: 48, height: 4, background: '#374151', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#60a5fa', borderRadius: 2,
          width: `${100 - progress}%`, transition: 'width 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 10, color: '#93c5fd', fontWeight: 700 }}>Cham</span>
    </div>
  );
}

// Armor debuff
function OtHiemOverlay({ target }: { target: string }) {
  if (target !== 'self') return null;
  return (
    <div style={{
      position: 'absolute', top: 6, right: 6, zIndex: 30,
      background: 'rgba(127,29,29,0.85)', padding: '3px 8px',
      borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4,
      animation: 'pvpSlideIn 0.3s ease-out',
    }}>
      <span style={{ fontSize: 12 }}>&#127798;&#65039;</span>
      <span style={{ fontSize: 10, color: '#fca5a5', fontWeight: 700 }}>-50% Giap</span>
    </div>
  );
}

// Speed buff
function TangTocOverlay({ target }: { target: string }) {
  if (target !== 'self') return null;
  return (
    <div style={{
      position: 'absolute', top: 6, right: 6, zIndex: 30,
      background: 'rgba(113,63,18,0.85)', padding: '3px 8px',
      borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4,
      animation: 'pvpSlideIn 0.3s ease-out',
    }}>
      <span style={{ fontSize: 12 }}>&#9889;</span>
      <span style={{ fontSize: 10, color: '#fde68a', fontWeight: 700 }}>Tang Toc!</span>
    </div>
  );
}

// Lightning flash
function SamDongFlash() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 800);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none',
      animation: 'pvpFlash 0.8s ease-out',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,204,21,0.25)', borderRadius: 14 }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)', fontSize: 56,
      }}>
        &#9889;
      </div>
    </div>
  );
}

// Falling ice particles
function MuaDaParticles() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      pointerEvents: 'none', overflow: 'hidden', borderRadius: 14,
    }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 10, height: 10,
            background: 'rgba(147,197,253,0.6)',
            borderRadius: 3,
            left: `${10 + Math.random() * 80}%`,
            animation: `pvpFallDown ${0.6 + Math.random() * 0.4}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

// Meteor impact
function ThienThachFlash() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none',
      animation: 'pvpFlash 1s ease-out',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(249,115,22,0.2)', borderRadius: 14 }} />
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%,-50%)', fontSize: 48,
      }}>
        &#9732;&#65039;
      </div>
    </div>
  );
}
