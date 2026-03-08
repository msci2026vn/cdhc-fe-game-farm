import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNav } from '@/shared/hooks/useNav';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';
import { useBossStatus } from '@/shared/hooks/useBossStatus';
import { playSound, audioManager } from '@/shared/audio';
import { SoundToggle } from '@/shared/audio';
import { WorldBossMarquee } from '@/modules/world-boss/components/WorldBossMarquee';
import { AuctionBanner } from '@/modules/auction/components/AuctionBanner';
import { HomeParticles } from '../components/HomeParticles';

// Shared text label style — bold white with dark shadow, readable on any background
// Shared text label style — bold white with dark shadow, readable on any background
const labelClass = 'absolute left-0 right-0 text-center font-black text-white leading-tight pointer-events-none z-10'
  + ' drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] [text-shadow:0_2px_6px_rgba(0,0,0,0.9)]';

/** Simple inline gear SVG — no external dependency */
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.3.07-.62.07-.94s-.03-.63-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.07.63-.07.94s.03.63.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61z" />
    </svg>
  );
}

export default function MainMenuScreen() {
  const { t } = useTranslation();
  const navigate = useNav();
  const { data: profile } = usePlayerProfile();
  useBossStatus();

  useEffect(() => {
    audioManager.preloadScene('ui');
    audioManager.startBgm('farm_day');
    return () => { audioManager.stopBgm(); };
  }, []);

  const avatar = profile?.picture ?? '/assets/home/ava.png';
  const level = profile?.level ?? 1;
  const name = profile?.name ?? t('menu.farmer_title');
  const ogn = profile?.ogn ?? 0;

  const miniCards = [
    { emoji: '🛒', label: t('menu.shop'), route: '/shop' },
    { emoji: '🎒', label: t('menu.inventory'), route: '/inventory' },
    { emoji: '⚡', label: t('menu.auction'), route: '/auction' },
  ];

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
        {/* ── Particle effects (z-15, behind all UI) ── */}
        <HomeParticles />

        {/* ── Logo ── left:23.08% top:16.08% w:52.82% h:11.4% */}
        <div
          className="absolute pointer-events-none"
          style={{ left: '23.08%', top: '16.08%', width: '52.82%', height: '11.4%' }}
        >
          <img
            src="/assets/login/login-logo.png"
            alt="Organic Kingdom"
            className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
            draggable={false}
          />
        </div>

        {/* ── Top-right actions: Settings + Sound (z-50) ── */}
        <div
          className="absolute z-50 flex items-center gap-1"
          style={{ right: '2%', top: '0.63%' }}
        >
          {/* Settings icon */}
          <button
            aria-label="Cài đặt"
            className="flex items-center justify-center rounded-full bg-black/40 border border-[#d4c5a3]/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
            style={{ width: 28, height: 28, padding: 5 }}
            onClick={() => { playSound('ui_click'); navigate('/settings'); }}
          >
            <GearIcon />
          </button>

          {/* Sound toggle */}
          <SoundToggle className="w-7 h-7 rounded-full bg-black/40 border border-[#d4c5a3]/40 flex items-center justify-center" />
        </div>

        {/* World Boss marquee */}
        <div className="absolute z-40 top-16 w-full pointer-events-none">
          <WorldBossMarquee />
        </div>

        {/* Auction banner — when session starting < 1h */}
        <div className="absolute z-30 w-full px-4" style={{ top: '12.5%' }}>
          <AuctionBanner />
        </div>

        {/* ── CARD: Trồng cây ── */}
        <div
          className="absolute cursor-pointer hover:-translate-y-1 transition-transform"
          style={{ left: '13.9%', top: '26.6%', width: '33.6%', height: '20.3%' }}
          onClick={() => { playSound('ui_click'); navigate('/farm'); }}
        >
          <img src="/assets/home/3.png" alt="nong-trai" className="absolute inset-0 w-full h-full object-fill" />
          <span className={`${labelClass} text-[13px]`} style={{ bottom: '20%' }}>🌱 {t('menu.farm')}</span>
        </div>

        {/* ── CARD: World Boss ── */}
        <div
          className="absolute cursor-pointer hover:-translate-y-1 transition-transform"
          style={{ left: '52.5%', top: '26.6%', width: '35.3%', height: '20.5%' }}
          onClick={() => { playSound('ui_click'); navigate('/world-boss'); }}
        >
          <img src="/assets/home/2.png" alt="boss-word" className="absolute inset-0 w-full h-full object-fill" />
          <span className={`${labelClass} text-[13px]`} style={{ bottom: '20%' }}>👹 {t('menu.world_boss')}</span>
        </div>

        {/* ── CARD: Chiến dịch ── */}
        <div
          className="absolute cursor-pointer hover:-translate-y-1 transition-transform"
          style={{ left: '13.9%', top: '47.9%', width: '33.9%', height: '19.4%' }}
          onClick={() => { playSound('ui_click'); navigate('/campaign'); }}
        >
          <img src="/assets/home/1.png" alt="camping" className="absolute inset-0 w-full h-full object-fill" />
          <span className={`${labelClass} text-[13px]`} style={{ bottom: '20%' }}>⚔️ {t('menu.campaign')}</span>
        </div>

        {/* ── CARD: Học tập ── */}
        <div
          className="absolute cursor-pointer hover:-translate-y-1 transition-transform"
          style={{ left: '52.8%', top: '47.9%', width: '35%', height: '19.8%' }}
          onClick={() => { playSound('ui_click'); navigate('/quiz'); }}
        >
          <img src="/assets/home/4.png" alt="quizz" className="absolute inset-0 w-full h-full object-fill" />
          <span className={`${labelClass} text-[13px]`} style={{ bottom: '20%' }}>📚 {t('menu.quiz')}</span>
        </div>

        {/* ── MINI CARDS: Chợ / Túi đồ / Bạn bè ── */}
        {miniCards.map(({ emoji, label, route }, i) => (
          <div
            key={route}
            className="absolute cursor-pointer hover:-translate-y-1 transition-transform"
            style={{ left: `${9 + i * 28.7}%`, top: '68.5%', width: '25%', height: '13%' }}
            onClick={() => { playSound('ui_click'); navigate(route); }}
          >
            <div
              className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-1"
              style={{
                background: 'linear-gradient(160deg, #d4a84b 0%, #9c6325 55%, #6b3e12 100%)',
                border: '2.5px solid #4a2a08',
                boxShadow: 'inset 0 1px 0 rgba(255,230,130,0.5), inset 0 -2px 0 rgba(0,0,0,0.3), 0 5px 12px rgba(0,0,0,0.55)',
              }}
            >
              <span className="text-[26px] leading-none drop-shadow-md">{emoji}</span>
              <span
                className="text-[11px] font-black text-white leading-none"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)', letterSpacing: '0.02em' }}
              >
                {label}
              </span>
            </div>
          </div>
        ))}

        {/* ── BAR: IoT / Vườn thông minh ── */}
        <div
          className="absolute cursor-pointer hover:-translate-y-0.5 transition-transform"
          style={{ left: '10%', top: '83.8%', width: '81.4%', height: '7%' }}
          onClick={() => { playSound('ui_click'); navigate('/rwa/my-garden'); }}
        >
          <img src="/assets/home/5.png" alt="iot" className="absolute inset-0 w-full h-full object-fill" />
          <span className={`${labelClass} text-[12px]`} style={{ top: '50%', transform: 'translateY(-50%)' }}>
            📡 {t('menu.iot_garden')}
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
            👑 {t('menu.vip_upgrade')}
          </span>
        </div>

        {/* ── Hồ sơ nông dân — avatar + level + nickname ── */}
        <div
          className="absolute cursor-pointer flex items-center"
          style={{ left: '3.6%', top: '1.9%', width: '63%', height: '11.4%', gap: '8px', paddingLeft: '6px' }}
          onClick={() => { playSound('ui_click'); navigate('/profile'); }}
        >
          {/* Avatar circle with level badge */}
          <div className="relative flex-shrink-0" style={{ width: '44px', height: '44px' }}>
            <img
              src={avatar}
              alt="avatar"
              className="w-full h-full rounded-full object-cover"
              style={{ border: '2px solid #f6c94e', boxShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              onError={(e) => { e.currentTarget.src = '/assets/home/ava.png'; }}
            />
            {/* Level badge */}
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center border border-yellow-200"
              style={{
                width: '20px', height: '14px',
                fontSize: '8px', fontWeight: 900,
                color: '#3a1f00', lineHeight: 1,
                background: 'linear-gradient(135deg, #f6c94e, #e09a10)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}
            >
              {level}
            </div>
          </div>

          {/* Name + Level text */}
          <div className="flex flex-col justify-center min-w-0">
            <span
              className="font-black text-white leading-tight truncate"
              style={{ fontSize: '11px', textShadow: '0 1px 4px rgba(0,0,0,0.95)', maxWidth: '110px' }}
            >
              {name}
            </span>
            <span
              className="font-bold text-yellow-300 leading-tight"
              style={{ fontSize: '10px', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
            >
              Lv.{level} {t('menu.farmer_title')}
            </span>
          </div>
        </div>

        {/* ── OGN balance (top-right) ── */}
        <div
          className="absolute cursor-pointer flex items-center justify-center"
          style={{ left: '67%', top: '4.5%', width: '25%', height: '5%' }}
          onClick={() => { playSound('ui_click'); navigate('/profile'); }}
        >
          <span
            className="font-black text-yellow-300 leading-tight whitespace-nowrap"
            style={{ fontSize: '11px', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            💰 {ogn.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
