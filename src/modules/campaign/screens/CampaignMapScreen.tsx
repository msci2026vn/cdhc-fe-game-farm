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
    <div className="h-[100dvh] max-w-[430px] mx-auto relative overflow-hidden flex flex-col campaign-map-gradient">
      {/* Header */}
      <CampaignHeader
        title="CHIẾN DỊCH"
        stars={totalStars}
        maxStars={maxStars}
        backTo="/"
      />

      {/* Static Map Area */}
      <div className="flex-1 relative overflow-hidden">
        <MapBackground className="">
          {/* Zone nodes */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {zones.map((zone) => {
              const pos = ZONE_POSITIONS[zone.zoneNumber] || { top: '50%', left: '50%' };
              const isCurrentZone = zone.zoneNumber === currentZoneNumber;

              return (
                <div
                  key={zone.zoneNumber}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                  style={{ top: pos.top, left: pos.left }}
                >
                  <ZoneNode
                    zone={zone}
                    isCurrentZone={isCurrentZone}
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

  const tabs = [
    { img: '/assets/campaign/btn_home.png', label: 'MENU', to: '/', active: false },
    { img: '/assets/campaign/btn_map.png', label: 'MAP', to: '/campaign', active: true },
    { img: '/assets/campaign/btn_skill.png', label: 'SKILL', to: '/campaign/skills', active: false },
    { img: '/assets/campaign/btn_farm.png', label: 'FARM', to: '/farm', active: false },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] z-50 pb-[max(4px,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="relative flex justify-evenly items-center px-2 py-4 pointer-events-auto">
        {tabs.map((tab) => (
          <button
            key={tab.to}
            onClick={() => { playSound('ui_tab'); navigate(tab.to); }}
            className={`relative flex items-center justify-center group transition-all duration-200 ${tab.active ? 'scale-110' : 'opacity-85 hover:opacity-100 grayscale-[20%]'}`}
          >
            <div className="relative w-20 h-20 flex flex-col items-center justify-center translate-y-[-4px]">
              <img 
                src={tab.img} 
                alt={tab.label} 
                className={`w-full h-full object-contain ${tab.active ? 'drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]' : 'drop-shadow-md'}`}
              />
              <span className={`absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-game uppercase tracking-tight whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${tab.active ? 'text-yellow-300' : 'text-white/90'}`}>
                {tab.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
}


