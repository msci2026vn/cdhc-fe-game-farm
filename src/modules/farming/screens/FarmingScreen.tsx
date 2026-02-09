import ScreenShell from '@/shared/components/ScreenShell';

export default function FarmingScreen() {
  return (
    <ScreenShell>
      {/* Sky + Farm Scene */}
      <div className="farm-sky-gradient min-h-[70vh] relative overflow-hidden">
        {/* Clouds */}
        <div className="absolute top-6 animate-cloud-drift opacity-40">
          <span className="text-4xl">☁️</span>
        </div>
        <div className="absolute top-14 animate-cloud-drift opacity-30" style={{ animationDelay: '8s' }}>
          <span className="text-3xl">☁️</span>
        </div>

        {/* Sun */}
        <div className="absolute top-4 right-6">
          <span className="text-4xl">☀️</span>
        </div>

        {/* Plant area */}
        <div className="flex flex-col items-center justify-end min-h-[55vh] pb-4 pt-20">
          {/* Plant */}
          <div className="animate-plant-sway mb-2">
            <span className="text-7xl block">🌿</span>
          </div>

          {/* Pot */}
          <div className="w-28 h-14 rounded-b-3xl bg-gradient-to-b from-farm-brown to-farm-brown-dark flex items-center justify-center shadow-md">
            <span className="text-xs font-heading font-semibold text-farm-gold-light">Cà Chua</span>
          </div>

          {/* Status */}
          <div className="mt-3 flex gap-2">
            <span className="bg-primary-pale text-primary text-xs font-bold px-3 py-1 rounded-full">Khỏe mạnh 💚</span>
            <span className="bg-farm-sky text-farm-blue text-xs font-bold px-3 py-1 rounded-full">Đang lớn 📈</span>
          </div>

          {/* Growth bar */}
          <div className="mt-3 w-56">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-semibold">
              <span>Tiến trình</span>
              <span>62%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-1000"
                style={{ width: '62%' }}
              />
            </div>
          </div>

          {/* Happiness bar */}
          <div className="mt-2 w-56">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-semibold">
              <span>Hạnh phúc 😊</span>
              <span>85%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-secondary to-secondary-light rounded-full transition-all duration-1000"
                style={{ width: '85%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-4 grid grid-cols-4 gap-2">
        {[
          { emoji: '💧', label: 'Tưới', color: 'bg-farm-blue/10 text-farm-blue border-farm-blue/20' },
          { emoji: '🧴', label: 'Bón phân', color: 'bg-secondary/10 text-secondary-foreground border-secondary/20' },
          { emoji: '🌾', label: 'Thu hoạch', color: 'bg-primary/10 text-primary border-primary/20' },
          { emoji: '🎯', label: 'Quiz', color: 'bg-farm-red/10 text-farm-red border-farm-red/20' },
        ].map((btn) => (
          <button
            key={btn.label}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border font-semibold text-xs transition-all active:scale-95 ${btn.color}`}
          >
            <span className="text-2xl">{btn.emoji}</span>
            {btn.label}
          </button>
        ))}
      </div>
    </ScreenShell>
  );
}
