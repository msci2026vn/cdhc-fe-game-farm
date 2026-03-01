// ═══════════════════════════════════════════════════════════════
// AutoPlayToggle — compact auto-play button for combat screens
// ═══════════════════════════════════════════════════════════════

interface Props {
  isActive: boolean;
  onToggle: () => void;
  vipLevel: number;
  dodgeFreeRemaining: number;
  currentSituation?: string;
}

const LEVEL_COLORS: Record<number, string> = {
  1: '#9ca3af', // gray
  2: '#3b82f6', // blue
  3: '#eab308', // yellow
  4: '#f97316', // orange
  5: '#ef4444', // red
};

const LEVEL_NAMES: Record<number, string> = {
  1: 'Free',
  2: 'Basic',
  3: 'Adv',
  4: 'Pro',
  5: 'Elite',
};

export default function AutoPlayToggle({
  isActive, onToggle, vipLevel, dodgeFreeRemaining, currentSituation,
}: Props) {
  const color = LEVEL_COLORS[vipLevel] ?? LEVEL_COLORS[1];

  return (
    <button
      onClick={onToggle}
      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
        isActive
          ? 'text-white'
          : 'bg-white/10 text-white/60 border border-white/10'
      }`}
      style={isActive ? {
        background: `linear-gradient(135deg, ${color}cc, ${color})`,
        boxShadow: `0 0 12px ${color}80`,
      } : undefined}
    >
      <span className={isActive ? 'animate-spin-slow' : ''}>
        {isActive ? '🤖' : '👑'}
      </span>
      <span>AUTO</span>
      <span
        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
        style={{
          background: isActive ? 'rgba(255,255,255,0.25)' : `${color}40`,
          color: isActive ? 'white' : color,
        }}
      >
        Lv{vipLevel}
      </span>
      {isActive && dodgeFreeRemaining > 0 && (
        <span className="text-[9px] text-green-200">
          {dodgeFreeRemaining}
        </span>
      )}
    </button>
  );
}
