// ═══════════════════════════════════════════════════════════════
// AutoPlayToggle — auto-play button with per-level visual identity
// 5 levels × 5 distinct colors/icons/glows for instant recognition
// ═══════════════════════════════════════════════════════════════

interface Props {
  isActive: boolean;
  onToggle: () => void;
  vipLevel: number;           // 1-5
  dodgeFreeRemaining: number;
  currentSituation?: string;
  /** Compact mode: smaller button for inline use in skill bar row */
  compact?: boolean;
}

interface LevelConfig {
  bg: string;
  bgActive: string;
  border: string;
  borderActive: string;
  glow: string;
  icon: string;
  iconActive: string;
  name: string;
  nameShort: string;
  algorithm: string;
  showDodge: boolean;
  pulseSpeed?: string;
  hasShimmer: boolean;
}

const LEVEL_CONFIG: Record<number, LevelConfig> = {
  1: {
    bg: 'rgba(107,114,128,0.3)',
    bgActive: 'rgba(107,114,128,0.85)',
    border: '#9CA3AF',
    borderActive: '#D1D5DB',
    glow: 'none',
    icon: '\u{1F916}',     // 🤖
    iconActive: '\u{1F916}',
    name: 'Random',
    nameShort: 'Lv.1',
    algorithm: 'Random',
    showDodge: false,
    hasShimmer: false,
  },
  2: {
    bg: 'rgba(59,130,246,0.2)',
    bgActive: 'rgba(59,130,246,0.9)',
    border: '#60A5FA',
    borderActive: '#93C5FD',
    glow: '0 0 10px rgba(59,130,246,0.5)',
    icon: '\u{1F9E0}',     // 🧠
    iconActive: '\u{1F9E0}',
    name: 'Greedy',
    nameShort: 'Lv.2',
    algorithm: 'Greedy',
    showDodge: false,
    hasShimmer: false,
  },
  3: {
    bg: 'rgba(139,92,246,0.2)',
    bgActive: 'rgba(139,92,246,0.9)',
    border: '#A78BFA',
    borderActive: '#C4B5FD',
    glow: '0 0 14px rgba(139,92,246,0.6)',
    icon: '\u26A1',         // ⚡
    iconActive: '\u26A1',
    name: 'Cascade',
    nameShort: 'Lv.3',
    algorithm: 'Cascade',
    showDodge: true,
    pulseSpeed: '2s',
    hasShimmer: false,
  },
  4: {
    bg: 'rgba(245,158,11,0.2)',
    bgActive: 'linear-gradient(135deg, rgba(245,158,11,0.9), rgba(239,68,68,0.9))',
    border: '#FBBF24',
    borderActive: '#FCD34D',
    glow: '0 0 18px rgba(245,158,11,0.6)',
    icon: '\u{1F3AF}',     // 🎯
    iconActive: '\u{1F3AF}',
    name: 'MCTS',
    nameShort: 'Lv.4',
    algorithm: 'MCTS\u00B730',
    showDodge: true,
    pulseSpeed: '1.5s',
    hasShimmer: false,
  },
  5: {
    bg: 'rgba(236,72,153,0.2)',
    bgActive: 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(236,72,153,0.9), rgba(139,92,246,0.9))',
    border: '#F472B6',
    borderActive: '#F9A8D4',
    glow: '0 0 22px rgba(236,72,153,0.7)',
    icon: '\u{1F9E0}',     // 🧠
    iconActive: '\u{1F9E0}\u2728', // 🧠✨
    name: 'Elite',
    nameShort: 'Lv.5',
    algorithm: 'MCTS\u00B780',
    showDodge: true,
    pulseSpeed: '1s',
    hasShimmer: true,
  },
};

