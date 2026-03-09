// ═══════════════════════════════════════════════════════════════
// SkillButton — Dodge/ULT button with ready/no-mana/cooldown states
// ═══════════════════════════════════════════════════════════════

import { playSound } from '@/shared/audio';

interface SkillButtonProps {
  icon: string;
  label: string;
  manaCost: number;
  currentMana: number;
  onUse: () => void;
  variant: 'dodge' | 'ult';
  /** Is dodge window currently active? (dodge only) */
  isDodgeWindow?: boolean;
  /** ULT charge 0-100 (ult only) */
  ultCharge?: number;
  /** Cooldown turns remaining */
  cooldown?: number;
  disabled?: boolean;
}

export default function SkillButton({
  icon, label, manaCost, currentMana, onUse,
  variant, isDodgeWindow, ultCharge, cooldown, disabled,
}: SkillButtonProps) {
  const hasMana = currentMana >= manaCost;
  const ultReady = variant === 'ult' ? (ultCharge ?? 0) >= 100 : true;
  const onCooldown = (cooldown ?? 0) > 0;
  const isReady = hasMana && ultReady && !onCooldown && !disabled;

  // Dodge button glows during dodge window
  const isDodgeActive = variant === 'dodge' && isDodgeWindow && hasMana;

  const gradients: Record<string, string> = {
    dodge: 'linear-gradient(135deg, #0984e3, #74b9ff)',
    ult: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  };

  const activeGradient = isDodgeActive
    ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
    : gradients[variant];

  return (
    <button
      onClick={() => { playSound('ui_click'); onUse(); }}
      disabled={!isReady && !isDodgeActive}
      className={`
        relative min-w-[80px] h-[38px] rounded-xl font-heading text-[11px] font-bold
        flex items-center justify-center gap-1 transition-all
        ${isDodgeActive
          ? 'animate-bounce text-white scale-110 ring-2 ring-red-500'
          : isReady
            ? 'text-white active:scale-95'
            : 'text-white/40 opacity-50'
        }
      `}
      style={{
        background: isReady || isDodgeActive ? activeGradient : 'rgba(255,255,255,0.08)',
        boxShadow: isDodgeActive
          ? '0 0 25px rgba(231,76,60,0.7), 0 0 50px rgba(231,76,60,0.3)'
          : isReady
            ? `0 4px 12px ${variant === 'ult' ? 'rgba(108,92,231,0.3)' : 'rgba(9,132,227,0.3)'}`
            : 'none',
      }}
    >
      {/* Cooldown overlay */}
      {onCooldown && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <span className="font-heading text-sm font-bold text-white/80">{cooldown}t</span>
        </div>
      )}

      <span className="text-base">{icon}</span>
      <div className="flex flex-col items-start leading-tight">
        <span>{isDodgeActive ? 'NÉ NGAY!' : label}</span>
        <span className="text-[8px] font-semibold" style={{ color: hasMana ? 'rgba(255,255,255,0.6)' : '#ff6b6b' }}>
          {manaCost} 💎
        </span>
      </div>

      {/* ULT charge ring (ult only, not ready yet) */}
      {variant === 'ult' && !ultReady && !onCooldown && (
        <span className="text-[8px] font-bold ml-0.5" style={{ color: '#fdcb6e' }}>
          {ultCharge}%
        </span>
      )}
    </button>
  );
}
