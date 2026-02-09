import BottomNav from '@/shared/components/BottomNav';

export default function ProfileScreen() {
  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative profile-gradient flex flex-col">
      {/* Profile header */}
      <div className="text-center pt-safe px-5 pb-2.5">
        <div className="w-20 h-20 rounded-full avatar-ring mx-auto mb-3" style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}>
          <div className="w-full h-full rounded-full bg-game-green-mid flex items-center justify-center text-4xl">
            🧑‍🌾
          </div>
        </div>
        <h2 className="font-heading text-xl font-bold">Farmer Minh</h2>
        <span className="inline-flex items-center gap-1 bg-game-green-mid text-white px-3.5 py-1 rounded-xl text-xs font-bold mt-1.5">
          ⭐ Level 5 — Nông dân Bạc
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 px-5 py-4">
        {[
          { emoji: '⚔️', val: '120', label: 'ATK' },
          { emoji: '❤️', val: '1000', label: 'HP' },
          { emoji: '🛡️', val: '80', label: 'DEF' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg p-3.5 text-center glass-card">
            <span className="text-2xl block mb-1">{s.emoji}</span>
            <span className="font-heading text-lg font-bold block">{s.val}</span>
            <span className="text-[10px] font-semibold text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Scrollable section */}
      <div className="flex-1 overflow-y-auto px-5 pb-24" style={{ scrollbarWidth: 'none' }}>
        {/* Upgrade section */}
        <h3 className="font-heading text-base font-bold flex items-center gap-2 mb-3">📈 Nâng cấp chỉ số</h3>

        {[
          { emoji: '⚔️', name: 'Sát thương (ATK)', desc: '120 → 140 (+20 mỗi cấp)', progress: 60, color: '#e74c3c', bgClass: 'linear-gradient(135deg, #ffe0e0, #ffb3b3)', cost: 100 },
          { emoji: '❤️', name: 'Máu tối đa (HP)', desc: '1000 → 1200 (+200 mỗi cấp)', progress: 40, color: '#4eca6a', bgClass: 'linear-gradient(135deg, #d4f8dc, #a8e6a0)', cost: 80 },
          { emoji: '🛡️', name: 'Giáp cơ bản (DEF)', desc: '80 → 100 (+20 mỗi cấp)', progress: 80, color: '#3498db', bgClass: 'linear-gradient(135deg, #d4eeff, #a8d4f0)', cost: 60 },
        ].map((u) => (
          <div key={u.name} className="bg-white rounded-lg p-3.5 flex items-center gap-3 mb-2.5"
            style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: u.bgClass }}>{u.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{u.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{u.desc}</p>
              <div className="h-1 rounded-full bg-gray-100 mt-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${u.progress}%`, background: u.color }} />
              </div>
            </div>
            <button className="btn-gold px-3.5 py-2 rounded-xl font-heading text-[11px] font-bold text-white whitespace-nowrap">
              🪙 {u.cost}
            </button>
          </div>
        ))}

        {/* Achievements */}
        <h3 className="font-heading text-base font-bold flex items-center gap-2 mb-3 mt-4">🏆 Thành tựu</h3>

        {[
          { emoji: '🎯', name: 'Quiz Master', desc: 'Trả lời đúng 50 câu hỏi', progress: 72, total: '36/50' },
          { emoji: '🐲', name: 'Boss Slayer', desc: 'Tiêu diệt 10 Boss', progress: 30, total: '3/10' },
        ].map((a) => (
          <div key={a.name} className="bg-white rounded-lg p-3.5 flex items-center gap-3 mb-2.5"
            style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #fff8dc, #ffe066)' }}>{a.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{a.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{a.desc}</p>
              <div className="h-1 rounded-full bg-gray-100 mt-1.5 overflow-hidden">
                <div className="h-full rounded-full bg-game-gold-DEFAULT" style={{ width: `${a.progress}%` }} />
              </div>
            </div>
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">{a.total}</span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
