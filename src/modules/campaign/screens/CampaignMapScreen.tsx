import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CampaignHeader from '../components/CampaignHeader';
import MapBackground from '../components/MapBackground';
import ZoneNode from '../components/ZoneNode';
import { useCampaignZones } from '../hooks/useCampaignZones';
import { ZONE_META, ZONE_POSITIONS } from '../data/zones';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';
import { playSound, audioManager } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

/**
 * CampaignMapScreen — Vertical scroll map of 10 zones.
 * Bottom (V1) → Top (V10). Auto-scrolls to current open zone.
 * Custom fullscreen layout (no ScreenShell).
 */
export default function CampaignMapScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: zonesData, isLoading, error } = useCampaignZones();
  const { data: profile } = usePlayerProfile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentZoneRef = useRef<HTMLDivElement>(null);

  const zones = zonesData?.zones ?? [];

  // Total stars across all zones
  const totalStars = useMemo(() => zones.reduce((sum, z) => sum + z.totalStars, 0), [zones]);
  const maxStars = useMemo(() => zones.reduce((sum, z) => sum + z.maxStars, 0), [zones]);

  // Find current open zone (first unlocked but not cleared)
  const currentZoneNumber = useMemo(() => {
    const openZone = zones.find(z => z.isUnlocked && !z.isZoneCleared);
    return openZone?.zoneNumber ?? 1;
  }, [zones]);

  // BGM
  useEffect(() => {
    audioManager.preloadScene('campaign');
    audioManager.startBgm('campaign_map');
    return () => { audioManager.stopBgm(); };
  }, []);

  // Auto-scroll to current zone on mount
  useEffect(() => {
    if (currentZoneRef.current) {
      setTimeout(() => {
        currentZoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [zones.length]);

  // Loading
  if (isLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center campaign-map-gradient">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80 font-heading font-bold text-sm">{t('campaign.screens.loading_map')}</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="h-[100dvh] flex items-center justify-center campaign-map-gradient">
        <div className="text-center px-6">
          <span className="text-5xl mb-4 block">😵</span>
          <p className="text-red-300 font-heading font-bold mb-2">{t('campaign.screens.error_loading_map')}</p>
          <p className="text-white/40 text-xs mb-4">{String(error)}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-gold px-6 py-2 rounded-xl font-heading font-bold text-sm text-white"
          >
            {t('campaign.screens.back_to_main_menu')}
          </button>
        </div>
      </div>
    );
  }

  // Reversed zones for bottom-to-top display (V1 at bottom, V10 at top)
  const zonesReversed = [...zones].sort((a, b) => b.zoneNumber - a.zoneNumber);

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto relative overflow-hidden flex flex-col">
      {/* Header */}
      <CampaignHeader
        title={t('campaign.map.title')}
        stars={totalStars}
        maxStars={maxStars}
        backTo="/"
      />

      {/* Scrollable map area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden pt-20 pb-28"
        style={{ scrollBehavior: 'smooth' }}
      >
        <MapBackground className="campaign-map-gradient">
          {/* SVG path connecting zones */}
          <svg
            className="absolute inset-0 w-full pointer-events-none z-0"
            style={{ height: `${zonesReversed.length * 140 + 200}px` }}
            viewBox={`0 0 390 ${zonesReversed.length * 140 + 200}`}
            preserveAspectRatio="none"
          >
            {zonesReversed.map((_, idx) => {
              if (idx === zonesReversed.length - 1) return null;
              const y1 = idx * 140 + 120;
              const y2 = (idx + 1) * 140 + 120;
              // Zigzag: alternate x positions
              const zone = zonesReversed[idx];
              const nextZone = zonesReversed[idx + 1];
              const x1 = getZoneX(zone.zoneNumber);
              const x2 = getZoneX(nextZone.zoneNumber);

              return (
                <g key={idx}>
                  {/* Shadow */}
                  <path
                    d={`M ${x1} ${y1} C ${x1} ${y1 + 40}, ${x2} ${y2 - 40}, ${x2} ${y2}`}
                    fill="none"
                    stroke="rgba(0,0,0,0.15)"
                    strokeWidth={12}
                    strokeDasharray="10, 15"
                    strokeLinecap="round"
                  />
                  {/* Main path */}
                  <path
                    d={`M ${x1} ${y1} C ${x1} ${y1 + 40}, ${x2} ${y2 - 40}, ${x2} ${y2}`}
                    fill="none"
                    stroke="#F5E6D3"
                    strokeWidth={6}
                    strokeDasharray="10, 15"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
          </svg>

          {/* Zone nodes */}
          <div
            className="relative z-10 flex flex-col items-stretch gap-8 px-6 py-12"
            style={{ minHeight: `${zonesReversed.length * 140 + 100}px` }}
          >
            {zonesReversed.map((zone) => {
              const posClass = ZONE_POSITIONS[zone.zoneNumber] || 'self-center';
              const isCurrentZone = zone.zoneNumber === currentZoneNumber;

              return (
                <div
                  key={zone.zoneNumber}
                  ref={isCurrentZone ? currentZoneRef : undefined}
                  className={`flex ${posClass}`}
                >
                  <ZoneNode
                    zone={zone}
                    onClick={() => {
                      if (zone.isUnlocked) {
                        playSound('ui_click');
                        navigate(`/campaign/${zone.zoneNumber}`);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </MapBackground>
      </div>

      {/* Bottom navigation dock */}
      <CampaignBottomNav />
    </div>
  );
}

/** Get X position for zone in SVG coordinate space (390px wide) */
function getZoneX(zoneNumber: number): number {
  // Zigzag pattern: center → right → left → right → left...
  switch (zoneNumber) {
    case 1: return 195;  // center
    case 2: return 290;  // right
    case 3: return 100;  // left
    case 4: return 290;  // right
    case 5: return 100;  // left
    case 6: return 290;  // right
    case 7: return 100;  // left
    case 8: return 290;  // right
    case 9: return 100;  // left
    case 10: return 195; // center
    default: return 195;
  }
}

/** Simple bottom nav for campaign screens */
function CampaignBottomNav() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tabs = [
    { icon: 'home', label: t('campaign.map.tabs.menu'), to: '/', active: false },
    { icon: 'map', label: t('campaign.map.tabs.map'), to: '/campaign', active: true },
    { icon: 'bolt', label: t('campaign.map.tabs.skills'), to: '/campaign/skills', active: false },
    { icon: 'spa', label: t('campaign.map.tabs.farm'), to: '/farm', active: false },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[94%] max-w-md z-50">
      <div className="absolute inset-0 bg-[#DEB887] rounded-full border-4 border-[#8B4513] shadow-[0_8px_0_#5D4037,0_15px_20px_rgba(0,0,0,0.3)] wood-pattern-v1" />
      {/* Nail dots */}
      <div className="absolute top-1/2 left-2 w-2 h-2 bg-[#5D4037] rounded-full transform -translate-y-1/2 shadow-inner" />
      <div className="absolute top-1/2 right-2 w-2 h-2 bg-[#5D4037] rounded-full transform -translate-y-1/2 shadow-inner" />

      <div className="relative flex justify-between items-center px-4 py-3">
        {tabs.map((tab) => (
          <button
            key={tab.to}
            onClick={() => { playSound('ui_tab'); navigate(tab.to); }}
            className={`flex flex-col items-center gap-1 w-12 group ${tab.active ? '' : 'opacity-70 hover:opacity-100 transition-opacity'}`}
          >
            {tab.active ? (
              <div className="w-10 h-10 rounded-full bg-[#8B4513] border-2 border-[#DEB887] flex items-center justify-center shadow-inner transform -translate-y-2 transition-all duration-200">
                <span className="material-symbols-outlined text-[#90EE90] text-xl">{tab.icon}</span>
              </div>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#8B4513] text-2xl group-hover:scale-110 transition-transform">{tab.icon}</span>
              </div>
            )}
            <span className={`text-[8px] font-bold ${tab.active ? 'font-black text-[#5D4037] uppercase tracking-tighter' : 'text-[#8B4513]'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
