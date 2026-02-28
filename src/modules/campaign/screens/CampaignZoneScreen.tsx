import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CampaignHeader from '../components/CampaignHeader';
import StageNode from '../components/StageNode';
import BossNode from '../components/BossNode';
import BossDetailSheet from '../components/BossDetailSheet';
import MapPath from '../components/MapPath';
import { useZoneBosses } from '../hooks/useZoneBosses';
import { ZONE_META } from '../data/zones';
import type { StageState, ZoneBoss } from '../types/campaign.types';
import { playSound, audioManager } from '@/shared/audio';

/**
 * CampaignZoneScreen — Zone detail with 4 stages (3 minions/elites + 1 boss).
 * Matches the HTML template layout: bottom-to-top, zigzag path, boss at top.
 * Click stage → BossDetailSheet popup → confirm → navigate to combat.
 */
export default function CampaignZoneScreen() {
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
          <p className="text-white/80 font-heading font-bold text-sm">Đang tải vùng...</p>
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
          <p className="text-red-300 font-heading font-bold mb-2">Lỗi tải vùng</p>
          <p className="text-white/40 text-xs mb-4">{String(error)}</p>
          <button
            onClick={() => navigate('/campaign')}
            className="btn-gold px-6 py-2 rounded-xl font-heading font-bold text-sm text-white"
          >
            Về bản đồ
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
        title={`Region ${zoneNumber}: ${zone?.name || meta?.name || ''}`}
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

        {/* SVG path */}
        <MapPath
          height={800}
          pathD="M 195 700 C 195 650, 100 600, 100 550 S 290 450, 290 400 S 150 300, 150 250 S 195 150, 195 100"
        />

        {/* Stage 1 (Minion #1): center bottom */}
        {regularBosses[0] && (
          <div className="absolute z-10" style={{ left: '50%', bottom: '100px', transform: 'translateX(-50%)' }}>
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
          <div className="absolute z-10" style={{ left: '25%', bottom: '270px', transform: 'translateX(-50%)' }}>
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
          <div className="absolute z-10" style={{ right: '25%', bottom: '440px', transform: 'translateX(50%)' }}>
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
          <div className="absolute z-10" style={{ left: '50%', top: '100px', transform: 'translateX(-50%)' }}>
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

  const tabs = [
    { icon: 'map', label: 'Bản Đồ', to: '/campaign' },
    { icon: 'bolt', label: 'Kỹ Năng', to: '/campaign/skills' },
    { icon: 'science', label: 'C.Thức', to: '/campaign/recipes' },
    { icon: 'assignment', label: 'N.Vụ', to: '/campaign/missions' },
    { icon: 'emoji_events', label: 'T.Tựu', to: '/campaign/achievements' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[94%] max-w-md z-50">
      <div className="absolute inset-0 bg-[#DEB887] rounded-full border-4 border-[#8B4513] shadow-[0_8px_0_#5D4037,0_15px_20px_rgba(0,0,0,0.3)] wood-pattern-v1" />
      <div className="absolute top-1/2 left-2 w-2 h-2 bg-[#5D4037] rounded-full transform -translate-y-1/2 shadow-inner" />
      <div className="absolute top-1/2 right-2 w-2 h-2 bg-[#5D4037] rounded-full transform -translate-y-1/2 shadow-inner" />

      <div className="relative flex justify-between items-center px-4 py-3">
        {tabs.map((tab) => {
          const isActive = tab.to === '/campaign';
          return (
            <button
              key={tab.to}
              onClick={() => { playSound('ui_tab'); navigate(tab.to); }}
              className={`flex flex-col items-center gap-1 w-12 group ${isActive ? '' : 'opacity-70 hover:opacity-100 transition-opacity'}`}
            >
              {isActive ? (
                <div className="w-10 h-10 rounded-full bg-[#8B4513] border-2 border-[#DEB887] flex items-center justify-center shadow-inner transform -translate-y-2 transition-all duration-200">
                  <span className="material-symbols-outlined text-[#90EE90] text-xl">{tab.icon}</span>
                </div>
              ) : (
                <div className="w-8 h-8 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#8B4513] text-2xl group-hover:scale-110 transition-transform">{tab.icon}</span>
                </div>
              )}
              <span className={`text-[8px] font-bold ${isActive ? 'font-black text-[#5D4037] uppercase tracking-tighter' : 'text-[#8B4513]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
