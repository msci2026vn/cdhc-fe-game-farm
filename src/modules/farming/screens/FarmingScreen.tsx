import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/shared/components/BottomNav';
import Toast from '@/shared/components/Toast';
import PointsFlyUp from '@/shared/components/PointsFlyUp';
import FarmHeader from '../components/FarmHeader';
import PlantSeedModal from '../components/PlantSeedModal';
import PlantPickerModal from '../components/PlantPickerModal';
import BugCatchGame from '../components/BugCatchGame';
import WeatherOverlay from '../components/WeatherOverlay';
import WeatherControl from '../components/WeatherControl';
import FriendsList from '@/modules/friends/components/FriendsList';
import InviteFriends from '@/modules/friends/components/InviteFriends';
import FriendGarden from '@/modules/friends/components/FriendGarden';
import Leaderboard from '@/modules/friends/components/Leaderboard';
import { Friend } from '@/modules/friends/data/friends';
import { useFarmStore, startHappinessDecay } from '../stores/farmStore';
import { useWeatherStore, WEATHER_INFO } from '../stores/weatherStore';
import { useUIStore } from '@/shared/stores/uiStore';
import { useActivityStore } from '@/shared/stores/activityStore';
import { calculateGrowthPercent, calculateStage, isHarvestReady, getPlantSprite, getMoodEmoji, getWeatherGrowthMultiplier, getWeatherHappinessModifier } from '../utils/growth';
import { formatTime } from '@/shared/utils/format';
import { useCooldown } from '@/shared/hooks/useCooldown';
import { usePlantSeed } from '@/shared/hooks/usePlantSeed';
import { PlantType } from '../types/farm.types';
import { useTransformedFarmPlots } from '@/shared/hooks/useFarmPlots';

