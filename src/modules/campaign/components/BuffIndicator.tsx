// ═══════════════════════════════════════════════════════════════
// BuffIndicator — Shows active player buffs with remaining time
// Displayed during combat above the skill buttons
// ═══════════════════════════════════════════════════════════════

interface BuffInfo {
  icon: string;
  name: string;
  remainingSeconds: number;
  totalSeconds: number;
  description: string;
  type: 'buff' | 'debuff';
  color: string;
}

interface BuffIndicatorProps {
  buffs: BuffInfo[];
}

export default function BuffIndicator({ buffs }: BuffIndicatorProps) {
  if (buffs.length === 0) return null;

  return (
    <div className="flex gap-1 flex-wrap mb-0.5">
      {buffs.map((buff, i) => {
        const pct = buff.totalSeconds > 0
          ? Math.round((buff.remainingSeconds / buff.totalSeconds) * 100)
          : 0;

        return (
          <div
            key={`${buff.name}-${i}`}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold text-white"
            style={{
              background: `${buff.color}30`,
              border: `1px solid ${buff.color}40`,
            }}
          >
            <span className="text-xs">{buff.icon}</span>
            <span style={{ color: buff.color }}>{buff.description}</span>
            {/* Time bar */}
            <div className="w-8 h-1 rounded-full overflow-hidden ml-0.5"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${pct}%`,
                  background: buff.color,
                }}
              />
            </div>
            <span className="text-white/50">{buff.remainingSeconds}s</span>
          </div>
        );
      })}
    </div>
  );
}

export type { BuffInfo };
