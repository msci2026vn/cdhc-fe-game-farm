// ═══════════════════════════════════════════════════════════════
// BossAttackFlash — Boss attack visual + dodge indicator
// ═══════════════════════════════════════════════════════════════

interface Props {
  text: string;
  emoji: string;
}

export default function BossAttackFlash({ text, emoji }: Props) {
  const isDodge = emoji === '💨';
  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <div className={`absolute inset-0 ${isDodge ? '' : 'animate-boss-atk-flash'}`}
        style={{ background: isDodge ? 'rgba(85,239,196,0.1)' : 'transparent' }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="px-6 py-3 rounded-2xl font-heading font-bold text-white text-center animate-scale-in"
          style={{
            background: isDodge ? 'rgba(85,239,196,0.9)' : 'rgba(231,76,60,0.95)',
            boxShadow: isDodge ? '0 0 30px rgba(85,239,196,0.5)' : '0 0 50px rgba(231,76,60,0.7)',
          }}>
          <span className="text-4xl block mb-1 animate-boss-idle">{emoji}</span>
          <span className="text-sm">{text}</span>
        </div>
      </div>
      {!isDodge && Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className="absolute animate-sparkle-up text-xl pointer-events-none"
          style={{ left: `${20 + i * 25}%`, top: `${35 + (i % 2) * 20}%`, animationDelay: `${i * 0.1}s` }}>
          {['💥', '🔥', '⚡'][i]}
        </span>
      ))}
    </div>
  );
}
