import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerCard from '@/shared/components/PlayerCard';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';
import { useBossStatus } from '@/shared/hooks/useBossStatus';
import { playSound, audioManager } from '@/shared/audio';
import { SoundToggle } from '@/shared/audio';
import { WorldBossMarquee } from '@/modules/world-boss/components/WorldBossMarquee';

interface MenuItem {
  icon: string;
  label: string;
  to: string;
  color: string;
  borderColor: string;
  description: string;
  badge?: number | string | null;
}

export default function MainMenuScreen() {
  const navigate = useNavigate();
  const { data: profile } = usePlayerProfile();
  const { data: bossStatus } = useBossStatus();

  // BGM
  useEffect(() => {
    audioManager.preloadScene('ui');
    audioManager.startBgm('farm_day');
    return () => { audioManager.stopBgm(); };
  }, []);

  const menuItems: MenuItem[] = [
    {
      icon: 'spa',
      label: 'Nông Trại',
      to: '/farm',
      color: 'from-green-400 to-green-600',
      borderColor: 'border-green-700/30',
      description: 'Trồng cây, thu hoạch',
    },
    {
      icon: 'map',
      label: 'Chiến Dịch',
      to: '/campaign',
      color: 'from-indigo-400 to-indigo-600',
      borderColor: 'border-indigo-700/30',
      description: '10 vùng, 40 boss',
    },
    {
      icon: 'skull',
      label: 'Boss Tuần',
      to: '/boss',
      color: 'from-red-400 to-red-600',
      borderColor: 'border-red-700/30',
      description: 'Boss hàng tuần',
      badge: bossStatus?.canFight ? '!' : null,
    },
    {
      icon: 'self_improvement',
      label: 'Cầu Nguyện',
      to: '/prayer',
      color: 'from-amber-400 to-amber-600',
      borderColor: 'border-amber-700/30',
      description: 'Cầu phước lành',
    },
    {
      icon: 'quiz',
      label: 'Đố Vui',
      to: '/quiz',
      color: 'from-cyan-400 to-cyan-600',
      borderColor: 'border-cyan-700/30',
      description: 'Trả lời câu hỏi',
    },
    {
      icon: 'storefront',
      label: 'Chợ',
      to: '/market',
      color: 'from-orange-400 to-orange-600',
      borderColor: 'border-orange-700/30',
      description: 'Mua bán vật phẩm',
    },
  ];

  const secondaryItems: MenuItem[] = [
    {
      icon: 'person',
      label: 'Hồ Sơ',
      to: '/profile',
      color: 'from-emerald-400 to-emerald-600',
      borderColor: 'border-emerald-700/30',
      description: 'Thống kê & ví',
    },
    {
      icon: 'inventory_2',
      label: 'Kho Đồ',
      to: '/inventory',
      color: 'from-yellow-500 to-yellow-700',
      borderColor: 'border-yellow-800/30',
      description: 'Vật phẩm của bạn',
    },
    {
      icon: 'group',
      label: 'Bạn Bè',
      to: '/friends',
      color: 'from-pink-400 to-pink-600',
      borderColor: 'border-pink-700/30',
      description: 'Thăm vườn bạn',
    },
    {
      icon: 'settings',
      label: 'Cài Đặt',
      to: '/settings',
      color: 'from-gray-400 to-gray-600',
      borderColor: 'border-gray-700/30',
      description: 'Bảo mật & app',
    },
  ];

  return (
    <div className="bg-background-light min-h-[100dvh] text-farm-brown-dark font-body select-none">
      <div className="max-w-[430px] mx-auto min-h-[100dvh] relative bg-farm-vibe shadow-2xl overflow-hidden">

        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-60px] left-[-40px] w-72 h-72 bg-green-200 rounded-full blur-[80px] opacity-30" />
          <div className="absolute bottom-[-40px] right-[-40px] w-80 h-80 bg-yellow-100 rounded-full blur-[60px] opacity-50" />
          <span className="material-symbols-outlined absolute top-16 right-8 text-green-800/8 text-7xl transform rotate-12">local_florist</span>
          <span className="material-symbols-outlined absolute bottom-32 left-6 text-green-800/8 text-5xl transform -rotate-12">park</span>
          <span className="material-symbols-outlined absolute top-[40%] left-[10%] text-yellow-800/5 text-6xl">wb_sunny</span>
        </div>

        {/* Safe area top + Sound toggle */}
        <div className="relative z-10 px-4 flex justify-between items-center" style={{ paddingTop: 'max(env(safe-area-inset-top, 8px), 16px)' }}>
          <div />
          <SoundToggle className="w-9 h-9 rounded-xl bg-white/60 border border-[#d4c5a3] flex items-center justify-center shadow-sm" />
        </div>

        {/* Title */}
        <div className="relative z-10 text-center mt-2 mb-4">
          <div className="inline-block">
            <h1 className="font-heading font-black text-xl text-[#5D4037] tracking-tight">
              ORGANIC KINGDOM
            </h1>
            <div className="text-[10px] font-bold text-[#8B4513]/60 uppercase tracking-[0.3em]">
              Farmverse
            </div>
          </div>
        </div>

        {/* Player Card */}
        <div className="relative z-10 px-4 mb-5">
          <PlayerCard />
        </div>

        {/* World Boss Alert Banner */}
        <WorldBossMarquee />

        {/* Main Menu Grid — 3x2 */}
        <div className="relative z-10 px-4 mb-4">
          <div className="grid grid-cols-3 gap-2.5">
            {menuItems.map((item) => (
              <button
                key={item.to}
                onClick={() => { playSound('ui_click'); navigate(item.to); }}
                className="relative bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-white/50 shadow-sm p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-all hover:shadow-md group"
              >
                {/* Icon circle */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} ${item.borderColor} border flex items-center justify-center shadow-md group-active:shadow-sm transition-shadow`}>
                  <span className="material-symbols-outlined text-white text-2xl drop-shadow-sm">{item.icon}</span>
                </div>
                {/* Label */}
                <span className="font-heading font-bold text-[11px] text-[#5D4037] leading-tight text-center">
                  {item.label}
                </span>
                <span className="text-[8px] text-[#8B4513]/50 font-medium leading-tight text-center">
                  {item.description}
                </span>
                {/* Badge */}
                {item.badge && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <span className="text-white text-[8px] font-black">{item.badge}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Row — 4 items horizontal */}
        <div className="relative z-10 px-4 mb-4">
          <div className="grid grid-cols-4 gap-2">
            {secondaryItems.map((item) => (
              <button
                key={item.to}
                onClick={() => { playSound('ui_click'); navigate(item.to); }}
                className="bg-white/50 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm p-2 flex flex-col items-center gap-1 active:scale-95 transition-all"
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm`}>
                  <span className="material-symbols-outlined text-white text-lg">{item.icon}</span>
                </div>
                <span className="font-heading font-bold text-[9px] text-[#5D4037] text-center leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="relative z-10 px-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => { playSound('ui_click'); navigate('/rwa/my-garden'); }}
              className="flex-1 bg-[#e8f5e9] border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2 active:scale-95 transition-transform shadow-sm"
            >
              <span className="material-symbols-outlined text-green-700 text-lg">yard</span>
              <div className="text-left">
                <div className="text-[10px] font-bold text-green-800">Vườn IoT</div>
                <div className="text-[8px] text-green-600">Sensor thực</div>
              </div>
            </button>
            <button
              onClick={() => { playSound('ui_click'); navigate('/vip/purchase'); }}
              className="flex-1 bg-[#fff8e1] border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2 active:scale-95 transition-transform shadow-sm"
            >
              <span className="material-symbols-outlined text-amber-700 text-lg">workspace_premium</span>
              <div className="text-left">
                <div className="text-[10px] font-bold text-amber-800">VIP</div>
                <div className="text-[8px] text-amber-600">Nâng cấp tài khoản</div>
              </div>
            </button>
          </div>
        </div>

        {/* Version footer */}
        <div className="relative z-10 text-center pb-8">
          <p className="text-[9px] text-[#8B4513]/30 font-bold">
            v1.2.0 | Hackathon 2026
          </p>
        </div>
      </div>
    </div>
  );
}
