// ═══════════════════════════════════════════════════════════════
// CampaignSkillButton — Active skill button with cooldown ring
// Used for Ớt Hiểm + Rơm Bọc in campaign combat
// ═══════════════════════════════════════════════════════════════

import { playSound } from '@/shared/audio';

interface CampaignSkillButtonProps {
  skillId: 'ot_hiem' | 'rom_boc';
  emoji: string;
  label: string;
  level: number; // 0 = locked, 1-5
  isActive: boolean; // buff currently running
  cooldownRemaining: number; // seconds left
  cooldownTotal: number; // total cooldown seconds
  durationRemaining: number; // seconds of buff left
  onCast: () => void;
  disabled?: boolean;
}

export default function CampaignSkillButton({
  skillId, emoji, label, level, isActive, cooldownRemaining, cooldownTotal,
  durationRemaining, onCast, disabled,
}: CampaignSkillButtonProps) {
  const isLocked = level === 0;
  const onCooldown = cooldownRemaining > 0;
  const isReady = !isLocked && !onCooldown && !isActive && !disabled;

  const colors = {
    ot_hiem: {
      gradient: 'linear-gradient(135deg, #e74c3c, #ff6b6b)',
      glow: 'rgba(231,76,60,0.5)',
      activeGlow: '0 0 20px rgba(231,76,60,0.6), 0 0 40px rgba(231,76,60,0.3)',
    },
    rom_boc: {
      gradient: 'linear-gradient(135deg, #27ae60, #55efc4)',
      glow: 'rgba(39,174,96,0.5)',
      activeGlow: '0 0 20px rgba(39,174,96,0.6), 0 0 40px rgba(39,174,96,0.3)',
    },
  };

  const c = colors[skillId];

  // Cooldown percentage for radial sweep
  const cooldownPct = onCooldown && cooldownTotal > 0
    ? (cooldownRemaining / cooldownTotal) * 100
    : 0;

  return (
    <button
      onClick={() => {
        if (!isReady) return;
        playSound('ui_click');
        onCast();
      }}
      disabled={!isReady}
      className={`
        relative min-w-[70px] h-[42px] rounded-xl font-heading text-[10px] font-bold
        flex items-center justify-center gap-1 transition-all overflow-hidden
        ${isActive
          ? 'text-white scale-105 ring-2 ring-white/50'
          : isReady
            ? 'text-white active:scale-95'
            : 'text-white/40 opacity-60'
        }
      `}
      style={{
        background: isLocked
          ? 'rgba(255,255,255,0.05)'
          : isActive || isReady
            ? c.gradient
            : 'rgba(255,255,255,0.08)',
        boxShadow: isActive
          ? c.activeGlow
          : isReady
            ? `0 4px 12px ${c.glow}`
            : 'none',
      }}
    >
      {/* Cooldown overlay with radial sweep */}
      {onCooldown && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center"
          style={{
            background: `conic-gradient(rgba(0,0,0,0.7) ${cooldownPct}%, transparent ${cooldownPct}%)`,
          }}>
          <span className="font-heading text-sm font-bold text-white/80 z-10">
            {cooldownRemaining}s
          </span>
        </div>
      )}

      {/* Active buff duration indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="h-full transition-all duration-1000"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.8)',
              animation: `shrink-bar ${durationRemaining}s linear forwards`,
            }} />
        </div>
      )}

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <span className="text-sm">🔒</span>
        </div>
      )}

      {/* Content (hidden behind cooldown/locked overlays) */}
      {!onCooldown && !isLocked && (
        <>
          <span className="text-base">{emoji}</span>
          <div className="flex flex-col items-start leading-tight">
            <span>{label}</span>
            {level > 0 && (
              <span className="text-[7px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Lv.{level}
              </span>
            )}
          </div>
        </>
      )}

      {/* Active pulse animation */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl animate-pulse"
          style={{ background: 'rgba(255,255,255,0.1)' }} />
      )}
    </button>
  );
}
