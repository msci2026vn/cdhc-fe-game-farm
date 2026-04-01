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
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex items-center justify-center animate-scale-in">
          {!isDodge ? (
            <div className="relative flex items-center justify-center">
              <img
                src="/assets/battle/notice_2.png"
                alt="Boss Attack Notice"
                className="w-[410px] object-contain"
              />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pt-8">
                <span className="text-4xl block mb-0 animate-boss-idle">{emoji}</span>
                {/* Extract only the damage number (e.g., -48) from text */}
                <span className="text-[2.2rem] font-black text-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] font-heading leading-none">
                  {text.match(/-?\d+/) ? text.match(/-?\d+/)?.[0] : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <img
                src="/assets/battle/notice_6.png"
                alt="Dodge Notice"
                className="w-[440px] object-contain"
              />
            </div>
          )}
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
