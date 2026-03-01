// ═══════════════════════════════════════════════════════════════
// AutoPlayToggle — auto-play button with per-level visual identity
// ═══════════════════════════════════════════════════════════════

interface Props {
  isActive: boolean;
  onToggle: () => void;
  vipLevel: number;
  dodgeFreeRemaining: number;
  currentSituation?: string;
}

interface LevelStyle {
  bg: string;
  bgActive: string;
  border: string;
  glow: string;
  icon: string;
  label: string;
  badgeColor: string;
}

const LEVEL_STYLES: Record<number, LevelStyle> = {
  1: {
    bg: 'rgba(107,114,128,0.25)',
    bgActive: 'linear-gradient(135deg, #6B7280, #4B5563)',
    border: '#9CA3AF',
    glow: 'rgba(107,114,128,0.4)',
    icon: '🤖',
    label: 'AUTO',
    badgeColor: '#9CA3AF',
  },
  2: {
    bg: 'rgba(59,130,246,0.2)',
    bgActive: 'linear-gradient(135deg, #3B82F6, #2563EB)',
    border: '#60A5FA',
    glow: 'rgba(59,130,246,0.5)',
    icon: '🧠',
    label: 'AUTO',
    badgeColor: '#60A5FA',
  },
  3: {
    bg: 'rgba(139,92,246,0.2)',
    bgActive: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    border: '#A78BFA',
    glow: 'rgba(139,92,246,0.5)',
    icon: '⚡',
    label: 'AI',
    badgeColor: '#A78BFA',
  },
  4: {
    bg: 'rgba(245,158,11,0.2)',
    bgActive: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    border: '#FBBF24',
    glow: 'rgba(245,158,11,0.5)',
    icon: '🎯',
    label: 'AI',
    badgeColor: '#FBBF24',
  },
  5: {
    bg: 'rgba(239,68,68,0.2)',
    bgActive: 'linear-gradient(135deg, #EF4444, #EC4899, #8B5CF6)',
    border: '#F472B6',
    glow: 'rgba(236,72,153,0.6)',
    icon: '🧠',
    label: 'AI',
    badgeColor: '#F472B6',
  },
};

export default function AutoPlayToggle({
  isActive, onToggle, vipLevel, dodgeFreeRemaining,
}: Props) {
  const style = LEVEL_STYLES[vipLevel] ?? LEVEL_STYLES[1];

  return (
    <button
      onClick={onToggle}
      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 relative overflow-hidden"
      style={isActive ? {
        background: style.bgActive,
        boxShadow: `0 0 14px ${style.glow}, 0 0 4px ${style.glow}`,
        border: `1.5px solid rgba(255,255,255,0.3)`,
        color: 'white',
      } : {
        background: style.bg,
        border: `1.5px dashed ${style.border}50`,
        color: `${style.border}`,
      }}
    >
      {/* Pulse ring when active (Lv3+) */}
      {isActive && vipLevel >= 3 && (
        <span
          className="absolute inset-0 rounded-lg animate-ping pointer-events-none"
          style={{
            border: `2px solid ${style.glow}`,
            opacity: 0.3,
            animationDuration: vipLevel >= 5 ? '1.5s' : '2s',
          }}
        />
      )}

      {/* Icon */}
      <span className={`text-[13px] ${isActive ? 'animate-bounce' : ''}`}
        style={{ animationDuration: '2s' }}>
        {style.icon}
      </span>

      {/* Label */}
      <span className="tracking-wide">{isActive ? style.label : 'AUTO'}</span>

      {/* Level badge */}
      <span
        className="text-[8px] px-1.5 py-0.5 rounded font-black leading-none"
        style={isActive ? {
          background: 'rgba(255,255,255,0.25)',
          color: 'white',
        } : {
          background: `${style.badgeColor}25`,
          color: style.badgeColor,
        }}
      >
        {vipLevel}
      </span>

      {/* Dodge counter when active */}
      {isActive && dodgeFreeRemaining > 0 && (
        <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-green-500/30 text-green-200 leading-none">
          {dodgeFreeRemaining}
        </span>
      )}

      {/* Lv5 shimmer overlay */}
      {isActive && vipLevel >= 5 && (
        <span
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
          }}
        />
      )}
    </button>
  );
}
