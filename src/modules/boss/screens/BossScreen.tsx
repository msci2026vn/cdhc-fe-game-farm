import ScreenShell from '@/shared/components/ScreenShell';

export default function BossScreen() {
  return (
    <ScreenShell>
      {/* Boss arena */}
      <div className="boss-gradient min-h-[40vh] relative flex flex-col items-center justify-center px-4 py-6">
        {/* Event tag */}
        <div className="absolute top-3 left-4 bg-farm-red/90 text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full">
          🔥 Event Boss Tuần
        </div>

        {/* Boss */}
        <div className="animate-plant-sway">
          <span className="text-8xl block drop-shadow-lg">🐛</span>
        </div>
        <h2 className="font-heading font-bold text-lg text-primary-foreground mt-2">Sâu Đục Thân</h2>

        {/* HP bar */}
        <div className="w-full max-w-[280px] mt-3">
          <div className="flex justify-between text-xs text-primary-foreground/70 mb-1 font-semibold">
            <span>HP</span>
            <span>63,000 / 100,000</span>
          </div>
          <div className="h-3 bg-boss-dark rounded-full overflow-hidden border border-farm-red/30">
            <div
              className="h-full bg-gradient-to-r from-farm-red to-secondary rounded-full transition-all"
              style={{ width: '63%' }}
            />
          </div>
        </div>
      </div>

      {/* Gem grid placeholder */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 36 }).map((_, i) => {
            const gems = ['⚔️', '💚', '🛡️', '⭐'];
            const gem = gems[Math.floor(Math.random() * gems.length)];
            return (
              <div
                key={i}
                className="aspect-square bg-card rounded-xl border border-border flex items-center justify-center text-xl shadow-sm active:scale-90 transition-transform cursor-pointer"
              >
                {gem}
              </div>
            );
          })}
        </div>
      </div>
    </ScreenShell>
  );
}
