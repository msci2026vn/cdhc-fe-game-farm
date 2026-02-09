import { useState } from 'react';
import BottomNav from '@/shared/components/BottomNav';
import { useFarmStore } from '@/modules/farming/stores/farmStore';
import { useActivityStore, formatActivityTime } from '@/shared/stores/activityStore';
import { usePlayerStore, xpForNextLevel, getLevelTitle } from '@/shared/stores/playerStore';

type Tab = 'stats' | 'activity' | 'inventory' | 'achievements';

const ACTIVITY_FILTERS = [
  { key: 'all', label: 'Tất cả', emoji: '📋' },
  { key: 'like', label: 'Thích', emoji: '❤️' },
  { key: 'comment', label: 'Bình luận', emoji: '💬' },
  { key: 'gift', label: 'Quà', emoji: '🎁' },
  { key: 'buy', label: 'Mua', emoji: '🛒' },
];

const RARITY_COLORS: Record<string, string> = {
  common: '#95a5a6',
  rare: '#3498db',
  epic: '#9b59b6',
  legendary: '#f0b429',
};

export default function ProfileScreen() {
  const [tab, setTab] = useState<Tab>('stats');
  const [activityFilter, setActivityFilter] = useState('all');
  const ogn = useFarmStore((s) => s.ogn);
  const { likes, comments, gifts, harvests, activities, inventory } = useActivityStore();
  const { level, xp } = usePlayerStore();
  const nextXp = xpForNextLevel(level);
  const title = getLevelTitle(level);

  const filteredActivity = activityFilter === 'all'
    ? activities
    : activities.filter((a) => a.type === activityFilter);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'stats', label: '📊 Chỉ số' },
    { key: 'activity', label: '📝 Hoạt động' },
    { key: 'inventory', label: '🎒 Kho đồ' },
    { key: 'achievements', label: '🏆 Thành tựu' },
  ];

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative profile-gradient flex flex-col">
      {/* Profile header */}
      <div className="relative pt-safe px-5 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-[72px] h-[72px] rounded-full avatar-ring flex-shrink-0" style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}>
            <div className="w-full h-full rounded-full bg-game-green-mid flex items-center justify-center text-[34px]">
              🧑‍🌾
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-xl font-bold">Farmer Minh</h2>
            <span className="inline-flex items-center gap-1 bg-game-green-mid text-white px-3 py-0.5 rounded-xl text-[11px] font-bold mt-1">
              ⭐ Lv.{level} — {title}
            </span>
            <p className="text-[11px] text-muted-foreground font-semibold mt-1">
              🪙 {ogn.toLocaleString()} OGN · 📅 14 ngày hoạt động
            </p>
          </div>
        </div>

        {/* Quick stats row - REAL DATA */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { val: harvests.toString(), label: 'Thu hoạch', emoji: '🌾' },
            { val: likes.toString(), label: 'Lượt thích', emoji: '❤️' },
            { val: comments.toString(), label: 'Bình luận', emoji: '💬' },
            { val: gifts.toString(), label: 'Quà tặng', emoji: '🎁' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-2.5 text-center glass-card">
              <span className="text-base block">{s.emoji}</span>
              <span className="font-heading text-base font-bold block leading-tight">{s.val}</span>
              <span className="text-[9px] font-semibold text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 px-5 mb-3">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
              tab === t.key ? 'bg-primary text-white shadow-md' : 'bg-white/60 text-muted-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable section */}
      <div className="flex-1 overflow-y-auto px-5 pb-24" style={{ scrollbarWidth: 'none' }}>

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div className="space-y-2.5 animate-fade-in">
            <h3 className="font-heading text-sm font-bold flex items-center gap-2">📈 Nâng cấp chỉ số</h3>
            {[
              { emoji: '⚔️', name: 'Sát thương (ATK)', desc: '120 → 140', progress: 60, color: '#e74c3c', bg: 'linear-gradient(135deg, #ffe0e0, #ffb3b3)', cost: 100 },
              { emoji: '❤️', name: 'Máu tối đa (HP)', desc: '1000 → 1200', progress: 40, color: '#4eca6a', bg: 'linear-gradient(135deg, #d4f8dc, #a8e6a0)', cost: 80 },
              { emoji: '🛡️', name: 'Giáp cơ bản (DEF)', desc: '80 → 100', progress: 80, color: '#3498db', bg: 'linear-gradient(135deg, #d4eeff, #a8d4f0)', cost: 60 },
            ].map((u) => (
              <div key={u.name} className="bg-white rounded-xl p-3 flex items-center gap-3"
                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: u.bg }}>{u.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground">{u.desc}</p>
                  <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${u.progress}%`, background: u.color }} />
                  </div>
                </div>
                <button className="btn-gold px-3 py-1.5 rounded-xl font-heading text-[10px] font-bold text-white whitespace-nowrap">
                  🪙 {u.cost}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Activity Tab */}
        {tab === 'activity' && (
          <div className="animate-fade-in">
            <div className="flex gap-1.5 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {ACTIVITY_FILTERS.map((f) => (
                <button key={f.key} onClick={() => setActivityFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                    activityFilter === f.key ? 'bg-primary text-white' : 'bg-white/70 text-muted-foreground'
                  }`}>
                  {f.emoji} {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredActivity.length === 0 && (
                <div className="text-center py-10">
                  <span className="text-4xl block mb-2">📝</span>
                  <p className="text-xs text-muted-foreground font-semibold">Chưa có hoạt động nào</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Thích, bình luận, tặng quà bạn bè để thấy ở đây!</p>
                </div>
              )}
              {filteredActivity.map((a, i) => (
                <div key={i} className="bg-white rounded-xl p-3 flex items-start gap-3 animate-fade-in"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', animationDelay: `${i * 30}ms` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{
                      background: a.type === 'like' ? '#ffe0e0'
                        : a.type === 'comment' ? '#e8d4ff'
                        : a.type === 'gift' ? '#fff3d4'
                        : a.type === 'water' ? '#d4eeff'
                        : a.type === 'buy' ? '#ffecd2'
                        : '#d4f8dc',
                    }}>
                    {a.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-snug">{a.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatActivityTime(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {tab === 'inventory' && (
          <div className="animate-fade-in">
            {inventory.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-5xl block mb-3">🎒</span>
                <p className="text-sm font-bold text-muted-foreground">Kho đồ trống</p>
                <p className="text-[11px] text-muted-foreground mt-1">Mua vật phẩm từ Cửa hàng để bắt đầu!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {inventory.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl p-3 flex flex-col items-center gap-1 relative"
                    style={{
                      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                      borderWidth: 2,
                      borderColor: item.rarity ? (RARITY_COLORS[item.rarity] || 'transparent') : 'transparent',
                    }}>
                    {/* Quantity badge */}
                    {item.quantity > 1 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center"
                        style={{ boxShadow: '0 2px 6px rgba(45,138,78,0.3)' }}>
                        {item.quantity}
                      </span>
                    )}
                    <span className="text-3xl">{item.emoji}</span>
                    <span className="font-heading text-[10px] font-bold text-center leading-tight">{item.name}</span>
                    <span className="text-[8px] text-muted-foreground text-center">{item.desc}</span>
                    {item.rarity && item.rarity !== 'common' && (
                      <span className="text-[7px] font-extrabold px-1.5 py-px rounded-full text-white mt-0.5"
                        style={{ background: RARITY_COLORS[item.rarity] }}>
                        {item.rarity.toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {tab === 'achievements' && (
          <div className="space-y-2.5 animate-fade-in">
            {[
              { emoji: '🎯', name: 'Quiz Master', desc: 'Trả lời đúng 50 câu hỏi', progress: 72, total: '36/50' },
              { emoji: '🐲', name: 'Boss Slayer', desc: 'Tiêu diệt 10 Boss', progress: 30, total: '3/10' },
              { emoji: '❤️', name: 'Người thân thiện', desc: 'Thích 50 vườn bạn bè', progress: Math.min(100, (likes / 50) * 100), total: `${likes}/50` },
              { emoji: '💬', name: 'Người bình luận', desc: 'Bình luận 30 lần', progress: Math.min(100, (comments / 30) * 100), total: `${comments}/30` },
              { emoji: '🎁', name: 'Nhà hảo tâm', desc: 'Tặng 20 món quà', progress: Math.min(100, (gifts / 20) * 100), total: `${gifts}/20` },
              { emoji: '🌾', name: 'Nông dân chăm chỉ', desc: 'Thu hoạch 100 lần', progress: Math.min(100, (harvests / 100) * 100), total: `${harvests}/100` },
            ].map((a) => (
              <div key={a.name} className="bg-white rounded-xl p-3 flex items-center gap-3"
                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #fff8dc, #ffe066)' }}>{a.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                  <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                    <div className="h-full rounded-full bg-game-gold-DEFAULT transition-all" style={{ width: `${a.progress}%` }} />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">{a.total}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
