interface PvpSkillButtonProps {
  skillId: string;
  icon: string;
  name: string;
  manaCost: number;
  currentMana: number;
  cooldownTotal: number;
  cooldownRemaining: number;
  disabled?: boolean;
  onCast: () => void;
}

export function PvpSkillButton({
  icon, name, manaCost, currentMana,
  cooldownTotal, cooldownRemaining, disabled, onCast,
}: PvpSkillButtonProps) {
  const canAfford = currentMana >= manaCost;
  const onCooldown = cooldownRemaining > 0;
  const isReady = canAfford && !onCooldown && !disabled;
  const cooldownPct = onCooldown ? (cooldownRemaining / cooldownTotal) * 100 : 0;

  return (
    <button
      onClick={() => isReady && onCast()}
      disabled={!isReady}
      style={{
        position: 'relative',
        width: 58, height: 58,
        borderRadius: '50%',
        border: `2px solid ${isReady ? '#f59e0b' : '#4b5563'}`,
        background: isReady
          ? 'radial-gradient(circle at 38% 32%, #1a1a2e, #0f1624)'
          : 'rgba(15,22,36,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isReady ? 'pointer' : 'not-allowed',
        opacity: isReady ? 1 : 0.55,
        transition: 'all 0.2s',
        boxShadow: isReady ? '0 0 12px rgba(245,158,11,0.4)' : 'none',
        overflow: 'hidden',
        padding: 0,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      {/* Cooldown conic overlay */}
      {onCooldown && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `conic-gradient(rgba(0,0,0,0.6) ${cooldownPct}%, transparent ${cooldownPct}%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Icon */}
      <span style={{ fontSize: 20, lineHeight: 1, zIndex: 1 }}>{icon}</span>

      {/* Mana cost */}
      <span style={{
        fontSize: 9, zIndex: 1, fontFamily: 'monospace',
        color: canAfford ? '#fbbf24' : '#f87171',
        lineHeight: 1, marginTop: 1,
      }}>
        {manaCost}
      </span>

      {/* Cooldown seconds */}
      {onCooldown && (
        <span style={{
          position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
          fontSize: 10, color: '#fff', fontWeight: 700, zIndex: 2,
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        }}>
          {Math.ceil(cooldownRemaining / 1000)}s
        </span>
      )}

      {/* Ready glow ring */}
      {isReady && (
        <div style={{
          position: 'absolute', inset: -2, borderRadius: '50%',
          border: '2px solid #f59e0b',
          animation: 'skillPulse 2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Tooltip — skill name shown on hover/hold via title */}
      <span style={{ position: 'absolute', inset: 0 }} title={name} />
    </button>
  );
}
