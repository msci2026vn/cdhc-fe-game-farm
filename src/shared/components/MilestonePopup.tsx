import { useEffect, useState } from 'react';
import type { MilestoneInfo } from '../types/game-api.types';

interface MilestonePopupProps {
  milestone: MilestoneInfo;
  isOpen: boolean;
  onClose: () => void;
}

const STAT_COLORS: Record<string, { gradient: string; glow: string; particles: string[] }> = {
  atk: {
    gradient: 'linear-gradient(135deg, #e74c3c, #ff6b6b)',
    glow: '0 0 40px rgba(231,76,60,0.6)',
    particles: ['⚔️', '🔥', '💥', '⚡'],
  },
  hp: {
    gradient: 'linear-gradient(135deg, #00b894, #55efc4)',
    glow: '0 0 40px rgba(85,239,196,0.6)',
    particles: ['💚', '🌿', '✨', '🍀'],
  },
  def: {
    gradient: 'linear-gradient(135deg, #0984e3, #74b9ff)',
    glow: '0 0 40px rgba(116,185,255,0.6)',
    particles: ['🛡️', '❄️', '💎', '🏰'],
  },
  mana: {
    gradient: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
    glow: '0 0 40px rgba(162,155,254,0.6)',
    particles: ['✨', '💜', '🔮', '🌀'],
  },
};

export function MilestonePopup({ milestone, isOpen, onClose }: MilestonePopupProps) {
  const [particles, setParticles] = useState<{ id: number; char: string; x: number; delay: number }[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onClose, 4000);

    // Spawn particles
    const colors = STAT_COLORS[milestone.stat] ?? STAT_COLORS.atk;
    const spawned = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      char: colors.particles[i % colors.particles.length],
      x: 10 + Math.random() * 80,
      delay: i * 0.15,
    }));
    setParticles(spawned);

    return () => clearTimeout(timer);
  }, [isOpen, onClose, milestone.stat]);

  if (!isOpen) return null;

  const colors = STAT_COLORS[milestone.stat] ?? STAT_COLORS.atk;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 animate-fade-in" onClick={onClose}>
      {/* Floating particles */}
      {particles.map(p => (
        <span key={p.id}
          className="absolute text-2xl animate-sparkle-up pointer-events-none"
          style={{ left: `${p.x}%`, top: '60%', animationDelay: `${p.delay}s` }}>
          {p.char}
        </span>
      ))}

      <div
        className="rounded-2xl p-6 max-w-[320px] w-full mx-4 shadow-2xl text-center relative overflow-hidden"
        style={{ background: '#fff', boxShadow: colors.glow, animation: 'bounceIn 0.4s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-2xl opacity-20"
          style={{ background: colors.gradient }} />

        <div className="relative z-10">
          <div className="text-5xl mb-3 animate-bounce">{milestone.icon}</div>
          <div className="inline-block px-4 py-1 rounded-full text-xs font-bold text-white mb-2"
            style={{ background: colors.gradient }}>
            MILESTONE
          </div>
          <h3 className="font-heading text-lg font-bold mb-1" style={{ color: '#1a1a2e' }}>
            {milestone.name}
          </h3>
          <p className="text-sm text-gray-600 mb-4">{milestone.description}</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white active:scale-95 shadow-lg transition-transform"
            style={{ background: colors.gradient }}
          >
            Tuyet voi!
          </button>
        </div>
      </div>
    </div>
  );
}
