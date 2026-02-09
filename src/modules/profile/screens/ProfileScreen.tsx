import ScreenShell from '@/shared/components/ScreenShell';

export default function ProfileScreen() {
  return (
    <ScreenShell>
      <div className="px-4 py-4">
        {/* Profile header */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary-pale flex items-center justify-center text-4xl shadow-lg green-glow">
            🧑‍🌾
          </div>
          <h2 className="font-heading font-bold text-xl">Nông dân Demo</h2>
          <span className="bg-secondary/20 text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full">
            Nông dân Bạc ⭐ Lv.12
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'ATK', value: 45, emoji: '⚔️', color: 'text-farm-red' },
            { label: 'HP', value: 120, emoji: '❤️', color: 'text-farm-red' },
            { label: 'DEF', value: 30, emoji: '🛡️', color: 'text-farm-blue' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-3 flex flex-col items-center gap-1 shadow-sm">
              <span className="text-2xl">{stat.emoji}</span>
              <span className={`font-heading font-bold text-lg ${stat.color}`}>{stat.value}</span>
              <span className="text-[10px] text-muted-foreground font-semibold">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Upgrade cards */}
        <h3 className="font-heading font-semibold text-base mb-3">Nâng cấp chỉ số</h3>
        <div className="flex flex-col gap-3 mb-6">
          {[
            { stat: 'ATK ⚔️', current: 45, cost: 300, progress: 45 },
            { stat: 'HP ❤️', current: 120, cost: 250, progress: 60 },
            { stat: 'DEF 🛡️', current: 30, cost: 200, progress: 30 },
          ].map((u) => (
            <div key={u.stat} className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3 shadow-sm">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-heading font-semibold text-sm">{u.stat}</span>
                  <span className="text-xs text-muted-foreground">{u.current}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${u.progress}%` }} />
                </div>
              </div>
              <button className="bg-secondary text-secondary-foreground font-bold text-xs px-3 py-2 rounded-xl whitespace-nowrap active:scale-95 transition-transform">
                🪙 {u.cost}
              </button>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <h3 className="font-heading font-semibold text-base mb-3">Thành tựu</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Tưới 100 lần', emoji: '💧', progress: '72/100' },
            { name: 'Thu hoạch 50', emoji: '🌾', progress: '36/50' },
            { name: 'Đánh 10 Boss', emoji: '⚔️', progress: '8/10' },
            { name: 'Mua 20 item', emoji: '🛒', progress: '15/20' },
          ].map((a) => (
            <div key={a.name} className="bg-card rounded-2xl border border-border p-3 flex items-center gap-2 shadow-sm">
              <span className="text-xl">{a.emoji}</span>
              <div>
                <p className="text-xs font-semibold">{a.name}</p>
                <p className="text-[10px] text-muted-foreground">{a.progress}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}
