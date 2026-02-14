import { useState } from 'react';
import BottomNav from '@/shared/components/BottomNav';
import { usePlayerProfile, useOgn } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { xpForNextLevel, getLevelTitle } from '@/shared/stores/playerStore';
import { gameApi } from '@/shared/api/game-api';

type Tab = 'stats' | 'achievements';

export default function ProfileScreen() {
  const [tab, setTab] = useState<Tab>('stats');
  const [loggingOut, setLoggingOut] = useState(false);
  const { data: profile, isLoading: isProfileLoading, error } = usePlayerProfile();
  const { data: auth, isLoading: isAuthLoading } = useAuth();
  const ogn = useOgn(); // TanStack Query single source of truth

  const isLoading = isProfileLoading || isAuthLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="h-[100dvh] max-w-[430px] mx-auto relative profile-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-bold text-sm">⏳ Đang tải profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="h-[100dvh] max-w-[430px] mx-auto relative profile-gradient flex items-center justify-center">
        <div className="text-center px-5">
          <span className="text-5xl block mb-3">❌</span>
          <p className="text-white font-bold text-sm mb-2">Không thể tải profile</p>
          <p className="text-white/70 text-xs">Vui lòng đăng nhập để xem thông tin</p>
        </div>
      </div>
    );
  }

  const level = profile.level;
  const xp = profile.xp;
  const nextXp = xpForNextLevel(level);
  const title = getLevelTitle(level);

  const user = auth?.user;
  const displayName = user?.name || (user as any)?.fullName || profile.name || (profile as any)?.fullName || 'Nông dân';
  const displayPicture = user?.picture || (user as any)?.avatar || (user as any)?.avatarUrl || profile.picture || (profile as any)?.avatar || (profile as any)?.avatarUrl;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'stats', label: '📊 Chỉ số' },
    { key: 'achievements', label: '🏆 Thành tựu' },
  ];

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto relative profile-gradient flex flex-col overflow-hidden">
      {/* Profile header — fixed, không scroll */}
      <div className="flex-shrink-0 relative pt-safe px-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full avatar-ring flex-shrink-0 overflow-hidden" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.12)' }}>
            <div className="w-full h-full rounded-full bg-game-green-mid flex items-center justify-center text-[28px]">
              {displayPicture ? (
                <img
                  src={displayPicture}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                '🧑‍🌾'
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-lg font-bold leading-tight">{displayName}</h2>
            <span className="inline-flex items-center gap-1 bg-game-green-mid text-white px-2.5 py-0.5 rounded-xl text-[10px] font-bold mt-0.5">
              ⭐ Lv.{level} — {title}
            </span>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
              🪙 {(profile.ogn || 0).toLocaleString('vi-VN')} OGN · 📅 {profile.totalHarvests || 0} lần thu hoạch
            </p>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {[
            { val: profile.totalHarvests.toString(), label: 'Thu hoạch', emoji: '🌾' },
            { val: profile.likesCount.toString(), label: 'Lượt thích', emoji: '❤️' },
            { val: profile.commentsCount.toString(), label: 'Bình luận', emoji: '💬' },
            { val: profile.giftsCount.toString(), label: 'Quà tặng', emoji: '🎁' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-2 text-center glass-card">
              <span className="text-sm block">{s.emoji}</span>
              <span className="font-heading text-sm font-bold block leading-tight">{s.val}</span>
              <span className="text-[8px] font-semibold text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar — fixed, không scroll */}
      <div className="flex-shrink-0 flex gap-1 px-5 mb-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${tab === t.key ? 'bg-primary text-white shadow-md' : 'bg-white/60 text-muted-foreground'
              }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable section — chỉ phần này scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-24" style={{ scrollbarWidth: 'none' }}>

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div className="space-y-2 animate-fade-in">
            <h3 className="font-heading text-sm font-bold flex items-center gap-2">📈 Nâng cấp chỉ số</h3>
            {[
              { emoji: '⚔️', name: 'Sát thương (ATK)', desc: '120 → 140', progress: 60, color: '#e74c3c', bg: 'linear-gradient(135deg, #ffe0e0, #ffb3b3)', cost: 100 },
              { emoji: '❤️', name: 'Máu tối đa (HP)', desc: '1000 → 1200', progress: 40, color: '#4eca6a', bg: 'linear-gradient(135deg, #d4f8dc, #a8e6a0)', cost: 80 },
              { emoji: '🛡️', name: 'Giáp cơ bản (DEF)', desc: '80 → 100', progress: 80, color: '#3498db', bg: 'linear-gradient(135deg, #d4eeff, #a8d4f0)', cost: 60 },
            ].map((u) => (
              <div key={u.name} className="bg-white rounded-xl p-2.5 flex items-center gap-2.5"
                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: u.bg }}>{u.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground">{u.desc}</p>
                  <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${u.progress}%`, background: u.color }} />
                  </div>
                </div>
                <button className="btn-gold px-2.5 py-1 rounded-xl font-heading text-[10px] font-bold text-white whitespace-nowrap">
                  🪙 {u.cost}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Achievements Tab */}
        {tab === 'achievements' && (
          <div className="space-y-2 animate-fade-in">
            {[
              { emoji: '🎯', name: 'Quiz Master', desc: 'Trả lời đúng 50 câu hỏi', progress: 72, total: '36/50' },
              { emoji: '🐲', name: 'Boss Slayer', desc: 'Tiêu diệt 10 Boss', progress: Math.min(100, (profile.totalBossKills / 10) * 100), total: `${profile.totalBossKills}/10` },
              { emoji: '❤️', name: 'Người thân thiện', desc: 'Thích 50 vườn bạn bè', progress: Math.min(100, (profile.likesCount / 50) * 100), total: `${profile.likesCount}/50` },
              { emoji: '💬', name: 'Người bình luận', desc: 'Bình luận 30 lần', progress: Math.min(100, (profile.commentsCount / 30) * 100), total: `${profile.commentsCount}/30` },
              { emoji: '🎁', name: 'Nhà hảo tâm', desc: 'Tặng 20 món quà', progress: Math.min(100, (profile.giftsCount / 20) * 100), total: `${profile.giftsCount}/20` },
              { emoji: '🌾', name: 'Nông dân chăm chỉ', desc: 'Thu hoạch 100 lần', progress: Math.min(100, (profile.totalHarvests / 100) * 100), total: `${profile.totalHarvests}/100` },
            ].map((a) => (
              <div key={a.name} className="bg-white rounded-xl p-2.5 flex items-center gap-2.5"
                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
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

        {/* Logout button — bên trong vùng scroll */}
        <div className="mt-4 mb-2">
          <button
            onClick={async () => {
              if (loggingOut) return;
              setLoggingOut(true);
              await gameApi.logout();
            }}
            disabled={loggingOut}
            className="w-full py-2.5 rounded-xl font-heading text-sm font-bold text-red-600 bg-red-50 border border-red-200 active:bg-red-100 transition-all disabled:opacity-50"
          >
            {loggingOut ? '⏳ Đang đăng xuất...' : '🚪 Đăng xuất'}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
