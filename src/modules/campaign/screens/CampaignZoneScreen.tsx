import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CampaignHeader from '../components/CampaignHeader';
import StageNode from '../components/StageNode';
import BossNode from '../components/BossNode';
import BossDetailSheet from '../components/BossDetailSheet';
import { useZoneBosses } from '../hooks/useZoneBosses';
import { ZONE_META } from '../data/zones';
import type { StageState, ZoneBoss } from '../types/campaign.types';
import { playSound, audioManager } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

/**
 * CampaignZoneScreen — Zone detail with 4 stages (3 minions/elites + 1 boss).
 * Matches the HTML template layout: bottom-to-top, zigzag path, boss at top.
 * Click stage → BossDetailSheet popup → confirm → navigate to combat.
 */
export default function CampaignZoneScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { zoneNumber: zoneParam } = useParams<{ zoneNumber: string }>();
  const zoneNumber = parseInt(zoneParam || '1', 10);

  const { data, isLoading, error } = useZoneBosses(zoneNumber);
  const zone = data?.zone ?? null;
  const bosses = data?.bosses ?? [];
  const meta = ZONE_META[zoneNumber];

  // BGM — share campaign_map music
  useEffect(() => {
    audioManager.preloadScene('campaign');
    audioManager.startBgm('campaign_map');
    return () => { audioManager.stopBgm(); };
  }, []);

  // Boss detail sheet state
  const [selectedBoss, setSelectedBoss] = useState<ZoneBoss | null>(null);

  // Determine state for each stage
  const getStageState = (boss: ZoneBoss): StageState => {
    if (boss.isCleared) return 'completed';
    if (boss.isUnlocked) return 'current';
    return 'locked';
  };

  // Separate regular bosses from zone boss
  const regularBosses = useMemo(
    () => bosses.filter(b => b.tier !== 'boss').sort((a, b) => a.bossNumber - b.bossNumber),
    [bosses]
  );
  const zoneBoss = useMemo(
    () => bosses.find(b => b.tier === 'boss') ?? null,
    [bosses]
  );

  // Click stage/boss → open BossDetailSheet
  const handleStageClick = (boss: ZoneBoss) => {
    if (!boss.isUnlocked) return;
    setSelectedBoss(boss);
  };

  // Confirm fight → close sheet → navigate to combat
  const handleFight = (bossId: string) => {
    setSelectedBoss(null);
    navigate(`/campaign/battle/${bossId}?zoneName=${encodeURIComponent(zone?.name || meta?.name || '')}&zoneNumber=${zoneNumber}`);
  };

  // Loading
  if (isLoading) {
    return (
      <div className={`h-[100dvh] flex items-center justify-center ${meta?.bgClass || 'zone-bg-1'}`}>
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80 font-heading font-bold text-sm">{t('campaign.screens.loading_zone')}</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className={`h-[100dvh] flex items-center justify-center ${meta?.bgClass || 'zone-bg-1'}`}>
        <div className="text-center px-6">
          <span className="text-5xl mb-4 block">😵</span>
          <p className="text-red-300 font-heading font-bold mb-2">{t('campaign.screens.error_loading_zone')}</p>
          <p className="text-white/40 text-xs mb-4">{String(error)}</p>
          <button
            onClick={() => navigate('/campaign')}
            className="btn-gold px-6 py-2 rounded-xl font-heading font-bold text-sm text-white"
          >
            {t('campaign.screens.back_to_map')}
          </button>
        </div>
      </div>
    );
  }

  const totalStars = zone?.totalStars ?? 0;
  const maxStars = zone?.maxStars ?? 12;

  return (
    <div className={`h-[100dvh] max-w-[430px] mx-auto relative overflow-hidden flex flex-col ${meta?.bgClass || 'zone-bg-1'}`}>
      {/* Header */}
      <CampaignHeader
        title={`Vùng ${zoneNumber} : ${zone?.name || meta?.name || ''}`}
        stars={totalStars}
        maxStars={maxStars}
        backTo="/campaign"
      />

      {/* Main map area */}
      <div className="flex-1 overflow-hidden relative pt-20 pb-28">
        {/* Tree decorations */}
        <div className="absolute top-[15%] left-[5%] text-3xl opacity-25 pointer-events-none">🌳</div>
        <div className="absolute top-[45%] right-[5%] text-3xl opacity-25 pointer-events-none">🌳</div>
        <div className="absolute bottom-[20%] left-[8%] text-2xl opacity-20 pointer-events-none">🌲</div>
        <div className="absolute top-[70%] right-[10%] text-2xl opacity-20 pointer-events-none">🌲</div>

        <div className="absolute top-[70%] right-[10%] text-2xl opacity-20 pointer-events-none">🌲</div>

        {/* Stage 1 (Minion #1): center bottom */}
        {regularBosses[0] && (
          <div className="absolute z-10" style={{ left: '70%', bottom: '85px', transform: 'translateX(-50%)' }}>
            <StageNode
              boss={regularBosses[0]}
              state={getStageState(regularBosses[0])}
              globalBossNumber={(zoneNumber - 1) * 4 + regularBosses[0].bossNumber}
              onClick={() => handleStageClick(regularBosses[0])}
            />
          </div>
        )}

        {/* Stage 2 (Minion #2): left */}
        {regularBosses[1] && (
          <div className="absolute z-10" style={{ left: '25%', bottom: '180px', transform: 'translateX(-50%)' }}>
            <StageNode
              boss={regularBosses[1]}
              state={getStageState(regularBosses[1])}
              globalBossNumber={(zoneNumber - 1) * 4 + regularBosses[1].bossNumber}
              onClick={() => handleStageClick(regularBosses[1])}
            />
          </div>
        )}

        {/* Stage 3 (Elite): right */}
        {regularBosses[2] && (
          <div className="absolute z-10" style={{ right: '25%', bottom: '250px', transform: 'translateX(50%)' }}>
            <StageNode
              boss={regularBosses[2]}
              state={getStageState(regularBosses[2])}
              globalBossNumber={(zoneNumber - 1) * 4 + regularBosses[2].bossNumber}
              onClick={() => handleStageClick(regularBosses[2])}
            />
          </div>
        )}

        {/* Boss: center top */}
        {zoneBoss && (
          <div className="absolute z-10" style={{ left: '50%', top: '120px', transform: 'translateX(-50%)' }}>
            <BossNode
              boss={zoneBoss}
              state={getStageState(zoneBoss)}
              globalBossNumber={(zoneNumber - 1) * 4 + zoneBoss.bossNumber}
              onClick={() => handleStageClick(zoneBoss)}
            />
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <ZoneBottomNav />

      {/* Boss Detail Sheet — pre-battle popup */}
      <BossDetailSheet
        boss={selectedBoss}
        zone={zone}
        open={!!selectedBoss}
        onOpenChange={(open) => { if (!open) setSelectedBoss(null); }}
        onFight={handleFight}
      />
    </div>
  );
}

/** Bottom nav for zone detail screen */
function ZoneBottomNav() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tabs = [
    { icon: 'map', label: 'Bản Đồ', to: '/campaign' },
    { icon: 'bolt', label: 'Kỹ Năng', to: '/campaign/skills' },
    { icon: 'science', label: 'C.Thức', to: '/campaign/recipes' },
    { icon: 'assignment', label: 'N.Vụ', to: '/campaign/missions' },
    { icon: 'emoji_events', label: 'T.Tụ', to: '/campaign/achievements' },
  ];

  const iconSrc: Record<string, string> = {
    map: '/assets/map/campaign_region_1/button_map.png',
    bolt: '/assets/map/campaign_region_1/button_skill.png',
    science: '/assets/map/campaign_region_1/button_recipe.png',
    assignment: '/assets/map/campaign_region_1/button_mission.png',
    emoji_events: '/assets/map/campaign_region_1/button_achievements.png',
  };

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] z-50 pb-[max(8px,env(safe-area-inset-bottom))] px-2">
      <div className="relative flex justify-around items-center py-2">
        {tabs.map((tab) => {
          const isActive = tab.to === '/campaign';
          const src = iconSrc[tab.icon] || '';
          return (
            <button
              key={tab.to}
              onClick={() => { playSound('ui_tab'); navigate(tab.to); }}
              className={`relative flex flex-col items-center justify-center w-1/5 group ${isActive ? '' : 'opacity-80 hover:opacity-100 transition-opacity'}`}
            >
              <div className={`relative w-16 h-16 flex items-center justify-center transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                {src ? (
                  <img src={src} alt={tab.label} className="w-full h-full object-contain drop-shadow-md" />
                ) : (
                  <span className="material-symbols-outlined text-[#8B4513] text-3xl">{tab.icon}</span>
                )}
                <span className="absolute bottom-[6px] left-1/2 -translate-x-1/2 text-[9px] font-bold text-white uppercase tracking-tighter whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
