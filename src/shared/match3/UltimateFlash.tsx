// ═══════════════════════════════════════════════════════════════
// UltimateFlash — fullscreen "ULTIMATE!" flash effect
// ═══════════════════════════════════════════════════════════════

export default function UltimateFlash() {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 animate-ult-flash" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-scale-in">
        <div className="text-7xl mb-2 text-center animate-boss-idle">⚡</div>
        <div className="px-8 py-4 rounded-2xl font-heading text-2xl font-bold text-white text-center"
          style={{ background: 'linear-gradient(135deg, #6c5ce7, #e056fd, #a29bfe)', boxShadow: '0 0 80px rgba(108,92,231,0.9)' }}>
          ⚡ ULTIMATE! ⚡
        </div>
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
