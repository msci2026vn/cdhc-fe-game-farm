// ═══════════════════════════════════════════════════════════════
// UltimateFlash — fullscreen "ULTIMATE!" flash effect
// ═══════════════════════════════════════════════════════════════

export default function UltimateFlash() {
  return (
    <div className="absolute inset-0 z-[60] pointer-events-none">
      <div className="absolute inset-0 animate-ult-flash" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-scale-in">
        <img 
          src="/assets/battle/notice_7.png" 
          alt="Ultimate" 
          className="w-[320px] h-auto object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]" 
        />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} className="absolute animate-sparkle-up text-2xl pointer-events-none"
          style={{ left: `${15 + i * 20}%`, top: `${25 + (i % 2) * 30}%`, animationDelay: `${i * 0.15}s` }}>
          {['⚡', '💜', '✨', '💎'][i]}
        </span>
      ))}
    </div>
  );
}
