import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '@/shared/components/AnimatedNumber';
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
import { calculateGrowthPercent, calculateStage, isHarvestReady, getPlantSprite, getMoodEmoji, getWeatherGrowthMultiplier, getWeatherHappinessModifier } from '../utils/growth';
import { formatTime } from '@/shared/utils/format';
import { useCooldown } from '@/shared/hooks/useCooldown';
import { usePlantSeed } from '@/shared/hooks/usePlantSeed';
import { useWaterPlot } from '@/shared/hooks/useWaterPlot';
import { useHarvestPlot } from '@/shared/hooks/useHarvestPlot';
import { useClearPlot } from '@/shared/hooks/useClearPlot';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useWeather } from '@/shared/hooks/useWeather';
import { PlantType } from '../types/farm.types';
import { useTransformedFarmPlots } from '@/shared/hooks/useFarmPlots';
import { usePlayerProfile, useOgn } from '@/shared/hooks/usePlayerProfile';
import {
  handleGameError,
  showPlantSuccess,
  showWaterSuccess,
  showHarvestSuccess,
  showLevelUp,
  formatCooldown,
} from '@/shared/utils/error-handler';

export default function FarmingScreen() {
  const navigate = useNavigate();
  // API data (Step 12)
  const { data: plots, isLoading: plotsLoading, error: plotsError } = useTransformedFarmPlots();
  const { data: profile } = usePlayerProfile();
  const ogn = useOgn(); // TanStack Query single source of truth

  // Weather data (Step 31 — GPS/Weather Integration)
  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useWeather();
  const setWeatherData = useWeatherStore((s) => s.setWeatherData);

  // Sync weather data to store when fetched
  useEffect(() => {
    if (weatherData) {
      console.log('[FarmingScreen] Weather data fetched:', weatherData);
      setWeatherData(weatherData);
    }
  }, [weatherData, setWeatherData]);

  // Log weather errors but don't block the UI
  useEffect(() => {
    if (weatherError) {
      console.error('[FarmingScreen] Weather fetch failed:', weatherError);
      // Weather is non-blocking — use default weather from store
    }
  }, [weatherError]);

  // Track mount count
  const mountCount = useRef(0);
  useEffect(() => {
    mountCount.current++;
    console.log(`[FARM-DEBUG] FarmingScreen: ✅ MOUNT #${mountCount.current}`);
    return () => {
      console.log(`[FARM-DEBUG] FarmingScreen: ❌ UNMOUNT #${mountCount.current}`);
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

  // ─── NEW: Online status detection (Step 16) ───
  const isOnline = useOnlineStatus();

  // ─── NEW: Plant mutation (Step 13) ───
  const plantMutation = usePlantSeed();

  // ─── NEW: Water mutation (Step 14) ───
  const waterMutation = useWaterPlot();

  // ─── NEW: Harvest mutation (Step 15) ───
  const harvestMutation = useHarvestPlot();

  // ─── NEW: Clear dead plot mutation (Step 23) ───
  const clearMutation = useClearPlot();

  // ─── NEW: Water cooldown state (Step 14) ───
  const [waterCooldowns, setWaterCooldowns] = useState<Record<string, number>>({});
  // key = plotId, value = cooldownEndTimestamp

  // ─── NEW: Harvest result state (for animation) ───
  const [harvestResult, setHarvestResult] = useState<{
    plantEmoji: string;
    plantName: string;
    xp: number;
    message: string;
    leveledUp: boolean;
  } | null>(null);

  // Zustand for UI-only state
  const plantSeedZustand = useFarmStore((s) => s.plantSeed); // Keep for fallback
  const waterPlotZustand = useFarmStore((s) => s.waterPlot); // Keep for fallback
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

  const timeOfDay = useWeatherStore((s) => s.timeOfDay);
  const weather = useWeatherStore((s) => s.weather);

  // Safety fallback for invalid weather values
  const safeWeather = (WEATHER_INFO[weather]?.emoji ? weather : 'sunny') as 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'wind' | 'cold' | 'hot';

  // Start happiness decay (one-time initialization)
  useEffect(() => { startHappinessDecay(); }, []);

  // Celestial path calculation (Left to Right arc)
  const getCelestialState = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    let isNightLocal = false;
    let progress = 0;

    // Day: 6 AM (360 min) to 6 PM (1080 min)
    if (totalMinutes >= 360 && totalMinutes < 1080) {
      isNightLocal = false;
      progress = (totalMinutes - 360) / 720;
    } else {
      // Night: 6 PM (1080) to 6 AM (next day 360)
      isNightLocal = true;
      if (totalMinutes >= 1080) {
        progress = (totalMinutes - 1080) / 720;
      } else {
        progress = (totalMinutes + 360) / 720;
      }
    }

    // Progress 0 = Left, Progress 1 = Right
    const left = -10 + progress * 105; // -10% to 95%
    const top = 25 - (Math.sin(Math.PI * progress) * 18); // Arc path

    return { left: `${left}%`, top: `${top}%`, isNight: isNightLocal };
  }, []);

  const celestial = getCelestialState();
  const temperature = useWeatherStore((s) => s.temperature);
  const locationName = useWeatherStore((s) => s.location.province) || 'Thái Nguyên';

  // All useCallback hooks MUST be above early returns to avoid React #310
  // Use ref to avoid dependency on activePlot changing every render
  const handleWater = useCallback(() => {
    const currentPlot = plots[activePlotIndex];
    if (!currentPlot || currentPlot.isDead) return;

    console.log('[FARM-DEBUG] FarmingScreen — WATER CLICKED:', currentPlot.id);

    // Check local cooldown first (instant feedback)
    const cooldownEnd = waterCooldowns[currentPlot.id];
    if (cooldownEnd && Date.now() < cooldownEnd) {
      const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
      console.log('[FARM-DEBUG] FarmingScreen — LOCAL COOLDOWN active:', remaining, 's');
      addToast(`Đang chờ tưới! Còn ${remaining} giây ⏳`, 'info');
      return;
    }

    waterMutation.mutate(currentPlot.id, {
      onSuccess: (data) => {
        console.log('[FARM-DEBUG] FarmingScreen — WATER SUCCESS:', JSON.stringify(data));

        // Set local cooldown timer
        const endTime = Date.now() + ((data.cooldownSeconds || 3600) * 1000);
        setWaterCooldowns(prev => ({ ...prev, [currentPlot.id]: endTime }));
        console.log('[FARM-DEBUG] FarmingScreen — cooldown set until:', new Date(endTime).toISOString());

        // Show effects
        setShowWaterEffect(true);
        setTimeout(() => setShowWaterEffect(false), 1200);
        showFlyUp('+10 💚');
        showWaterSuccess(data.message || 'Cây vui hơn rồi! 💧');
        start(data.cooldownSeconds || 3600);
      },
      onError: (error: any) => {
        console.error('[FARM-DEBUG] FarmingScreen — WATER ERROR:', error.message);

        // If cooldown error, set local cooldown from server response
        if (error.cooldownRemaining) {
          const endTime = Date.now() + (error.cooldownRemaining * 1000);
          setWaterCooldowns(prev => ({ ...prev, [currentPlot.id]: endTime }));
          console.log('[FARM-DEBUG] FarmingScreen — server cooldown:', error.cooldownRemaining, 's');
          addToast(`⏳ Còn ${formatCooldown(error.cooldownRemaining)}`, 'info');
        } else {
          handleGameError(error, 'water');
        }
      },
    });
  }, [waterCooldowns, waterMutation, showFlyUp, addToast, start, activePlotIndex, plots]);

  // ─── NEW: Check if plot can be watered ───
  const canWater = useCallback((plotId: string) => {
    const cooldownEnd = waterCooldowns[plotId];
    return !cooldownEnd || Date.now() >= cooldownEnd;
  }, [waterCooldowns]);

  // ─── NEW: Get cooldown remaining for display ───
  const getCooldownRemaining = useCallback((plotId: string) => {
    const cooldownEnd = waterCooldowns[plotId];
    if (!cooldownEnd || Date.now() >= cooldownEnd) return 0;
    return Math.ceil((cooldownEnd - Date.now()) / 1000);
  }, [waterCooldowns]);

  const handleHarvest = useCallback(() => {
    const currentPlot = plots[activePlotIndex];
    if (!currentPlot || !isHarvestReady(currentPlot)) return;

    console.log('[FARM-DEBUG] FarmingScreen — HARVEST CLICKED:', currentPlot.id);

    harvestMutation.mutate(currentPlot.id, {
      onSuccess: (data) => {
        console.log('[FARM-DEBUG] FarmingScreen — HARVEST SUCCESS:', JSON.stringify(data));

        // MỚI — Lấy thông tin từ response
        const plantEmoji = data.inventory?.plantEmoji || data.plantEmoji || '🌾';
        const plantName = data.inventory?.plantName || data.plantName || 'Nông sản';
        const xp = data.reward?.xp || data.xpGained || 0;

        // Show harvest animation — MỚI structure
        setHarvestResult({
          plantEmoji,
          plantName,
          xp,
          message: 'Đã vào kho! Bán lấy tiền 💰',
          leveledUp: data.leveledUp,
        });

        // Clear animation after 3s
        setTimeout(() => setHarvestResult(null), 3000);

        // Show effects — MỚI: KHÔNG hiện OGN
        showFlyUp(`+${xp} XP 🌾 Vào kho!`);
        // showHarvestSuccess no longer used — toast shown from useHarvestPlot hook

        // Level up toast/animation
        if (data.leveledUp) {
          console.log('[FARM-DEBUG] FarmingScreen — 🎉 LEVEL UP! Level:', data.newLevel);
          showLevelUp(data.newLevel);
        }
      },
      onError: (error) => {
        console.error('[FARM-DEBUG] FarmingScreen — HARVEST ERROR:', error.message);
        handleGameError(error, 'harvest');
      },
    });
  }, [harvestMutation, showFlyUp, addToast, activePlotIndex, plots]);

  // ─── NEW: Clear dead plot handler (Step 23) ───
  const handleClear = useCallback(() => {
    const currentPlot = plots[activePlotIndex];
    if (!currentPlot || !currentPlot.isDead) return;

    console.log('[FARM-DEBUG] FarmingScreen — CLEAR DEAD PLOT:', currentPlot.id);

    clearMutation.mutate(currentPlot.id, {
      onSuccess: (data) => {
        console.log('[FARM-DEBUG] FarmingScreen — CLEAR SUCCESS:', JSON.stringify(data));
        addToast(`Đã dọn cây héo ở ô ${data.slotIndex + 1}! 🧹`, 'success');
      },
      onError: (error) => {
        console.error('[FARM-DEBUG] FarmingScreen — CLEAR ERROR:', error.message);
        handleGameError(error, 'clear');
      },
    });
  }, [clearMutation, addToast, activePlotIndex, plots]);

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
          showPlantSuccess(
            data.plantType?.name || 'Cây',
            data.plantType?.emoji || '🌱'
          );

          // FIX: Set activePlotIndex to the newly planted plot slot
          // This ensures the UI shows the newly planted tree
          if (data.plot) {
            console.log('[FARM-DEBUG] FarmingScreen — Setting activePlotIndex to slot:', data.plot.slotIndex);
            setActivePlotIndex(data.plot.slotIndex);
          }
        },
        onError: (error) => {
          console.error('[FARM-DEBUG] FarmingScreen — ❌ PLANT ERROR:', error.message);
          handleGameError(error, 'plant');
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
  const currentDate = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const isNightLocal = celestial.isNight;
  const textColor = isNightLocal ? 'text-white' : 'text-gray-800';
  const subTextColor = isNightLocal ? 'text-white/60' : 'text-gray-700/60';

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative overflow-hidden">
      {/* Background Decor */}
      <div className="landscape-bg-v2" style={{
        background: celestial.isNight
          ? 'linear-gradient(180deg, #1A237E 0%, #3949AB 40%, #A5D6A7 40%, #81C784 100%)'
          : 'linear-gradient(180deg, #87CEEB 0%, #E0F7FA 40%, #A5D6A7 40%, #81C784 100%)'
      }}>
        {/* Real-time Celestial Body (Sun/Moon) */}
        <div
          className={celestial.isNight ? "moon-v2" : "sun-v2"}
          style={{ left: celestial.left, top: celestial.top }}
        ></div>

        <div className="cloud w-32 h-12 top-20 left-10 cloud-decoration opacity-80" style={{ fontSize: '40px' }}>☁️</div>
        <div className="cloud w-24 h-8 top-32 right-20 opacity-60 cloud-decoration" style={{ fontSize: '30px' }}>☁️</div>
        <div className="hill-bg-v2 opacity-50"></div>
        <div className="hill-fg-v2"></div>

        {/* Grass Decor */}
        <div className="absolute bottom-[35%] left-[10%] opacity-20 pointer-events-none">
          <span className="material-symbols-outlined text-green-950 text-7xl transform -rotate-12">grass</span>
        </div>
        <div className="absolute bottom-[38%] right-[25%] opacity-20 pointer-events-none">
          <span className="material-symbols-outlined text-green-950 text-8xl transform rotate-6">grass</span>
        </div>
      </div>

      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col pb-24">
        {/* Header Section */}
        <header className="flex flex-col gap-5 px-6 pt-10 pb-4">
          {/* Top Row: Profile & Weather */}
          <div className="flex items-center justify-between gap-2">
            {/* User Profile Glass UI */}
            <div className="flex items-center gap-2.5 glass-ui-v2 p-1 pr-3.5 rounded-full flex-shrink-0">
              <div className="relative group cursor-pointer" onClick={() => navigate('/profile')}>
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-game-green-mid flex items-center justify-center">
                  {profile?.picture ? (
                    <img alt={profile?.name} className="w-full h-full object-cover" src={profile.picture} />
                  ) : (
                    <span className="text-xl">🧑‍🌾</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col translate-y-[-1px]">
                <h1 className="font-black text-[12px] text-gray-800 leading-none mb-1.5">{profile?.name || 'Farmer'}</h1>
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-400 text-yellow-900 text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm border border-yellow-500 uppercase tracking-tighter">Lv.{profile?.level || 1}</span>
                  {/* Notification Bell next to Level tag */}
                  <button
                    onClick={() => navigate('/points')}
                    className="flex items-center justify-center text-amber-900 transition-transform active:scale-90 hover:scale-110">
                    <span className="material-symbols-outlined text-[18px]">notifications</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Weather Pill (Moved to top row) */}
            <div className="weather-info-glass rounded-full px-4 py-1.5 flex items-center gap-3 border-white/40 flex-shrink-0 overflow-visible">
              <div className="flex flex-col items-end">
                <span className={`text-[9px] font-black ${subTextColor} uppercase tracking-tighter whitespace-nowrap`}>{currentDate}</span>
                <div className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px] text-blue-500">location_on</span>
                  <span className={`text-[11px] font-bold ${textColor} whitespace-nowrap`}>{locationName}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 border-l border-white/20 pl-3">
                <span className={`material-symbols-outlined text-[20px] leading-none ${temperature > 25 ? 'text-red-500' : 'text-blue-400'}`}>
                  {temperature > 25 ? 'device_thermostat' : 'ac_unit'}
                </span>
                <span className={`text-[14px] font-black ${textColor} tracking-tighter leading-none`}>{Math.round(temperature)}°C</span>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between">
            {/* Wood Signs for Stats */}
            <div className="flex flex-col gap-2 relative z-20 w-fit">
              <div
                onClick={() => navigate('/ogn-history')}
                className="wood-sign-v2 rounded-lg p-2 flex items-center justify-between gap-3 h-10 w-32 transform -rotate-2 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-1">
                  <span className="text-yellow-600 text-[16px] drop-shadow-sm">🪙</span>
                  <span className="text-[10px] font-black text-[#8B4513] uppercase">OGN</span>
                </div>
                <span className="font-black text-[#5D4037] text-sm leading-none drop-shadow-sm">
                  <AnimatedNumber value={profile?.ogn ?? 0} />
                </span>
              </div>
              <div className="wood-sign-v2 rounded-lg p-2 flex items-center justify-between gap-3 h-10 w-32 transform rotate-1">
                <div className="flex items-center gap-1">
                  <span className="text-blue-500 text-[16px] drop-shadow-sm">⚡</span>
                  <span className="text-[10px] font-bold text-[#8B4513]">Eng</span>
                </div>
                <span className="font-black text-[#5D4037] text-sm leading-none drop-shadow-sm">8/10</span>
              </div>
            </div>

            {/* Mini Map */}
            <div className="mini-map-v2 w-24 h-24 rounded-xl relative group cursor-pointer transition-transform hover:scale-105 active:scale-95 overflow-hidden shadow-soft">
              <div className="absolute inset-0 bg-[#81C784] map-grid-v2"></div>
              <div className="absolute top-0 right-0 w-8 h-full bg-[#4FC3F7] transform -skew-x-12 opacity-80 border-l-2 border-white/20"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-ping absolute"></div>
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white relative"></div>
              </div>
              <div className="absolute top-2 left-2 w-3.5 h-3.5 rounded-full bg-[#388E3C]"></div>
              <div className="absolute bottom-2 right-5 w-4.5 h-4.5 rounded bg-[#388E3C] transform rotate-45"></div>
              <div className="absolute bottom-0 w-full bg-[#5D4037]/80 text-[7px] text-white text-center font-bold py-0.5">
                Region 1
              </div>
            </div>
          </div>
        </header>

        {/* Central Farm Content */}
        <div className="flex-grow flex flex-col items-center justify-center relative px-8 pb-10">
          {activePlot ? (
            <>
              {/* Status Bubbles */}
              <div className="absolute top-[10%] w-full flex justify-between px-4 z-30 max-w-[320px]">
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg border border-green-200 transform -rotate-6 animate-float-center">
                  <div className="flex items-center gap-1 text-green-700 text-[10px] font-black uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    {activePlot.isDead ? 'Dried Up' : 'Healthy'}
                  </div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg border border-blue-200 transform rotate-6 animate-float-center" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-1 text-blue-700 text-[10px] font-black uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-[14px]">water_drop</span>
                    {activePlot.happiness >= 50 ? 'Watered' : 'Thirsty'}
                  </div>
                </div>
              </div>

              {/* Plant Visualization */}
              <div className="relative w-full flex flex-col items-center justify-end h-[350px] z-20">
                {/* Water splash effect */}
                {showWaterEffect && (
                  <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                    {[...Array(8)].map((_, i) => (
                      <span key={i} className="absolute animate-sparkle-up text-4xl"
                        style={{ left: `${30 + Math.random() * 40}%`, top: `${20 + Math.random() * 40}%`, animationDelay: `${i * 0.08}s` }}>
                        💧
                      </span>
                    ))}
                  </div>
                )}

                <div
                  className={`relative z-10 bottom-[-10px] origin-bottom animate-sway-center cursor-pointer transition-transform active:scale-95`}
                  onClick={() => harvestReady ? handleHarvest() : undefined}
                >
                  <div className={`text-9xl drop-shadow-2xl ${activePlot.isDead ? 'grayscale' : ''}`}>
                    {activePlot.isDead ? '🥀' : getPlantSprite(activePlot)}
                  </div>
                </div>

                {/* Soil Mound */}
                <div className="relative z-0">
                  <div className="w-64 h-16 soil-mound-v2 mx-auto"></div>
                  <div className="absolute bottom-3 left-10 w-5 h-4 bg-gray-400 rounded-full opacity-80"></div>
                  <div className="absolute bottom-5 right-12 w-4 h-3 bg-gray-500 rounded-full opacity-70"></div>
                </div>
              </div>

              {/* Progress UI */}
              <div className="w-full max-w-[260px] space-y-2 mt-6 bg-white/60 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/50 z-30">
                <div className="flex justify-between text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1">
                  <span>Growth</span>
                  <span>{STAGE_LABELS[stage]} ({growthPct}%)</span>
                </div>
                <div className="relative h-5 w-full bg-gray-200/50 rounded-full overflow-hidden shadow-inner border border-white/40">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 via-green-500 to-green-300 transition-all duration-1000 rounded-full shadow-sm"
                    style={{ width: `${Math.max(5, growthPct)}%` }}>
                  </div>
                </div>
                <div className="flex justify-center mt-1">
                  <div className="bg-yellow-100/80 text-yellow-800 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-yellow-200">
                    <span className="material-symbols-outlined text-[14px]">timer</span>
                    {activePlot.isDead ? 'Dead' : harvestReady ? 'Ready!' : 'Growing...'}
                  </div>
                </div>
              </div>

              {/* Plot dots for switching */}
              {plots.length > 1 && (
                <div className="flex gap-3 mt-6 z-40">
                  {plots.map((_, i) => (
                    <button key={i} onClick={() => setActivePlotIndex(i)}
                      className={`w-3 h-3 rounded-full border-2 border-white shadow-md transition-all ${i === activePlotIndex ? 'bg-green-600 scale-125' : 'bg-white/50'}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 bg-white/40 backdrop-blur-md rounded-[40px] border border-white/50 shadow-xl">
              <span className="text-8xl mb-4 animate-bounce">🌱</span>
              <p className="font-heading font-black text-2xl text-amber-900">No Plants Yet!</p>
              <button onClick={handleEmptySlotClick}
                className="mt-6 px-8 py-3 rounded-2xl btn-green text-white font-heading font-bold text-lg shadow-lg active:scale-95 transition-all">
                Plant First Seed
              </button>
            </div>
          )}
        </div>

        {/* Right Side Action Dock */}
        <div className="fixed right-0 top-[55%] transform -translate-y-1/2 z-40 flex flex-col gap-4 pr-3 py-6 pl-3 rounded-l-3xl glass-dock-v2 shadow-dock">
          {/* Water Button */}
          <button
            onClick={handleWater}
            disabled={!activePlot || activePlot?.isDead || !canWater(activePlot?.id || '') || waterMutation.isPending}
            className={`action-btn group flex flex-col items-center justify-center gap-1 relative w-12 transition-transform active:scale-90 ${(!activePlot || activePlot?.isDead || !canWater(activePlot?.id || '')) ? 'opacity-50 grayscale' : ''}`}
          >
            <div className={`w-12 h-12 rounded-xl bg-[#4FC3F7] border-b-4 border-[#0288D1] shadow-lg flex items-center justify-center group-hover:bg-[#29B6F6] transition-colors ring-2 ring-white/50 overflow-hidden`}>
              <span className="material-symbols-outlined text-white text-2xl drop-shadow-md">water_drop</span>
            </div>
            {!canWater(activePlot?.id || '') && activePlot && !activePlot.isDead && (
              <span className="absolute -bottom-1 bg-white text-[9px] font-black px-1 rounded-md shadow-sm text-blue-600 border border-blue-200">{getCooldownRemaining(activePlot.id)}s</span>
            )}
          </button>

          {/* Catch Bug Button */}
          <button
            onClick={() => setShowBugGame(true)}
            className="action-btn group flex flex-col items-center justify-center gap-1 relative w-12 transition-transform active:scale-95"
          >
            <span className="absolute top-[-5px] right-[-5px] w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white z-10 animate-bounce">!</span>
            <div className="w-12 h-12 rounded-xl bg-[#AED581] border-b-4 border-[#689F38] shadow-lg flex items-center justify-center group-hover:bg-[#9CCC65] transition-colors ring-2 ring-white/50">
              <span className="material-symbols-outlined text-white text-2xl drop-shadow-md">pest_control</span>
            </div>
          </button>

          {/* Quiz Button */}
          <button
            onClick={() => navigate('/quiz')}
            className="action-btn group flex flex-col items-center justify-center gap-1 relative w-12 transition-transform active:scale-95"
          >
            <span className="absolute top-[-5px] right-[-5px] w-5 h-5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white z-10">5</span>
            <div className="w-12 h-12 rounded-xl bg-[#FFB74D] border-b-4 border-[#F57C00] shadow-lg flex items-center justify-center group-hover:bg-[#FFA726] transition-colors ring-2 ring-white/50">
              <span className="material-symbols-outlined text-white text-2xl drop-shadow-md">menu_book</span>
            </div>
          </button>

          {/* Boss Button - Moved here from bottom nav */}
          <button
            onClick={() => navigate('/boss')}
            className="action-btn group flex flex-col items-center justify-center gap-1 relative w-12 transition-transform active:scale-95"
          >
            <div className="w-12 h-12 rounded-xl bg-[#9575CD] border-b-4 border-[#5E35B1] shadow-lg flex items-center justify-center group-hover:bg-[#7E57C2] transition-colors ring-2 ring-white/50">
              <span className="material-symbols-outlined text-white text-2xl drop-shadow-md">sports_esports</span>
            </div>
          </button>
        </div>

        {/* Wooden Bottom Navigation */}
        <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[94%] max-w-md z-50">
          <div className="absolute inset-0 bg-[#DEB887] rounded-full border-4 border-[#8B4513] shadow-[0_8px_0_#5D4037,0_15px_20px_rgba(0,0,0,0.3)] wood-pattern-v1"></div>
          <div className="absolute top-1/2 left-2 w-2 h-2 bg-[#5D4037] rounded-full transform -translate-y-1/2 shadow-inner"></div>
          <div className="absolute top-1/2 right-2 w-2 h-2 bg-[#5D4037] rounded-full transform -translate-y-1/2 shadow-inner"></div>

          <div className="relative flex justify-between items-center px-4 py-3">
            <button onClick={() => navigate('/farm')} className="flex flex-col items-center gap-1 w-12 group">
              <div className="w-10 h-10 rounded-full bg-[#8B4513] border-2 border-[#DEB887] flex items-center justify-center shadow-inner transform -translate-y-2 transition-all duration-200">
                <span className="material-symbols-outlined text-[#90EE90] text-xl">spa</span>
              </div>
              <span className="text-[8px] font-black text-[#5D4037] uppercase tracking-tighter">Nông trại</span>
            </button>

            <button onClick={() => navigate('/shop')} className="flex flex-col items-center gap-1 w-12 group opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#8B4513] text-2xl group-hover:scale-110 transition-transform">storefront</span>
              </div>
              <span className="text-[8px] font-bold text-[#8B4513]">Cửa hàng</span>
            </button>

            <button onClick={() => navigate('/inventory')} className="flex flex-col items-center gap-1 w-12 group opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#8B4513] text-2xl group-hover:scale-110 transition-transform">inventory_2</span>
              </div>
              <span className="text-[8px] font-bold text-[#8B4513]">Kho đồ</span>
            </button>

            <button onClick={() => setShowFriends(true)} className="flex flex-col items-center gap-1 w-12 group opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#8B4513] text-2xl group-hover:scale-110 transition-transform">group</span>
              </div>
              <span className="text-[8px] font-bold text-[#8B4513]">Bạn bè</span>
            </button>

            <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 w-12 group opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#8B4513] text-2xl group-hover:scale-110 transition-transform">person</span>
              </div>
              <span className="text-[8px] font-bold text-[#8B4513]">Hồ sơ</span>
            </button>
          </div>
        </nav>

        {/* Harvest / Clear Floating Action Button */}
        {activePlot && harvestReady && !activePlot.isDead && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 w-[240px]">
            <button
              onClick={handleHarvest}
              disabled={harvestMutation.isPending}
              className="w-full py-4 rounded-2xl btn-green text-white font-heading font-black text-lg shadow-[0_8px_0_#1b5e20] active:translate-y-1 active:shadow-[0_4px_0_#1b5e20] transition-all flex items-center justify-center gap-2"
            >
              <span className="text-2xl">🌾</span>
              {harvestMutation.isPending ? 'Đang thu hoạch...' : 'Thu hoạch 🌾'}
            </button>
          </div>
        )}

        {/* Clear Plot FAB */}
        {activePlot && activePlot.isDead && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 w-[240px]">
            <button
              onClick={() => {
                if (confirm(`Dọn cây héo ở ô ${activePlot.slotIndex + 1}? 🧹`)) {
                  handleClear();
                }
              }}
              disabled={clearMutation.isPending}
              className="w-full py-4 rounded-2xl bg-red-500 text-white font-heading font-black text-lg shadow-[0_8px_0_#991b1b] active:translate-y-1 active:shadow-[0_4px_0_#991b1b] transition-all flex items-center justify-center gap-2"
            >
              <span className="text-2xl">🧹</span>
              {clearMutation.isPending ? 'Clearing...' : 'Clear Garden'}
            </button>
          </div>
        )}
      </div>
      {/* end z-10 wrapper */}

      <Toast />
      <PointsFlyUp />

      {/* ─── NEW: Harvest animation overlay (Step 15) ─── */}
      {harvestResult && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/30"
          onClick={() => setHarvestResult(null)}
        >
          <div className="animate-bounce text-center bg-white rounded-2xl p-6 shadow-2xl">
            <div className="text-6xl mb-2">{harvestResult.plantEmoji}</div>
            <div className="text-lg font-bold text-green-600">
              Đã thu hoạch {harvestResult.plantName}!
            </div>
            <div className="text-sm text-amber-500 mt-1">
              +{harvestResult.xp} XP
            </div>
            <div className="text-sm text-blue-500 mt-2 animate-bounce">
              🌾 Vào kho bán lấy tiền!
            </div>
            {harvestResult.leveledUp && (
              <div className="mt-2">
                🎉 LEVEL UP!
              </div>
            )}
          </div>
        </div>
      )}

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
        onVisit={(f: any) => { setShowFriends(false); setVisitingFriend(f); }}
        onInvite={() => { setShowFriends(false); setShowInvite(true); }}
        onLeaderboard={() => { setShowFriends(false); setShowLeaderboard(true); }} />
      <InviteFriends open={showInvite} onClose={() => setShowInvite(false)} />
      <Leaderboard open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      {visitingFriend && <FriendGarden friend={visitingFriend as any} onBack={() => setVisitingFriend(null)} />}
    </div>
  );
}
