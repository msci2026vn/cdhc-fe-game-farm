import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/shared/components/BottomNav';
import { usePlayerProfile, useOgn, useInvalidateProfile } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { xpForNextLevel, getLevelTitle, LEVEL_CONFIG } from '@/shared/stores/playerStore';
import { gameApi } from '@/shared/api/game-api';
import { API_BASE_URL } from '@/shared/utils/constants';
import { usePlayerStats } from '@/shared/hooks/usePlayerStats';
import { useResetStats } from '@/shared/hooks/useResetStats';
import { StatAllocationModal } from '@/shared/components/StatAllocationModal';
import { StatHelpModal } from '@/shared/components/StatHelpModal';
import { STAT_CONFIG } from '@/shared/utils/stat-constants';
import { formatOGN } from '@/shared/utils/format';
import { playSound } from '@/shared/audio';
import { ConversionModal } from '../components/ConversionModal';
import { VipBadge } from '../components/VipBadge';
import { SmartWalletCard } from '../components/SmartWalletCard';
import { CustodialWalletCard } from '../components/CustodialWalletCard';
import { useWalletAuth } from '@/shared/hooks/useWalletAuth';
import { WalletSelectModal } from '@/shared/components/WalletSelectModal';
import { useVipStatus } from '@/shared/hooks/useVipStatus';