export default function AutoPlayToggle({
  isActive, onToggle, vipLevel, dodgeFreeRemaining, currentSituation, compact,
}: Props) {
  const cfg = LEVEL_CONFIG[vipLevel] ?? LEVEL_CONFIG[1];

  // --- COMPACT OFF state ---
  if (compact && !isActive) {
    return (
      <button
        onClick={onToggle}
        className="flex-shrink-0 flex items-center justify-center transition-transform active:scale-95 grayscale brightness-75"
        style={{ width: 42, height: 42 }}
      >
        <img src="/assets/battle/btn_ai.png" alt="AI Auto Off" className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
      </button>
    );
  }

  // --- COMPACT ON state ---
  if (compact && isActive) {
    return (
      <button
        onClick={onToggle}
        className="flex-shrink-0 flex items-center justify-center transition-transform active:scale-95 relative"
        style={{ width: 42, height: 42 }}
      >
        <span className="absolute inset-0 rounded-full animate-ping pointer-events-none" style={{ background: 'rgba(255,255,255,0.2)' }} />
        <img src="/assets/battle/btn_ai.png" alt="AI Auto On" className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(100,200,255,0.7)] z-10 relative" />
      </button>
    );
  }

  // --- OFF state ---
  if (!isActive) {
    return (
      <button
        onClick={onToggle}
        className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95"
        style={{
          width: 130,
          minHeight: 42,
          background: cfg.bg,
          border: `1.5px dashed ${cfg.border}60`,
          padding: '5px 10px',
        }}
      >
        <span className="flex items-center gap-1.5" style={{ color: cfg.border }}>
          <span className="text-sm">{cfg.icon}</span>
          <span className="text-[12px] font-bold tracking-wide">AUTO AI</span>
        </span>
        <span className="text-[10px] font-semibold mt-0.5" style={{ color: `${cfg.border}CC` }}>
          {cfg.nameShort} {cfg.name}
        </span>
      </button>
    );
  }

  // --- ON state ---
  return (
    <button
      onClick={onToggle}
      className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 relative overflow-hidden"
      style={{
        width: 140,
        minHeight: 46,
        background: cfg.bgActive,
        border: `2px solid ${cfg.borderActive}`,
        boxShadow: cfg.glow,
        padding: '5px 10px',
        color: 'white',
        ...(cfg.pulseSpeed ? {
          animation: `auto-pulse ${cfg.pulseSpeed} ease-in-out infinite`,
        } : {}),
      }}
    >
      {/* Pulse ring (Lv3+) */}
      {vipLevel >= 3 && (
        <span
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            border: `2px solid ${cfg.borderActive}`,
            opacity: 0.4,
            animation: `ping ${cfg.pulseSpeed ?? '2s'} cubic-bezier(0, 0, 0.2, 1) infinite`,
          }}
        />
      )}

      {/* Shimmer overlay (Lv5) */}
      {cfg.hasShimmer && (
        <span
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s linear infinite',
          }}
        />
      )}

      {/* Line 1: Icon + Level label */}
      <span className="flex items-center gap-1.5 relative z-10">
        <span className="text-sm">{cfg.iconActive}</span>
        <span className="text-[12px] font-black tracking-wide">
          AI {cfg.nameShort}
        </span>
      </span>

      {/* Line 2: Algorithm + Dodge counter */}
      <span className="flex items-center gap-1.5 text-[9px] font-bold mt-0.5 relative z-10 opacity-90">
        <span className="px-1.5 py-0.5 rounded bg-white/20">
          {cfg.algorithm}
        </span>
        {cfg.showDodge && (
          <span className={`px-1.5 py-0.5 rounded ${dodgeFreeRemaining > 0 ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'
            }`}>
            {dodgeFreeRemaining > 0 ? '\u{1F7E2}' : '\u{1F534}'} {dodgeFreeRemaining}
          </span>
        )}
      </span>

      {/* Line 3: Situation indicator (Lv3+ when active) */}
      {vipLevel >= 3 && currentSituation && currentSituation !== 'normal' && (
        <span className="text-[8px] font-medium mt-0.5 relative z-10 opacity-75 truncate max-w-[120px]">
          {currentSituation === 'tank' ? '\u{1F6E1}\uFE0F tank \u2192 \u2B50 Star'
            : currentSituation === 'heal' ? '\u{1FA79} heal \u2192 \u2694\uFE0F rush'
              : currentSituation === 'assassin' ? '\u{1F5E1}\uFE0F assassin \u2192 \u{1F6E1}\uFE0F DEF'
                : currentSituation === 'enrage' ? '\u{1F525} enrage \u2192 \u26A1 burst'
                  : currentSituation}
        </span>
      )}
    </button>
  );
}
