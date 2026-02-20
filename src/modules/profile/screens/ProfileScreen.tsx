import { useState } from 'react';
import BottomNav from '@/shared/components/BottomNav';
import { usePlayerProfile, useOgn } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { xpForNextLevel, getLevelTitle, LEVEL_CONFIG } from '@/shared/stores/playerStore';
import { gameApi } from '@/shared/api/game-api';
import { usePlayerStats } from '@/shared/hooks/usePlayerStats';
import { useResetStats } from '@/shared/hooks/useResetStats';
import { StatAllocationModal } from '@/shared/components/StatAllocationModal';
import { StatHelpModal } from '@/shared/components/StatHelpModal';
import { STAT_CONFIG } from '@/shared/utils/stat-constants';
import { formatOGN } from '@/shared/utils/format';
import { playSound } from '@/shared/audio';
import { ConversionModal } from '../components/ConversionModal';

type Tab = 'stats' | 'achievements';

export default function ProfileScreen() {
  const [tab, setTab] = useState<Tab>('stats');
  const [loggingOut, setLoggingOut] = useState(false);
  const [showStatModal, setShowStatModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetError, setResetError] = useState<{ message: string; code: string } | null>(null);
  const [helpStat, setHelpStat] = useState<'atk' | 'hp' | 'def' | 'mana' | null>(null);
  const [showConversion, setShowConversion] = useState(false);
  const { data: profile, isLoading: isProfileLoading, error } = usePlayerProfile();
  const { data: auth, isLoading: isAuthLoading } = useAuth();
  const { data: statInfo } = usePlayerStats();
  const resetStats = useResetStats();
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

        {/* XP Bar */}
        <div className="mt-3 bg-black/20 rounded-full h-4 relative overflow-hidden backdrop-blur-sm border border-white/10 mx-1">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
            style={{ width: `${(LEVEL_CONFIG.getXpInLevel(xp) / LEVEL_CONFIG.getXpForLevel(xp)) * 100}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white uppercase tracking-wider shadow-sm">
            XP {LEVEL_CONFIG.getXpInLevel(xp)} / {LEVEL_CONFIG.getXpForLevel(xp)}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {[
            { val: (profile.totalHarvests ?? 0).toString(), label: 'Thu hoạch', emoji: '🌾' },
            { val: (profile.likesCount ?? 0).toString(), label: 'Lượt thích', emoji: '❤️' },
            { val: (profile.giftsCount ?? 0).toString(), label: 'Quà tặng', emoji: '🎁' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-2 text-center glass-card">
              <span className="text-sm block">{s.emoji}</span>
              <span className="font-heading text-sm font-bold block leading-tight">{s.val}</span>
              <span className="text-[8px] font-semibold text-muted-foreground">{s.label}</span>
            </div>
          ))}
          <div
            onClick={() => { playSound('ui_tab'); setShowConversion(true); }}
            className="rounded-xl p-2 text-center glass-card cursor-pointer hover:bg-orange-50/80 active:scale-95 transition-all border border-orange-200/50"
          >
            <span className="text-sm block">🔄</span>
            <span className="font-heading text-sm font-bold block leading-tight text-orange-600">Đổi</span>
            <span className="text-[8px] font-semibold text-orange-500">Đổi Hạt</span>
          </div>
        </div>
      </div>

      {/* Tab bar — fixed, không scroll */}
      <div className="flex-shrink-0 flex gap-1 px-5 mb-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { playSound('ui_tab'); setTab(t.key); }}
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
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-bold flex items-center gap-2">📈 Chỉ số nhân vật</h3>
              {(statInfo?.freePoints ?? 0) > 0 && (
                <button
                  onClick={() => setShowStatModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold text-white bg-gradient-to-r from-yellow-500 to-amber-500 animate-pulse active:scale-95 shadow-md"
                >
                  <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                    {statInfo!.freePoints}
                  </span>
                  Phân bổ ngay!
                </button>
              )}
            </div>

            {/* Stat bars — real data */}
            {[
              { key: 'atk' as const, emoji: '⚔️', name: 'Sát thương (ATK)', color: '#e74c3c', bg: 'linear-gradient(135deg, #ffe0e0, #ffb3b3)', maxVal: 2000 },
              { key: 'hp' as const, emoji: '❤️', name: 'Máu tối đa (HP)', color: '#4eca6a', bg: 'linear-gradient(135deg, #d4f8dc, #a8e6a0)', maxVal: 5000 },
              { key: 'def' as const, emoji: '🛡️', name: 'Giáp cơ bản (DEF)', color: '#3498db', bg: 'linear-gradient(135deg, #d4eeff, #a8d4f0)', maxVal: 1000 },
              { key: 'mana' as const, emoji: '✨', name: 'Mana', color: '#9b59b6', bg: 'linear-gradient(135deg, #f0d4ff, #d4a8f0)', maxVal: 1500 },
            ].map((u) => {
              const points = statInfo?.stats?.[u.key] ?? 0;
              const effective = statInfo?.effectiveStats?.[u.key] ?? 0;
              const progress = Math.min(100, (effective / u.maxVal) * 100);
              return (
                <div key={u.key} className="bg-white rounded-xl p-2.5 flex items-center gap-2.5"
                  style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: u.bg }}>{u.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">{effective.toLocaleString('vi-VN')} ({points} điểm)</p>
                    <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: u.color }} />
                    </div>
                  </div>
                  <button
                    onClick={() => setHelpStat(u.key)}
                    className="w-5 h-5 rounded-full border border-gray-300 text-gray-400 text-[10px] font-semibold flex items-center justify-center active:bg-gray-100 active:text-gray-600 shrink-0"
                  >
                    ?
                  </button>
                </div>
              );
            })}

            {/* Auto preset indicator */}
            {statInfo?.autoEnabled && statInfo.autoPreset && (
              <div className="bg-blue-50 rounded-xl p-2 text-center">
                <p className="text-[10px] font-bold text-blue-600">
                  🤖 Tự động phân bổ: {statInfo.autoPreset === 'attack' ? '⚔️ Tấn công' : statInfo.autoPreset === 'defense' ? '🛡️ Phòng thủ' : '✨ Cân bằng'}
                </p>
              </div>
            )}

            {/* Reset button */}
            {statInfo && (statInfo.stats.atk + statInfo.stats.hp + statInfo.stats.def + statInfo.stats.mana) > 0 && (
              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={resetStats.isPending}
                className="w-full py-2 rounded-xl text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 active:bg-orange-100 transition-all disabled:opacity-50"
              >
                🔄 Reset chỉ số ({formatOGN(statInfo.resetInfo.nextCost)} OGN) · {statInfo.resetInfo.weeklyCount}/3 tuần này
              </button>
            )}

            {/* Next milestones */}
            {statInfo?.milestones?.next && statInfo.milestones.next.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-bold text-gray-400 mb-1">💡 Mốc tiếp theo</p>
                {statInfo.milestones.next.slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-1.5 mb-1">
                    <span className="text-sm">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold">{m.name}</p>
                      <p className="text-[9px] text-gray-400">{m.description} · Còn {m.remaining} điểm</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Unlocked milestones */}
            {statInfo?.milestones?.unlocked && statInfo.milestones.unlocked.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-bold text-gray-400 mb-1">🏅 Đã mở khóa</p>
                {statInfo.milestones.unlocked.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 bg-amber-50 rounded-lg p-1.5 mb-1">
                    <span className="text-sm">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-amber-700">{m.name}</p>
                      <p className="text-[9px] text-amber-500">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* Stat Allocation Modal */}
      {statInfo && (
        <StatAllocationModal
          isOpen={showStatModal}
          onClose={() => setShowStatModal(false)}
          freePoints={statInfo.freePoints}
          currentStats={statInfo.stats}
          effectiveStats={statInfo.effectiveStats}
          nextMilestones={statInfo.milestones?.next ?? []}
          autoPreset={statInfo.autoPreset}
          autoEnabled={statInfo.autoEnabled}
        />
      )}

      {/* Reset Confirmation */}
      {showResetConfirm && statInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white rounded-2xl p-5 max-w-[320px] w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-2">🔄</div>
              <h3 className="font-heading text-lg font-bold mb-1">Reset chỉ số?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Tất cả điểm chỉ số sẽ được trả lại. Bạn có thể phân bổ lại.
              </p>
              <div className="bg-orange-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-orange-700 font-bold mb-1">Chi phí reset</p>
                <p className="text-2xl font-black text-orange-600">{formatOGN(statInfo.resetInfo.nextCost)} OGN</p>
                <p className="text-[10px] text-orange-500 mt-1">
                  Lần reset {statInfo.resetInfo.weeklyCount + 1}/3 tuần này
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 active:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    resetStats.mutate(undefined, {
                      onSuccess: () => setShowResetConfirm(false),
                      onError: (err: any) => {
                        setShowResetConfirm(false);
                        setResetError({
                          message: err.message || 'Không thể reset chỉ số',
                          code: err.code || 'UNKNOWN'
                        });
                      }
                    });
                  }}
                  disabled={resetStats.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 active:scale-95 shadow-lg disabled:opacity-50"
                >
                  {resetStats.isPending ? '...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Stat Help Modal */}
      {helpStat && (
        <StatHelpModal
          stat={helpStat}
          isOpen={!!helpStat}
          onClose={() => setHelpStat(null)}
        />
      )}

      {/* Conversion Modal */}
      <ConversionModal isOpen={showConversion} onClose={() => setShowConversion(false)} />

      {/* Reset Error Modal */}
      {resetError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 animate-fade-in" onClick={() => setResetError(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-[320px] w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="font-heading text-lg font-bold mb-2">Lỗi reset chỉ số</h3>
              <p className="text-sm text-gray-600 mb-6">
                {resetError.code === 'INSUFFICIENT_OGN'
                  ? 'Bạn không có đủ OGN để thực hiện reset chỉ số. Vui lòng kiểm tra lại số dư.'
                  : resetError.message}
              </p>
              <button
                onClick={() => setResetError(null)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-gray-500 to-gray-600 active:scale-95 shadow-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