type Tab = 'wallet' | 'stats' | 'achievements';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('stats');
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
  const { state: walletState, clearError: clearWalletError } = useWalletAuth();
  const invalidateProfile = useInvalidateProfile();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { isVip, tier, daysRemaining } = useVipStatus();

  // Wallet status — fallback if profile doesn't have walletAddress
  const { data: walletStatus, refetch: refetchWalletStatus } = useQuery({
    queryKey: ['wallet-status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/auth/wallet/status`, { credentials: 'include' });
      const data = await res.json();
      return data.success ? data.data : null;
    },
    staleTime: 60_000,
  });

  // Resolve walletAddress from multiple sources
  const walletAddress = profile?.walletAddress || (auth?.user as any)?.walletAddress || walletStatus?.walletAddress || null;

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
    <div className="bg-background-light min-h-[100dvh] text-farm-brown-dark font-body overflow-hidden select-none">
      <div className="max-w-[430px] mx-auto h-[100dvh] flex flex-col relative bg-farm-vibe shadow-2xl overflow-hidden">

        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-green-200 rounded-full blur-[60px] opacity-40"></div>
          <div className="absolute bottom-[-20px] right-[-20px] w-80 h-80 bg-yellow-100 rounded-full blur-[50px] opacity-60"></div>
          <span className="material-symbols-outlined absolute top-10 right-10 text-green-800/10 text-6xl transform rotate-12">local_florist</span>
          <span className="material-symbols-outlined absolute top-40 left-5 text-green-800/10 text-4xl transform -rotate-12">spa</span>
        </div>

        {/* Top Header */}
        <div className="relative z-30 px-3 pt-2 flex justify-between items-center shrink-0">
          <button
            onClick={() => { playSound('ui_back'); navigate('/'); }}
            className="bg-white/80 p-1.5 rounded-xl shadow-paper-shadow text-farm-brown-dark hover:bg-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="bg-farm-brown text-[#fefae0] px-4 py-0.5 rounded-full shadow-wood-shadow font-heading font-bold text-base border-2 border-[#5d4037]">
            Hồ Sơ Nông Dân
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="bg-white/80 p-1.5 rounded-xl shadow-paper-shadow text-farm-brown-dark hover:bg-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="px-3 mt-2 z-10 shrink-0">
          <div className="bg-farm-paper rounded-2xl p-2.5 shadow-sm border-2 border-[#d4c5a3] relative">
            <div className="flex gap-2.5 items-center">
              <div className="relative shrink-0">
                <div className={`w-[60px] h-[60px] rounded-2xl bg-[#f4e4bc] border-[3px] shadow-sm overflow-hidden flex items-center justify-center text-xl ${isVip ? 'border-[#FDB931] shadow-[0_2px_12px_rgba(253,185,49,0.7)]' : 'border-farm-brown'}`}>
                  {displayPicture ? (
                    <img alt="Avatar" className="w-full h-full object-cover" src={displayPicture} />
                  ) : (
                    '🧑‍🌾'
                  )}
                </div>
                <div className="absolute -bottom-1.5 -right-1 bg-farm-green-dark text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold border-2 border-white shadow-sm">
                  Lv.{level}
                </div>
                {isVip && (
                  <div className="absolute -top-3 -left-3 bg-white text-[#FDB931] text-[13px] px-2 py-0.5 rounded-lg font-black border-[2.5px] border-[#FDB931] shadow-[0_0_15px_rgba(253,185,49,0.9)] flex items-center gap-0.5 z-10 -rotate-[12deg] animate-pulse">
                    <span className="material-symbols-outlined text-[15px] fill-current">crown</span>
                    <span className="tracking-widest">VIP</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h1 className="font-heading font-bold text-[16px] leading-tight text-farm-brown-dark truncate">{displayName}</h1>
                  {!isVip && (
                    <div className="bg-gray-200 text-gray-600 px-1 py-0.5 rounded text-[8px] font-bold border border-gray-300 shadow-sm shrink-0">
                      FREE
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="text-[11px] font-bold text-farm-green-light truncate">⭐ {title}</div>
                  {(!isVip || daysRemaining <= 7) && (
                    <button
                      onClick={() => navigate('/vip/purchase')}
                      className="bg-farm-carrot text-white text-[8px] px-2 py-0.5 rounded-full font-bold shadow-sm hover:bg-orange-600 active:scale-95 transition-transform animate-bounce shrink-0 ml-auto"
                    >
                      {isVip ? 'GIA HẠN' : 'NÂNG CẤP'}
                    </button>
                  )}
                </div>

                {/* XP Bar */}
                <div className="w-full h-3.5 bg-gray-200 rounded-full border border-gray-300 relative overflow-hidden mb-1.5">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                    style={{ width: `${(LEVEL_CONFIG.getXpInLevel(xp) / LEVEL_CONFIG.getXpForLevel(xp)) * 100}%` }}
                  ></div>
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-md">
                    {LEVEL_CONFIG.getXpInLevel(xp)} / {LEVEL_CONFIG.getXpForLevel(xp)} XP
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-farm-brown-dark/80">
                  <span className="flex items-center gap-1"><span className="text-[13px]">🪙</span> {formatOGN(profile.ogn || 0)}</span>
                  <span className="flex items-center gap-1"><span className="text-[13px]">📅</span> {profile.totalHarvests || 0}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Tab Buttons */}
        <div className="px-3 mt-3 flex gap-2 z-10 shrink-0">
          <button
            onClick={() => { playSound('ui_tab'); setTab('wallet'); }}
            className={`flex-1 py-1.5 rounded-xl font-bold font-heading text-[12px] tracking-wide transition-all flex items-center justify-center gap-1 ${tab === 'wallet'
              ? 'wood-btn shadow-md'
              : 'bg-white/60 border-2 border-transparent hover:border-farm-brown/30 text-farm-brown-dark'
              }`}
          >
            <img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-3.5 h-3.5 object-contain" /> Ví Avax
          </button>
          <button
            onClick={() => { playSound('ui_tab'); setTab('stats'); }}
            className={`flex-1 py-1.5 rounded-xl font-bold font-heading text-[12px] tracking-wide transition-all ${tab === 'stats'
              ? 'wood-btn shadow-md'
              : 'bg-white/60 border-2 border-transparent hover:border-farm-brown/30 text-farm-brown-dark'
              }`}
          >
            📊 Chỉ số
          </button>
          <button
            onClick={() => { playSound('ui_tab'); setTab('achievements'); }}
            className={`flex-1 py-1.5 rounded-xl font-bold font-heading text-[12px] tracking-wide transition-all ${tab === 'achievements'
              ? 'wood-btn shadow-md'
              : 'bg-white/60 border-2 border-transparent hover:border-farm-brown/30 text-farm-brown-dark'
              }`}
          >
            🏆 Thành tựu
          </button>
        </div>



        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 mt-4 z-10" style={{ scrollbarWidth: 'none' }}>

          {tab === 'wallet' && (
            <div className="animate-fade-in space-y-4">
              {/* Custodial Wallet (FARMVERSE) */}
              <CustodialWalletCard />

              {/* Wallet and Logout */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-4">
                <h3 className="font-heading text-sm font-bold flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                  Ví <img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-5 h-5 ml-1 mr-1 object-contain inline-block" /> Avalanche
                </h3>
                <p className="text-[10px] text-gray-600 mb-3">
                  {walletAddress
                    ? 'Ví đã được liên kết với tài khoản của bạn.'
                    : 'Liên kết ví để nhận phần thưởng on-chain và giao dịch OGN token.'}
                </p>

                {walletAddress ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-xl border border-green-200 text-xs font-bold mb-3">
                    <span>✅</span>
                    <span>Đã liên kết:</span>
                    <code className="bg-white px-1.5 py-0.5 rounded border border-green-100 text-[10px] font-mono shadow-sm">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </code>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowWalletModal(true); }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 active:bg-orange-100 transition-all flex items-center justify-center gap-2 mb-3"
                  >
                    🔗 Liên kết ví <img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-3.5 h-3.5 object-contain inline-block" /> Avalanche
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === 'stats' && (
            <div className="animate-fade-in space-y-4">

              {/* Stats Block */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-heading font-bold text-farm-brown-dark text-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-farm-green-dark">analytics</span>
                    Chỉ số nhân vật
                  </h3>
                  {statInfo && (statInfo.stats.atk + statInfo.stats.hp + statInfo.stats.def + statInfo.stats.mana) > 0 && (
                    <button
                      onClick={() => { playSound('ui_modal_open'); setShowResetConfirm(true); }}
                      disabled={resetStats.isPending}
                      className="bg-farm-straw text-farm-brown-dark text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-orange-200 active:scale-95 transition-transform flex items-center gap-1 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">restart_alt</span>
                      Reset ({formatOGN(statInfo.resetInfo.nextCost)} OGN)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#fefae0] p-3 rounded-xl border border-[#e9c46a] flex items-center gap-3 shadow-sm cursor-pointer hover:bg-[#fbf4d0]" onClick={() => setHelpStat('atk')}>
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">⚔️</div>
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500 font-bold uppercase truncate">Tấn Công</div>
                      <div className="text-lg font-heading font-bold text-farm-brown-dark leading-tight">{statInfo?.effectiveStats?.atk ?? 0}</div>
                    </div>
                  </div>
                  <div className="bg-[#fefae0] p-3 rounded-xl border border-[#e9c46a] flex items-center gap-3 shadow-sm cursor-pointer hover:bg-[#fbf4d0]" onClick={() => setHelpStat('hp')}>
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">❤️</div>
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500 font-bold uppercase truncate">Máu (HP)</div>
                      <div className="text-lg font-heading font-bold text-farm-brown-dark leading-tight">{statInfo?.effectiveStats?.hp ?? 0}</div>
                    </div>
                  </div>
                  <div className="bg-[#fefae0] p-3 rounded-xl border border-[#e9c46a] flex items-center gap-3 shadow-sm cursor-pointer hover:bg-[#fbf4d0]" onClick={() => setHelpStat('def')}>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">🛡️</div>
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500 font-bold uppercase truncate">Phòng Thủ</div>
                      <div className="text-lg font-heading font-bold text-farm-brown-dark leading-tight">{statInfo?.effectiveStats?.def ?? 0}</div>
                    </div>
                  </div>
                  <div className="bg-[#fefae0] p-3 rounded-xl border border-[#e9c46a] flex items-center gap-3 shadow-sm cursor-pointer hover:bg-[#fbf4d0]" onClick={() => setHelpStat('mana')}>
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">✨</div>
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500 font-bold uppercase truncate">Năng Lượng</div>
                      <div className="text-lg font-heading font-bold text-farm-brown-dark leading-tight">{statInfo?.effectiveStats?.mana ?? 0}</div>
                    </div>
                  </div>
                </div>

                {statInfo && statInfo.freePoints > 0 && (
                  <button
                    onClick={() => { playSound('ui_modal_open'); setShowStatModal(true); }}
                    className="w-full mt-3 py-2 bg-gradient-to-r from-farm-green-light to-farm-green-dark text-white rounded-xl font-bold font-heading shadow-md animate-pulse border border-green-400"
                  >
                    Phân bổ {statInfo.freePoints} điểm tiềm năng!
                  </button>
                )}
              </div>

              {/* Next Skills Block (Static from template for aesthetic matching) */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
                <h3 className="font-heading font-bold text-farm-brown-dark text-lg mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-farm-green-dark">upgrade</span>
                  Kỹ năng tiếp theo
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-green-50 rounded-xl border border-green-100">
                    <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center text-2xl shadow-inner border border-green-300">💚</div>
                    <div className="flex-1">
                      <div className="font-bold text-farm-green-dark">Tái Sinh I</div>
                      <div className="text-xs text-gray-600">Hồi 5% HP mỗi lượt</div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400">lock</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center text-2xl shadow-inner border border-orange-300">🛡️</div>
                    <div className="flex-1">
                      <div className="font-bold text-orange-800">Phản Đòn I</div>
                      <div className="text-xs text-gray-600">Phản lại 10% sát thương nhận vào</div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400">lock</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center text-2xl shadow-inner border border-blue-300">✨</div>
                    <div className="flex-1">
                      <div className="font-bold text-blue-800">Tiết Kiệm I</div>
                      <div className="text-xs text-gray-600">Giảm mana khi né tránh</div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400">lock</span>
                  </div>
                </div>
              </div>

              {/* Unlocked Block (Static from template for aesthetic matching) */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
                <h3 className="font-heading font-bold text-farm-brown-dark text-lg mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-farm-carrot">military_tech</span>
                  Đã mở khóa
                </h3>
                <div className="flex items-center gap-3 p-2 bg-[#fff8e1] rounded-xl border border-yellow-200 shadow-sm">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-lg flex items-center justify-center text-2xl shadow-md border-2 border-white">🔥</div>
                  <div className="flex-1">
                    <div className="font-bold text-farm-brown-dark">Chí Mạng I</div>
                    <div className="text-xs text-gray-600">Tăng tỉ lệ bạo kích khi thu hoạch</div>
                  </div>
                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                </div>
              </div>

              {/* VIP Status Badge */}
              <VipBadge />

            </div>
          )}

          {tab === 'achievements' && (
            <div className="space-y-3 animate-fade-in">
              {/* Using original dynamic data mapped to a style closer to the new template */}
              {[
                { emoji: '🎯', name: 'Quiz Master', desc: 'Trả lời đúng 50 câu hỏi', progress: 72, total: '36/50' },
                { emoji: '🐲', name: 'Boss Slayer', desc: 'Tiêu diệt 10 Boss', progress: Math.min(100, (profile.totalBossKills / 10) * 100), total: `${profile.totalBossKills}/10` },
                { emoji: '❤️', name: 'Người thân thiện', desc: 'Thích 50 vườn bạn bè', progress: Math.min(100, (profile.likesCount / 50) * 100), total: `${profile.likesCount}/50` },
                { emoji: '💬', name: 'Người bình luận', desc: 'Bình luận 30 lần', progress: Math.min(100, (profile.commentsCount / 30) * 100), total: `${profile.commentsCount}/30` },
                { emoji: '🎁', name: 'Nhà hảo tâm', desc: 'Tặng 20 món quà', progress: Math.min(100, (profile.giftsCount / 20) * 100), total: `${profile.giftsCount}/20` },
                { emoji: '🌾', name: 'Nông dân chăm chỉ', desc: 'Thu hoạch 100 lần', progress: Math.min(100, (profile.totalHarvests / 100) * 100), total: `${profile.totalHarvests}/100` },
              ].map((a) => (
                <div key={a.name} className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50 shadow-sm flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-yellow-200"
                    style={{ background: 'linear-gradient(135deg, #fff8dc, #ffe066)' }}>{a.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-farm-brown-dark">{a.name}</p>
                    <p className="text-[10px] text-gray-500">{a.desc}</p>
                    <div className="h-1.5 rounded-full bg-gray-200 mt-1 overflow-hidden border border-gray-300">
                      <div className="h-full rounded-full bg-farm-straw transition-all" style={{ width: `${a.progress}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-farm-brown-dark whitespace-nowrap">{a.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>



      </div>

      {/* Modals from existing code */}
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

      {showResetConfirm && statInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-farm-paper border-4 border-farm-brown rounded-2xl p-5 max-w-[320px] w-full mx-4 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-2 border border-orange-200 shadow-inner">
                🔄
              </div>
              <h3 className="font-heading text-xl font-bold mb-1 text-farm-brown-dark">Reset chỉ số?</h3>
              <p className="text-sm text-farm-brown-dark/70 mb-3 font-medium">
                Tất cả điểm chỉ số sẽ được trả lại. Bạn có thể phân bổ lại tiềm năng cho nhân vật.
              </p>

              <div className="bg-white/60 border border-[#d4c5a3] rounded-xl p-3 mb-4 shadow-sm">
                <p className="text-xs text-farm-brown-dark font-bold mb-1 uppercase tracking-wide">Chi phí reset</p>
                <p className="font-heading text-2xl font-black text-farm-carrot">{formatOGN(statInfo.resetInfo.nextCost)} OGN</p>
                <p className="text-[10px] text-orange-600 mt-1 font-bold">
                  Lần reset {statInfo.resetInfo.weeklyCount + 1}/3 tuần này
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-farm-brown bg-[#e9c46a]/30 active:bg-[#e9c46a]/50 transition-colors border-2 border-transparent hover:border-[#e9c46a]"
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
                  className="flex-1 wood-btn py-2.5 rounded-xl text-sm font-bold shadow-md disabled:opacity-50"
                >
                  {resetStats.isPending ? '⏳ Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {helpStat && (
        <StatHelpModal
          stat={helpStat}
          isOpen={!!helpStat}
          onClose={() => setHelpStat(null)}
        />
      )}

      <ConversionModal isOpen={showConversion} onClose={() => setShowConversion(false)} />

      {resetError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setResetError(null)}>
          <div className="bg-farm-paper border-4 border-farm-brown rounded-2xl p-6 max-w-[320px] w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 border border-red-200">⚠️</div>
              <h3 className="font-heading text-xl font-bold mb-2 text-farm-brown-dark">Lỗi reset chỉ số</h3>
              <p className="text-sm text-farm-brown-dark/80 mb-6 font-medium">
                {resetError.code === 'INSUFFICIENT_OGN'
                  ? 'Bạn không có đủ OGN để thực hiện reset chỉ số. Vui lòng kiểm tra lại số dư.'
                  : resetError.message}
              </p>
              <button
                onClick={() => setResetError(null)}
                className="w-full wood-btn py-3 rounded-xl text-sm font-bold shadow-md"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {showWalletModal && (
        <WalletSelectModal
          mode="link"
          onSuccess={() => {
            setShowWalletModal(false);
            invalidateProfile();
            refetchWalletStatus();
          }}
          onClose={() => setShowWalletModal(false)}
        />
      )}
    </div>
  );
}