export default function FarmingScreen() {
  const navigate = useNavigate();
  // API data (Step 12)
  const { data: plots, isLoading: plotsLoading, error: plotsError } = useTransformedFarmPlots();

  // Track mount count with useEffect (logs ONCE on mount)
  useEffect(() => {
    console.log('[FARM-DEBUG] FarmingScreen: ✅ MOUNTED (first time)');
    return () => {
      console.log('[FARM-DEBUG] FarmingScreen: ❌ UNMOUNTED');
    };
  }, []);

  useEffect(() => {
    console.log('[FARM-DEBUG] FarmingScreen: State =', {
      isLoading: plotsLoading,
      hasError: !!plotsError,
      errorMsg: plotsError?.message,
      plotCount: plots?.length ?? 'N/A',
    });
  }, [plotsLoading, plotsError, plots?.length]);

  // ─── NEW: Plant mutation (Step 13) ───
  const plantMutation = usePlantSeed();

  // Zustand for mutations (water + harvest still use Zustand, plant will use API)
  const ogn = useFarmStore((s) => s.ogn);
  const plantSeedZustand = useFarmStore((s) => s.plantSeed); // Keep for fallback
  const waterPlot = useFarmStore((s) => s.waterPlot);
  const harvestPlot = useFarmStore((s) => s.harvestPlot);
  const getCooldown = useFarmStore((s) => s.getWaterCooldownRemaining);
  const addToast = useUIStore((s) => s.addToast);
  const showFlyUp = useUIStore((s) => s.showFlyUp);

  const [activePlotIndex, setActivePlotIndex] = useState(0);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [showPlantPicker, setShowPlantPicker] = useState(false); // NEW: Plant picker modal
  const [showBugGame, setShowBugGame] = useState(false);
  const [showWaterEffect, setShowWaterEffect] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [visitingFriend, setVisitingFriend] = useState<Friend | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  // REMOVED: forceUpdate interval - not needed with TanStack Query
  // Growth is calculated real-time using Date.now(), and plots update via API

  // Memoize activePlot to prevent infinite re-render loop
  const activePlot = useMemo(
    () => plots[activePlotIndex] || null,
    [plots, activePlotIndex]
  );

  const cooldownSeconds = activePlot ? getCooldown(activePlot.id) : 0;
  const { remaining, isActive, start } = useCooldown(cooldownSeconds);

  const addHarvest = useActivityStore((s) => s.addHarvest);

  const timeOfDay = useWeatherStore((s) => s.timeOfDay);
  const weather = useWeatherStore((s) => s.weather);

  // Start happiness decay (one-time initialization)
  useEffect(() => { startHappinessDecay(); }, []);

  // All useCallback hooks MUST be above early returns to avoid React #310
  // Use ref to avoid dependency on activePlot changing every render
  const handleWater = useCallback(() => {
    const currentPlot = plots[activePlotIndex];
    if (!currentPlot || currentPlot.isDead) return;
    const success = waterPlot(currentPlot.id);
    if (success) {
      setShowWaterEffect(true);
      setTimeout(() => setShowWaterEffect(false), 1200);
      showFlyUp('+15 💚');
      addToast('Tưới thành công! Cây vui hơn rồi 🌱', 'success');
      start(15);
    } else {
      addToast('Đang hồi chiêu, chờ thêm nhé ⏳', 'info');
    }
  }, [waterPlot, showFlyUp, addToast, start, activePlotIndex]);

  const handleHarvest = useCallback(() => {
    const currentPlot = plots[activePlotIndex];
    if (!currentPlot || !isHarvestReady(currentPlot)) return;
    const reward = harvestPlot(currentPlot.id);
    showFlyUp(`+${reward} OGN 🪙`);
    addToast(`Thu hoạch thành công! +${reward} OGN 🎉`, 'success');
    addHarvest(currentPlot.plantType.name, reward);
    setTimeout(() => setShowPlantModal(true), 500);
  }, [harvestPlot, showFlyUp, addToast, addHarvest, activePlotIndex]);

  const handleSelectPlant = useCallback((plantType: PlantType) => {
    const currentLength = plots.length;
    plantSeedZustand(plantType, currentLength); // Fallback to Zustand for now
    setShowPlantModal(false);
    setActivePlotIndex(currentLength);
    addToast(`Đã trồng ${plantType.name} ${plantType.emoji}!`, 'success');
  }, [plantSeedZustand, addToast, plots.length]);

  // ─── NEW: Handle empty slot click (Step 13) ───
  const handleEmptySlotClick = useCallback(() => {
    const slotIndex = plots.length;
    console.log('[FARM-DEBUG] FarmingScreen — EMPTY SLOT CLICKED:', slotIndex);
    setShowPlantPicker(true);
  }, [plots.length]);

  // ─── NEW: Handle plant selection from picker (Step 13) ───
  const handleSelectPlantFromPicker = useCallback((plantTypeId: string) => {
    const slotIndex = plots.length;
    console.log('[FARM-DEBUG] FarmingScreen — PLANT SELECTED:', { slot: slotIndex, type: plantTypeId });

    plantMutation.mutate(
      { slotIndex, plantTypeId },
      {
        onSuccess: (data) => {
          console.log('[FARM-DEBUG] FarmingScreen — ✅ PLANT SUCCESS:', JSON.stringify(data));
          setShowPlantPicker(false);
          addToast(`Đã trồng cây! 🌱`, 'success');

          // FIX: Set activePlotIndex to the newly planted plot slot
          // This ensures the UI shows the newly planted tree
          if (data.plot) {
            console.log('[FARM-DEBUG] FarmingScreen — Setting activePlotIndex to slot:', data.plot.slotIndex);
            setActivePlotIndex(data.plot.slotIndex);
          }
        },
        onError: (error) => {
          console.error('[FARM-DEBUG] FarmingScreen — ❌ PLANT ERROR:', error.message);
          addToast(`Lỗi: ${error.message}`, 'error');
          alert(error.message); // Fallback nếu chưa có toast error styling
        },
      }
    );
  }, [plantMutation, plots.length, addToast]);

  // Loading state
  if (plotsLoading) {
    return (
      <div className="min-h-screen max-w-[430px] mx-auto relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-2">🌱</div>
          <p className="text-sm text-white/70">Đang tải vườn...</p>
          {/* Skeleton grid */}
          <div className="grid grid-cols-3 gap-3 mt-4 px-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (plotsError) {
    return (
      <div className="min-h-screen max-w-[430px] mx-auto relative overflow-hidden flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-4xl mb-2">😵</div>
          <p className="text-red-400 text-sm mb-2">Lỗi tải vườn</p>
          <p className="text-white/30 text-xs">{String(plotsError)}</p>
        </div>
      </div>
    );
  }

  const growthPct = activePlot ? calculateGrowthPercent(activePlot) : 0;
  const stage = activePlot ? calculateStage(activePlot) : 'seed';
  const harvestReady = activePlot ? isHarvestReady(activePlot) : false;

  const STAGE_LABELS: Record<string, string> = {
    seed: 'Giai đoạn 1/5', sprout: 'Giai đoạn 2/5', seedling: 'Giai đoạn 3/5', mature: 'Giai đoạn 4/5', dead: 'Đã chết',
  };

  const isNight = timeOfDay === 'night' || timeOfDay === 'dusk';
  const growthMult = getWeatherGrowthMultiplier(weather);
  const happyMod = getWeatherHappinessModifier(weather);

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative overflow-hidden">
      {/* Weather sky + effects */}
      <WeatherOverlay />

      {/* Content */}
      <div className="relative z-10">
      <FarmHeader />

      {/* Farm Scene */}
      <div className="flex-1 relative flex flex-col items-center justify-center px-5 py-2" style={{ minHeight: '45vh' }}>
        {/* Sun/Moon */}
        {!isNight ? (
          <div className="absolute top-2 right-8 w-[60px] h-[60px] rounded-full animate-sun-pulse"
            style={{ background: 'radial-gradient(circle, #ffe066 30%, #f0b429 60%, transparent 70%)' }} />
        ) : (
          <div className="absolute top-2 right-8 w-[50px] h-[50px] rounded-full"
            style={{ background: 'radial-gradient(circle, #f5f5dc 30%, #e8e4c9 60%, transparent 70%)', opacity: 0.8 }} />
        )}

        {/* Clouds */}
        <span className="absolute top-1 left-[-30px] text-[30px] opacity-60 animate-cloud-drift" style={{ animationDuration: '25s' }}>☁️</span>
        <span className="absolute top-8 left-[-60px] text-[22px] opacity-40 animate-cloud-drift" style={{ animationDuration: '35s', animationDelay: '8s' }}>☁️</span>

        {activePlot ? (
          <div className="flex flex-col items-center relative" style={{ width: 280 }}>
            {/* Water splash */}
            {showWaterEffect && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[...Array(8)].map((_, i) => (
                  <span key={i} className="absolute animate-sparkle-up text-sm"
                    style={{ left: `${20 + Math.random() * 60}%`, top: `${10 + Math.random() * 50}%`, animationDelay: `${i * 0.08}s` }}>
                    💧
                  </span>
                ))}
              </div>
            )}

            {/* Plant body */}
            <div className="animate-plant-sway flex flex-col items-center">
              <span className="text-7xl drop-shadow-md" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,100,0,0.2))' }}>
                {getPlantSprite(activePlot)}
              </span>
              {/* Stem */}
              <div className="w-2 h-16 rounded-full -mt-2"
                style={{ background: 'linear-gradient(180deg, #4eca6a, #2d8a4e)' }} />
            </div>

            {/* Mood */}
            <span className="absolute top-0 right-12 text-xl">
              {getMoodEmoji(activePlot.mood)}
            </span>

            {/* Pot */}
            <div className="relative -mt-1" style={{ width: 160 }}>
              {/* Pot rim */}
              <div className="h-5 rounded-lg -mb-px"
                style={{ background: 'linear-gradient(180deg, #c49a6c, #8b5e34)', margin: '0 -10px' }} />
              {/* Pot body */}
              <div className="h-[70px] rounded-b-[30px] plant-pot-gradient relative"
                style={{ boxShadow: '0 8px 25px rgba(92,61,31,0.3)' }}>
                <span className="absolute bottom-4 left-0 right-0 text-center font-heading text-[11px] text-white/70 font-semibold tracking-wider">
                  ORGANIC
                </span>
              </div>
            </div>

            {/* Growth bar */}
            <div className="w-[220px] mt-4">
              <div className="rounded-[20px] p-1" style={{ background: 'rgba(255,255,255,0.6)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
                <div className="h-3.5 rounded-2xl relative transition-all duration-500"
                  style={{
                    width: `${Math.max(5, growthPct)}%`,
                    background: 'linear-gradient(90deg, #4eca6a, #b8f0c5)',
                    boxShadow: '0 2px 6px rgba(78,202,106,0.3)',
                  }}>
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-game-green-dark whitespace-nowrap">
                    🌱 {growthPct}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between px-1 mt-1 text-[10px] font-bold text-muted-foreground">
                <span>{STAGE_LABELS[stage]}</span>
                <span>⏱ {activePlot.isDead ? 'Chết' : harvestReady ? 'Sẵn sàng!' : 'Đang lớn...'}</span>
              </div>
            </div>

            {/* Status tags */}
            <div className="flex flex-wrap gap-1.5 mt-2.5 justify-center">
              {!activePlot.isDead && (
                <span className="px-3 py-1 rounded-[20px] text-[10px] font-bold flex items-center gap-1"
                  style={{ background: '#d4f8dc', color: '#1a7a30' }}>
                  ✅ Khỏe mạnh
                </span>
              )}
              {activePlot.isDead && (
                <span className="px-3 py-1 rounded-[20px] text-[10px] font-bold"
                  style={{ background: '#ffe8e6', color: '#c0392b' }}>
                  💀 Đã chết
                </span>
              )}
              {!activePlot.isDead && activePlot.happiness >= 50 && (
                <span className="px-3 py-1 rounded-[20px] text-[10px] font-bold flex items-center gap-1"
                  style={{ background: '#d4eeff', color: '#1a6a9a' }}>
                  💧 Đã tưới
                </span>
              )}
              {/* Weather effect tag */}
              {growthMult !== 1.0 && (
                <span className="px-3 py-1 rounded-[20px] text-[10px] font-bold flex items-center gap-1"
                  style={{
                    background: growthMult > 1 ? '#d4f8dc' : '#fff3d4',
                    color: growthMult > 1 ? '#1a7a30' : '#d49a1a',
                  }}>
                  {WEATHER_INFO[weather].emoji} {growthMult > 1 ? `+${Math.round((growthMult - 1) * 100)}% tốc độ` : `${Math.round((growthMult - 1) * 100)}% tốc độ`}
                </span>
              )}
              {happyMod !== 1.0 && (
                <span className="px-3 py-1 rounded-[20px] text-[10px] font-bold flex items-center gap-1"
                  style={{
                    background: happyMod < 1 ? '#d4f8dc' : '#ffe8e6',
                    color: happyMod < 1 ? '#1a7a30' : '#c0392b',
                  }}>
                  {happyMod < 1 ? '😊' : '😰'} {happyMod < 1 ? `−${Math.round((1 - happyMod) * 100)}% suy giảm` : `+${Math.round((happyMod - 1) * 100)}% suy giảm`}
                </span>
              )}
            </div>

            {/* Plot dots */}
            {plots.length > 1 && (
              <div className="flex gap-2 mt-3">
                {plots.map((_, i) => (
                  <button key={i} onClick={() => setActivePlotIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === activePlotIndex ? 'bg-primary scale-125' : 'bg-muted-foreground/30'}`} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <span className="text-6xl block mb-4">🌱</span>
            <p className="font-heading font-bold text-lg">Chưa có cây nào</p>
            <p className="text-sm text-muted-foreground">Hãy trồng cây đầu tiên!</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-2 grid grid-cols-4 gap-2.5">
        <button onClick={handleWater} disabled={isActive || !activePlot || activePlot?.isDead}
          className="action-btn-base py-3.5 border-2 border-transparent disabled:opacity-50">
          <span className="text-[28px] drop-shadow-sm relative z-10">💧</span>
          <span className="text-[11px] font-bold relative z-10">{isActive ? formatTime(remaining) : 'Tưới nước'}</span>
        </button>
        <button className="action-btn-base py-3.5 border-2 border-transparent relative"
          onClick={() => setShowBugGame(true)}>
          <span className="text-[28px] drop-shadow-sm relative z-10">🐛</span>
          <span className="text-[11px] font-bold relative z-10">Bắt sâu</span>
          <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] bg-destructive rounded-full text-[10px] text-white font-extrabold flex items-center justify-center z-10"
            style={{ boxShadow: '0 2px 6px rgba(231,76,60,0.4)' }}>!</span>
        </button>
        <button className="action-btn-base py-3.5 border-2 border-transparent relative"
          onClick={() => navigate('/quiz')}>
          <span className="text-[28px] drop-shadow-sm relative z-10">📖</span>
          <span className="text-[11px] font-bold relative z-10">Quiz</span>
          <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] bg-destructive rounded-full text-[10px] text-white font-extrabold flex items-center justify-center z-10"
            style={{ boxShadow: '0 2px 6px rgba(231,76,60,0.4)' }}>5</span>
        </button>
        <button className="action-btn-base py-3.5 border-2 border-transparent"
          onClick={() => setShowFriends(true)}>
          <span className="text-[28px] drop-shadow-sm relative z-10">🏡</span>
          <span className="text-[11px] font-bold relative z-10">Bạn bè</span>
        </button>
      </div>

      {/* Harvest / Plant button */}
      {activePlot && harvestReady && !activePlot.isDead && (
        <div className="px-4 pb-2">
          <button onClick={handleHarvest}
            className="w-full py-3.5 rounded-lg btn-green text-white font-heading font-bold text-base active:scale-[0.97] transition-transform">
            🌾 Thu hoạch (+{activePlot.plantType.rewardOGN} OGN)
          </button>
        </div>
      )}
      {!activePlot && (
        <div className="px-4 pb-2">
          <button onClick={handleEmptySlotClick}
            className="w-full py-3.5 rounded-lg btn-green text-white font-heading font-bold text-base active:scale-[0.97] transition-transform">
            🌱 Trồng cây mới
          </button>
        </div>
      )}

      <BottomNav />
      </div>{/* end z-10 wrapper */}

      <Toast />
      <PointsFlyUp />
      <PlantSeedModal open={showPlantModal} onClose={() => setShowPlantModal(false)} onSelect={handleSelectPlant} />
      {showPlantPicker && (
        <PlantPickerModal
          onSelect={handleSelectPlantFromPicker}
          onClose={() => setShowPlantPicker(false)}
          isPlanting={plantMutation.isPending}
        />
      )}
      <BugCatchGame open={showBugGame} onClose={() => setShowBugGame(false)} />
      <FriendsList open={showFriends} onClose={() => setShowFriends(false)}
        onVisit={(f) => { setShowFriends(false); setVisitingFriend(f); }}
        onInvite={() => { setShowFriends(false); setShowInvite(true); }}
        onLeaderboard={() => { setShowFriends(false); setShowLeaderboard(true); }} />
      <InviteFriends open={showInvite} onClose={() => setShowInvite(false)} />
      <Leaderboard open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      {visitingFriend && <FriendGarden friend={visitingFriend} onBack={() => setVisitingFriend(null)} />}
    </div>
  );
}
