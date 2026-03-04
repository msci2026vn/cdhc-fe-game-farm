import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';
import { useBossStatus } from '@/shared/hooks/useBossStatus';
import { playSound, audioManager } from '@/shared/audio';
import { SoundToggle } from '@/shared/audio';
import { WorldBossMarquee } from '@/modules/world-boss/components/WorldBossMarquee';

// Shared text label style — bold white with dark shadow, readable on any background
const labelClass = 'absolute left-0 right-0 text-center font-black text-white leading-tight pointer-events-none z-10'
  + ' drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] [text-shadow:0_2px_6px_rgba(0,0,0,0.9)]';

export default function MainMenuScreen() {
  const navigate = useNavigate();
  usePlayerProfile();
  useBossStatus();

  useEffect(() => {
    audioManager.preloadScene('ui');
    audioManager.startBgm('farm_day');
    return () => { audioManager.stopBgm(); };
  }, []);

  return (
    <div className="bg-[#111] min-h-[100dvh] flex items-center justify-center select-none font-body text-farm-brown-dark">
      <div
        className="relative overflow-hidden w-full max-w-[430px] mx-auto min-h-[100dvh] shadow-2xl"
        style={{
          backgroundImage: 'url(/assets/home/nen.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Sound toggle */}
        <div className="absolute z-50 px-4 w-full flex justify-end" style={{ top: 'max(env(safe-area-inset-top, 8px), 16px)' }}>
          <SoundToggle className="w-8 h-8 rounded-full bg-black/40 border border-[#d4c5a3]/40 flex items-center justify-center" />
        </div>

        {/* World Boss marquee */}
        <div className="absolute z-40 top-16 w-full pointer-events-none">
          <WorldBossMarquee />
        </div>

        {/* ── CARD: Trồng cây ── */}
        <div
          className="absolute cursor-pointer hover:-translate-y-1 transition-transform"
          style={{ left: '13.9%', top: '26.6%', width: '33.6%', height: '20.3%' }}
          onClick={() => { playSound('ui_click'); navigate('/farm'); }}
        >
          <img src="/assets/home/3.png" alt="nong-trai" className="absolute inset-0 w-full h-full object-fill" />
          <span className={`${labelClass} text-[13px]`} style={{ bottom: '12%' }}>🌱 Trồng cây</span>
        </div>

        {/* ── CARD: World Boss ── */}
        <div
          className="absolute cursor-pointer hover:-translate-y-1 transition-transform"
          style={{ left: '52.5%', top: '26.6%', width: '35.3%', height: '20.5%' }}
          onClick={() => { playSound('ui_click'); navigate('/boss'); }}
        >
          <img src="/assets/home/2.png" alt="boss-word" className="absolute inset-0 w-full h-full object-fill" />
          <span className={`${labelClass} text-[13px]`} style={{ bottom: '12%' }}>👹 Boss</span>
        </div>

        {/* ── CARD: Chiến dịch ── */}
        <div
          className="absolute cursor-pointer hover:-translate-y-1 transition-transform"
          style={{ left: '13.9%', top: '47.9%', width: '33.9%', height: '19.4%' }}
          onClick={() => { playSound('ui_click'); navigate('/campaign'); }}
        >
          <img src="/assets/home/1.png" alt="camping" className="absolute inset-0 w-full h-full object-fill" />
          <span className={`${labelClass} text-[13px]`} style={{ bottom: '12%' }}>⚔️ Chiến dịch</span>
        </div>

        {/* ── CARD: Học tập ── */}
        <div
          className="absolute cursor-pointer hover:-translate-y-1 transition-transform"
          style={{ left: '52.8%', top: '47.9%', width: '35%', height: '19.8%' }}
          onClick={() => { playSound('ui_click'); navigate('/quiz'); }}
        >
          <img src="/assets/home/4.png" alt="quizz" className="absolute inset-0 w-full h-full object-fill" />
          <span className={`${labelClass} text-[13px]`} style={{ bottom: '12%' }}>📚 Học tập</span>
        </div>

        {/* ── BAR: IoT / Vườn thông minh ── */}
        <div
          className="absolute cursor-pointer hover:-translate-y-0.5 transition-transform"
          style={{ left: '10%', top: '83.8%', width: '81.4%', height: '7%' }}
          onClick={() => { playSound('ui_click'); navigate('/rwa/my-garden'); }}
        >
          <img src="/assets/home/5.png" alt="iot" className="absolute inset-0 w-full h-full object-fill" />
          <span className={`${labelClass} text-[12px]`} style={{ top: '50%', transform: 'translateY(-50%)' }}>
            📡 IoT — Vườn thông minh
          </span>
        </div>

        {/* ── BAR: VIP ── */}
        <div
          className="absolute cursor-pointer hover:-translate-y-0.5 transition-transform"
          style={{ left: '10.3%', top: '91.1%', width: '81.1%', height: '6.4%' }}
          onClick={() => { playSound('ui_click'); navigate('/vip/purchase'); }}
        >
          <img src="/assets/home/6.png" alt="vip" className="absolute inset-0 w-full h-full object-fill" />
          <span className={`${labelClass} text-[12px]`} style={{ top: '50%', transform: 'translateY(-50%)' }}>
            👑 VIP — Nâng cấp
          </span>
        </div>

        {/* ── Chợ ── */}
        <div
          className="absolute cursor-pointer"
          style={{ left: '8.9%', top: '68.6%', width: '25.6%', height: '14.8%' }}
          onClick={() => { playSound('ui_click'); navigate('/market'); }}
        >
          <span className={`${labelClass} text-[11px] font-black`} style={{ bottom: '6%' }}>🛒 Chợ</span>
        </div>

        {/* ── Túi đồ ── */}
        <div
          className="absolute cursor-pointer"
          style={{ left: '38.9%', top: '68.5%', width: '24.2%', height: '14.8%' }}
          onClick={() => { playSound('ui_click'); navigate('/inventory'); }}
        >
          <span className={`${labelClass} text-[11px] font-black`} style={{ bottom: '6%' }}>🎒 Túi đồ</span>
        </div>

        {/* ── Bạn bè ── */}
        <div
          className="absolute cursor-pointer"
          style={{ left: '66.9%', top: '68.3%', width: '25.8%', height: '15%' }}
          onClick={() => { playSound('ui_click'); navigate('/friends'); }}
        >
          <span className={`${labelClass} text-[11px] font-black`} style={{ bottom: '6%' }}>👥 Bạn bè</span>
        </div>

        {/* ── Cài đặt ── (nhỏ, top-right) */}
        <div
          className="absolute cursor-pointer flex items-center justify-center"
          style={{ left: '90.6%', top: '1.4%', width: '7.5%', height: '3.9%' }}
          onClick={() => { playSound('ui_click'); navigate('/settings'); }}
        />

        {/* ── Hồ sơ (top bar areas) ── */}
        <div
          className="absolute cursor-pointer"
          style={{ left: '72.8%', top: '5.8%', width: '24.7%', height: '3.4%' }}
          onClick={() => { playSound('ui_click'); navigate('/profile'); }}
        />
        <div
          className="absolute cursor-pointer"
          style={{ left: '72.2%', top: '9.4%', width: '25.6%', height: '3.6%' }}
          onClick={() => { playSound('ui_click'); navigate('/profile'); }}
        />
        <div
          className="absolute cursor-pointer"
          style={{ left: '3.6%', top: '1.9%', width: '63.3%', height: '11.4%' }}
          onClick={() => { playSound('ui_click'); navigate('/profile'); }}
        />
      </div>
    </div>
  );
}
