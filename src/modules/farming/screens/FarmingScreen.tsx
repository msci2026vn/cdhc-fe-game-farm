import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '@/shared/components/AnimatedNumber';
import BottomNav from '@/shared/components/BottomNav';
import Toast from '@/shared/components/Toast';
import PointsFlyUp from '@/shared/components/PointsFlyUp';
import PlantSeedModal from '../components/PlantSeedModal';
import PlantPickerModal from '../components/PlantPickerModal';
import BugCatchGame from '../components/BugCatchGame';
import FriendsList from '@/modules/friends/components/FriendsList';
import InviteFriends from '@/modules/friends/components/InviteFriends';
import FriendGarden from '@/modules/friends/components/FriendGarden';
import Leaderboard from '@/modules/friends/components/Leaderboard';
import type { FriendData } from '@/shared/types/game-api.types';
import { useFarmStore, startHappinessDecay } from '../stores/farmStore';
import { useWeatherStore, WEATHER_INFO } from '../stores/weatherStore';
import { useUIStore } from '@/shared/stores/uiStore';
import { calculateStage, getPlantSprite, getWeatherGrowthMultiplier } from '../utils/growth';
import { useCooldown } from '@/shared/hooks/useCooldown';
import { usePlantSeed } from '@/shared/hooks/usePlantSeed';
import { useWaterPlot } from '@/shared/hooks/useWaterPlot';
import { useHarvestPlot } from '@/shared/hooks/useHarvestPlot';
import { useClearPlot } from '@/shared/hooks/useClearPlot';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useWeather } from '@/shared/hooks/useWeather';
import { PlantType } from '../types/farm.types';
import { useTransformedFarmPlots } from '@/shared/hooks/useFarmPlots';
import type { FarmPlot } from '@/shared/hooks/useFarmPlots';
import { useGrowthTimer } from '@/shared/hooks/useGrowthTimer';
import { usePlayerProfile, useOgn } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { useVipStatus } from '@/shared/hooks/useVipStatus';
import {
    handleGameError,
    showPlantSuccess,
    showWaterSuccess,
    showLevelUp,
    formatCooldown,
} from '@/shared/utils/error-handler';
import { playSound, audioManager } from '@/shared/audio';

// Max possible slots across all VIP tiers (for UI display)
const MAX_DISPLAY_SLOTS = 3;

export default function FarmingScreen() {
    const navigate = useNavigate();
    // API data (Step 12) — totalSlots is dynamic based on VIP tier (Phase 7)
    const { data: plots, totalSlots, isLoading: plotsLoading, error: plotsError } = useTransformedFarmPlots();
    const { data: profile } = usePlayerProfile();
    const { data: auth } = useAuth();
    const ogn = useOgn(); // TanStack Query single source of truth
    const { isVip } = useVipStatus();

    // Weather data (Step 31 — GPS/Weather Integration)
    const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useWeather();
    const setWeatherData = useWeatherStore((s) => s.setWeatherData);

    // Preload farming sounds + start BGM
    useEffect(() => {
        audioManager.preloadScene('farming');
        audioManager.startBgm('farm');
        return () => { audioManager.stopBgm(); };
    }, []);

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

    // Client-side growth timer — updates every 1s, ZERO API calls
    const plotGrowthInputs = useMemo(
        () => plots.map(p => ({
            plotId: p.id,
            plantedAt: p.plantedAt,
            growthDurationMs: p.plantType.growthDurationMs,
            isDead: p.isDead,
        })),
        [plots]
    );
    const growthMap = useGrowthTimer(plotGrowthInputs);

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

    // ─── Harvest result state (for animation) ───
    const [harvestResult, setHarvestResult] = useState<{
        plantEmoji: string;
        plantName: string;
        ognEarned: number;
        xp: number;
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
    const [plantSlotIndex, setPlantSlotIndex] = useState(0); // Phase 7: which slot to plant into
    const [showPlantModal, setShowPlantModal] = useState(false);
    const [showPlantPicker, setShowPlantPicker] = useState(false); // NEW: Plant picker modal
    const [showBugGame, setShowBugGame] = useState(false);
    const [showWaterEffect, setShowWaterEffect] = useState(false);
    const [showFriends, setShowFriends] = useState(false);
    const [visitingFriend, setVisitingFriend] = useState<FriendData | null>(null);
    const [showInvite, setShowInvite] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const [isMuted, setIsMuted] = useState(audioManager.muted);

    const toggleMute = () => {
        const muted = audioManager.toggleMute();
        setIsMuted(muted);
        if (!muted) {
            playSound('ui_click');
        }
    };
    // REMOVED: forceUpdate interval - not needed with TanStack Query
    // Growth is calculated real-time using Date.now(), and plots update via API

    // Memoize activePlot to prevent infinite re-render loop
    const activePlot = useMemo(
        () => plots[activePlotIndex] || null,
        [plots, activePlotIndex]
    );

    // Phase 7: Build slot grid — always show up to MAX_DISPLAY_SLOTS
    const plotBySlot = useMemo(
        () => new Map(plots.map((p) => [p.slotIndex, p])),
        [plots]
    );
    const slotGrid = useMemo(() => {
        return Array.from({ length: MAX_DISPLAY_SLOTS }, (_, i) => ({
            index: i,
            plot: plotBySlot.get(i) ?? null,
            unlocked: i < totalSlots,
        }));
    }, [plotBySlot, totalSlots]);

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
                playSound('water_plant');

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
        if (!currentPlot) return;

        // Use client-side growth check
        const growth = growthMap.get(currentPlot.id);
        if (!growth?.isReady) return;

        harvestMutation.mutate(currentPlot.id, {
            onSuccess: (data) => {
                playSound('harvest');
                const plantEmoji = data.plantEmoji || '🌾';
                const plantName = data.plantName || 'Nông sản';
                const ognEarned = data.ognEarned || 0;
                const xp = data.xpGained || 0;

                setHarvestResult({
                    plantEmoji,
                    plantName,
                    ognEarned,
                    xp,
                    leveledUp: data.leveledUp,
                });
                setTimeout(() => setHarvestResult(null), 3000);

                showFlyUp(`+${ognEarned} OGN +${xp} XP`);

                if (data.leveledUp) {
                    showLevelUp(data.newLevel);
                }
            },
            onError: (error) => {
                handleGameError(error, 'harvest');
            },
        });
    }, [harvestMutation, showFlyUp, activePlotIndex, plots, growthMap]);

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

    // ─── Phase 7: Handle slot click (empty or locked) ───
    const handleSlotClick = useCallback((slotIndex: number, unlocked: boolean) => {
        if (!unlocked) {
            navigate('/vip/purchase');
            return;
        }
        console.log('[FARM-DEBUG] FarmingScreen — EMPTY SLOT CLICKED:', slotIndex);
        setPlantSlotIndex(slotIndex);
        setShowPlantPicker(true);
    }, [navigate]);

    // ─── Handle empty slot click (legacy compat for "Plant First Seed" button) ───
    const handleEmptySlotClick = useCallback(() => {
        handleSlotClick(0, true);
    }, [handleSlotClick]);

    // ─── Handle plant selection from picker (uses plantSlotIndex) ───
    const handleSelectPlantFromPicker = useCallback((plantTypeId: string) => {
        console.log('[FARM-DEBUG] FarmingScreen — PLANT SELECTED:', { slot: plantSlotIndex, type: plantTypeId });

        plantMutation.mutate(
            { slotIndex: plantSlotIndex, plantTypeId },
            {
                onSuccess: (data) => {
                    console.log('[FARM-DEBUG] FarmingScreen — PLANT SUCCESS:', JSON.stringify(data));
                    playSound('plant_seed');
                    setShowPlantPicker(false);
                    showPlantSuccess(
                        data.plantType?.name || 'Cây',
                        data.plantType?.emoji || '🌱'
                    );

                    // Set activePlotIndex to the newly planted plot
                    if (data.plot) {
                        // Find the index in the plots array after refetch
                        const newIndex = plots.findIndex((p) => p.slotIndex === data.plot.slotIndex);
                        setActivePlotIndex(newIndex >= 0 ? newIndex : plots.length);
                    }
                },
                onError: (error) => {
                    console.error('[FARM-DEBUG] FarmingScreen — PLANT ERROR:', error.message);
                    handleGameError(error, 'plant');
                },
            }
        );
    }, [plantMutation, plantSlotIndex, plots]);

    // Loading state
    if (plotsLoading) {
        return (
            <div className="h-[100dvh] max-w-[430px] mx-auto relative overflow-hidden flex items-center justify-center">
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
            <div className="h-[100dvh] max-w-[430px] mx-auto relative overflow-hidden flex items-center justify-center">
                <div className="text-center px-4">
                    <div className="text-4xl mb-2">😵</div>
                    <p className="text-red-400 text-sm mb-2">Lỗi tải vườn</p>
                    <p className="text-white/30 text-xs">{String(plotsError)}</p>
                </div>
            </div>
        );
    }

    const activeGrowth = activePlot ? growthMap.get(activePlot.id) : undefined;
    const growthPct = activeGrowth?.percent ?? 0;
    const stage = activePlot ? calculateStage(activePlot) : 'seed';
    const harvestReady = activeGrowth?.isReady ?? false;

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
        <div className="h-[100dvh] max-w-[430px] mx-auto relative overflow-hidden flex flex-col bg-[#81C784]">
            {/* Background Decor */}
            <div className="landscape-bg-v2 absolute inset-0 z-0 pointer-events-none" style={{
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

            <div className="relative z-10 flex-1 min-h-0 flex flex-col pb-20 overflow-y-auto overflow-x-hidden hide-scrollbar">
                {/* === HEADER === */}
                <header className="flex flex-col gap-3 px-4 pt-safe mt-2 z-50 shrink-0">
                    {/* Row 1: Profile & Weather */}
                    <div className="flex items-center justify-between gap-2">
                        {/* User Profile Glass UI */}
                        <div className="flex items-center gap-2.5 glass-ui-v2 p-1 pr-3 rounded-full flex-shrink-1 min-w-0 shadow-sm border border-white/40">
                            <div className="relative group cursor-pointer shrink-0" onClick={() => navigate('/profile')}>
                                <div className={`w-10 h-10 rounded-full border-2 overflow-hidden bg-white flex items-center justify-center ${isVip ? 'border-[#FDB931]' : 'border-white'}`}>
                                    {(auth?.user?.picture || profile?.picture) ? (
                                        <img
                                            alt={auth?.user?.name || profile?.name}
                                            className="w-full h-full object-cover"
                                            src={auth?.user?.picture || profile?.picture}
                                        />
                                    ) : (
                                        <span className="text-xl">🧑‍🌾</span>
                                    )}
                                </div>
                                {isVip && (
                                    <div className="absolute -top-1.5 -left-1.5 bg-gradient-to-r from-yellow-300 to-yellow-500 text-[#8B4513] text-[8px] px-1.5 py-[1px] rounded-full font-black border border-white shadow flex items-center gap-0.5 z-10 -rotate-12">
                                        <span className="material-symbols-outlined text-[10px] fill-current">crown</span>
                                        <span className="tracking-widest drop-shadow-sm">VIP</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0 py-0.5">
                                <h1 className="font-black text-[12px] text-gray-800 leading-none mb-1 truncate">
                                    {auth?.user?.name || profile?.name || 'Nông dân'}
                                </h1>
                                <div className="flex items-center gap-1.5">
                                    <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm border border-yellow-500 uppercase leading-none">Lv.{profile?.level || 1}</span>
                                    <button onClick={() => navigate('/points')} className="text-amber-900 active:scale-95 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[16px]">notifications</span>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className={`active:scale-95 flex items-center justify-center ${isMuted ? 'text-amber-900/50' : 'text-amber-900'}`}>
                                        <span className="material-symbols-outlined text-[16px]">{isMuted ? 'volume_off' : 'volume_up'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Weather & Location Pill */}
                        <div className="glass-ui-v2 rounded-full px-3 py-1.5 flex items-center gap-2 border border-white/40 shrink-0 shadow-sm">
                            <div className="flex flex-col items-end">
                                <span className={`text-[8px] font-black ${subTextColor} uppercase tracking-tighter leading-none mb-0.5`}>{currentDate}</span>
                                <div className="flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[10px] text-blue-500 max-w-full">location_on</span>
                                    <span className={`text-[9px] font-bold ${textColor} truncate max-w-[55px]`}>{locationName}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5 border-l border-white/30 pl-2">
                                <span className={`material-symbols-outlined text-[16px] ${temperature > 25 ? 'text-red-500' : 'text-blue-500'}`}>
                                    {temperature > 25 ? 'device_thermostat' : 'ac_unit'}
                                </span>
                                <span className={`text-[12px] font-black ${textColor} leading-none`}>{Math.round(temperature)}°</span>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Scrollable Stats & Shortcuts (Horizontal) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-1 -mx-4 hide-scrollbar snap-x">
                        {/* Pad left spacing */}
                        <div className="snap-start shrink-0 w-3"></div>

                        {/* OGN Balance */}
                        < div onClick={() => navigate('/ogn-history')
                        } className="snap-start shrink-0 wood-sign-v2 rounded-xl px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition-transform shadow-sm cursor-pointer border border-[#8B4513]/30" >
                            <span className="text-[14px] drop-shadow-sm">🪙</span>
                            <span className="font-black text-[#5D4037] text-xs"><AnimatedNumber value={profile?.ogn ?? 0} /></span>
                        </div >

                        {/* Energy */}
                        < div className="snap-start shrink-0 wood-sign-v2 rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-[#8B4513]/30" >
                            <span className="text-[14px] drop-shadow-sm">⚡</span>
                            <span className="font-black text-[#5D4037] text-xs">8/10</span>
                        </div >

                        {/* RWA Nông Trại Button */}
                        < button onClick={() => navigate('/rwa/my-garden')} className="snap-start shrink-0 bg-gradient-to-br from-green-500 to-green-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-green-400 shadow-md active:scale-95 transition-transform" >
                            <span className="material-symbols-outlined text-green-100 text-[14px]">grass</span>
                            <span className="text-[9px] font-black text-white uppercase tracking-wider">RWA Farm</span>
                        </button >

                        {/* My Garden Button */}
                        < button onClick={() => navigate('/rwa/my-garden')} className="snap-start shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-blue-400 shadow-md active:scale-95 transition-transform" >
                            <span className="material-symbols-outlined text-blue-100 text-[14px]">yard</span>
                            <span className="text-[9px] font-black text-white uppercase tracking-wider">My Garden</span>
                        </button >

                        {/* Minimap Region */}
                        < div className="snap-start shrink-0 bg-green-100 border border-green-300 rounded-xl px-3 py-1.5 flex items-center gap-1 cursor-pointer active:scale-95 transition-transform shadow-sm mr-4" onClick={() => { }}>
                            <span className="material-symbols-outlined text-green-600 text-[14px]">map</span>
                            <span className="text-[9px] font-black text-green-800 uppercase">Vùng 1</span>
                        </div >
                    </div >
                </header >

                {/* === CENTRAL FARM VIEW === */}
                <div className="flex-1 flex flex-col justify-end items-center px-4 w-full relative z-20 min-h-[380px]">
                    {activePlot ? (
                        <div className="relative w-full flex flex-col items-center justify-end h-full">
                            {/* Status Indicators overlaying top of stage */}
                            <div className="absolute top-4 w-full flex justify-center gap-3 z-30 pointer-events-none">
                                <div className={`bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-md border flex items-center gap-1 text-[9px] font-black uppercase tracking-wider ${activePlot.isDead ? 'border-red-300 text-red-600' : 'border-green-300 text-green-700'}`}>
                                    <span className="material-symbols-outlined text-[12px]">{activePlot.isDead ? 'sentiment_dissatisfied' : 'check_circle'}</span>
                                    {activePlot.isDead ? 'Héo Rỗi' : 'Khỏe Mạnh'}
                                </div>
                                {!activePlot.isDead && (
                                    <div className={`bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-md border flex items-center gap-1 text-[9px] font-black uppercase tracking-wider ${activePlot.happiness >= 50 ? 'border-blue-300 text-blue-600' : 'border-amber-300 text-amber-600'}`}>
                                        <span className="material-symbols-outlined text-[12px]">{activePlot.happiness >= 50 ? 'water_drop' : 'opacity'}</span>
                                        {activePlot.happiness >= 50 ? 'Đủ Nước' : 'Khát Nước'}
                                    </div>
                                )}
                            </div>

                            {/* Harvest Ready Big Indicator */}
                            {
                                harvestReady && !activePlot.isDead && (
                                    <div className="absolute top-16 z-30 pointer-events-none animate-bounce flex flex-col items-center">
                                        <div className="bg-yellow-400 text-yellow-900 border-2 border-white px-4 py-1.5 rounded-full font-black text-sm shadow-lg flex items-center gap-1 drop-shadow-md">
                                            <span className="text-lg">🌾</span> Thu hoạch ngay!
                                        </div>
                                    </div>
                                )
                            }

                            {/* Progress UI Card (Moved above plant for clarity) */}
                            <div className="w-[80%] max-w-[280px] bg-white/75 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/60 z-30 mb-auto mt-16 pointer-events-auto shrink-0">
                                <div className="flex justify-between items-end text-gray-700 mb-1.5">
                                    <span className="text-[12px] font-black truncate flex-1 leading-none">{activePlot.plantType.name}</span>
                                    <span className="text-[10px] font-bold text-green-700 bg-green-100 rounded px-1.5 py-0.5 leading-none shrink-0 border border-green-200">{growthPct}%</span>
                                </div>
                                <div className="relative h-2 w-full bg-gray-300/80 rounded-full overflow-hidden shadow-inner flex mb-1.5 border border-black/5">
                                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-1000 shadow-sm" style={{ width: `${Math.max(2, growthPct)}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-bold text-gray-500">
                                    <span className="uppercase tracking-wide">{STAGE_LABELS[stage]}</span>
                                    <span className="flex items-center gap-0.5 text-amber-700">
                                        <span className="material-symbols-outlined text-[12px]">timer</span>
                                        {activePlot.isDead ? 'Đã chết' : harvestReady ? 'Hoàn thành' : activeGrowth?.remainingText || '...'}
                                    </span>
                                </div>
                            </div>

                            {/* Water Splash visual effect */}
                            {
                                showWaterEffect && (
                                    <div className="absolute inset-x-0 bottom-[120px] pointer-events-none z-40 flex items-center justify-center">
                                        {[...Array(6)].map((_, i) => (
                                            <span key={i} className="absolute animate-sparkle-up text-3xl" style={{ left: `${40 + Math.random() * 20}%`, top: `${-20 + Math.random() * 40}px`, animationDelay: `${i * 0.1}s` }}>💦</span>
                                        ))}
                                    </div>
                                )
                            }

                            {/* The Plant & Actions wrapper */}
                            <div className="relative z-20 flex flex-col items-center mt-[-10px] pb-4">

                                {/* Main Interactive Plant */}
                                <div
                                    className={`relative z-20 flex items-end justify-center w-48 h-48 cursor-pointer transition-transform active:scale-95 group focus:outline-none`}
                                    onClick={() => harvestReady && !activePlot.isDead ? handleHarvest() : null}
                                >
                                    {/* Glow effect on hover/active if harvestable */}
                                    {harvestReady && !activePlot.isDead && (
                                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl z-0 pointer-events-none animate-pulse"></div>
                                    )}

                                    <div className={`text-[150px] leading-[0.8] drop-shadow-2xl z-20 origin-bottom animate-sway-center pointer-events-none ${activePlot.isDead ? 'grayscale opacity-80' : ''}`}>
                                        {activePlot.isDead ? '🥀' : getPlantSprite(activePlot)}
                                    </div>
                                </div>

                                {/* Soil Mound Base */}
                                <div className="relative z-10 -mt-[45px] pointer-events-none">
                                    <div className="w-[160px] h-[45px] soil-mound-v2 mx-auto" style={{ borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%' }}></div>
                                    <div className="absolute top-[10px] left-[20px] w-4 h-2 bg-white/20 rounded-full opacity-60"></div>
                                    <div className="absolute bottom-[8px] right-[30px] w-3 h-2 bg-black/20 rounded-full opacity-40"></div>
                                </div>

                                {/* Contextual Floating Actions attached to the plant area */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-[40%] -translate-y-[20%] w-full flex justify-center pointer-events-none">

                                    {/* Water Action */}
                                    {!harvestReady && !activePlot.isDead && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleWater(); }}
                                            disabled={!canWater(activePlot.id) || waterMutation.isPending}
                                            className={`pointer-events-auto absolute -right-2 top-0 bg-[#039BE5] p-3 rounded-full shadow-lg border-[3px] border-white text-white z-40 transition-all ${(!canWater(activePlot.id) || waterMutation.isPending) ? 'opacity-50 grayscale scale-95' : 'hover:scale-105 active:scale-95 shadow-[#039BE5]/50 animate-bounce'}`}
                                        >
                                            <span className="material-symbols-outlined text-[26px]">water_drop</span>
                                            {(!canWater(activePlot.id)) && (
                                                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-md shadow-md whitespace-nowrap border border-blue-200 leading-none">
                                                    {getCooldownRemaining(activePlot.id)}s
                                                </span>
                                            )}
                                        </button>
                                    )}

                                    {/* Clear Action (Dead plant) */}
                                    {activePlot.isDead && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleClear(); }}
                                            disabled={clearMutation.isPending}
                                            className="pointer-events-auto absolute -right-0 top-6 bg-red-500 p-3 rounded-full shadow-lg border-[3px] border-white text-white z-40 transition-all hover:scale-105 active:scale-95 animate-bounce"
                                        >
                                            <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
                                        </button>
                                    )}

                                    {/* Huge Area Harvest Invisible Button if ready */}
                                    {harvestReady && !activePlot.isDead && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleHarvest(); }}
                                            className="pointer-events-auto absolute w-48 h-48 opacity-0 z-50 cursor-pointer"
                                            aria-label="Harvest"
                                        />
                                    )}
                                </div>
                            </div>
                        </div >
                    ) : (
                        // EMPTY STATE (No active plot selected or planted)
                        <div className="flex flex-col items-center justify-center p-8 bg-white/50 backdrop-blur-md rounded-[32px] border border-white/60 shadow-xl mb-auto mt-20 w-[85%] max-w-[300px]">
                            <span className="text-6xl mb-3 animate-bounce">🌱</span>
                            <p className="font-heading font-black text-xl text-green-900 leading-tight">Chưa có cây!</p>
                            <p className="text-xs text-green-800/80 mt-1 mb-5 text-center px-4">Hãy chọn ô đất trống bên dưới để gieo hạt giống nhé.</p>
                            <button
                                onClick={handleEmptySlotClick}
                                className="px-6 py-3 rounded-xl bg-gradient-to-b from-green-500 to-green-600 text-white font-black text-sm shadow-[0_4px_0_#1b5e20] active:translate-y-1 active:shadow-none transition-all w-full border border-green-700 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                Trồng cây ngay
                            </button>
                        </div>
                    )}
                </div >

                {/* === PLOT SELECTOR GRID === */}
                < div className="px-4 py-2 shrink-0 z-30" >
                    <div className="flex gap-2.5 justify-center w-full max-w-[350px] mx-auto bg-green-900/10 p-2.5 rounded-3xl border border-green-900/5 backdrop-blur-sm">
                        {slotGrid.map((slot) => {
                            const growth = slot.plot ? growthMap.get(slot.plot.id) : undefined;
                            const isSelected = slot.plot && plots.indexOf(slot.plot) === activePlotIndex;
                            const isSlotActive = (!slot.plot && slot.index === plantSlotIndex) || isSelected;

                            // 1) LOCKED SLOT
                            if (!slot.unlocked) {
                                return (
                                    <button
                                        key={slot.index}
                                        onClick={() => handleSlotClick(slot.index, false)}
                                        className="flex-1 aspect-square max-h-[75px] rounded-2xl bg-gray-900/40 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center transition-transform active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-white/40 text-[20px] mb-1">lock</span>
                                        <span className="text-[8px] font-black text-white/50 uppercase tracking-wider">Mở VIP</span>
                                    </button>
                                );
                            }

                            // 2) EMPTY SLOT
                            if (!slot.plot) {
                                return (
                                    <button
                                        key={slot.index}
                                        onClick={() => handleSlotClick(slot.index, true)}
                                        className={`flex-1 aspect-square max-h-[75px] rounded-2xl backdrop-blur-md border border-dashed flex flex-col items-center justify-center transition-all active:scale-95 ${plantSlotIndex === slot.index ? 'bg-white/60 border-green-500 shadow-sm ring-2 ring-green-400' : 'bg-white/30 border-green-700/40 hover:bg-white/40'}`}
                                    >
                                        <span className="material-symbols-outlined text-green-700 text-[24px]">add</span>
                                        <span className="text-[9px] font-bold text-green-800 mt-0.5">Trống</span>
                                    </button>
                                );
                            }

                            // 3) PLANTED SLOT
                            return (
                                <button
                                    key={slot.index}
                                    onClick={() => {
                                        const idx = plots.indexOf(slot.plot!);
                                        if (idx >= 0) setActivePlotIndex(idx);
                                    }}
                                    className={`relative flex-1 aspect-square max-h-[75px] rounded-2xl backdrop-blur-md border flex flex-col items-center justify-center transition-all active:scale-90 ${isSelected ? 'bg-white border-green-400 shadow-md ring-2 ring-green-300 transform scale-[1.05] z-10' : 'bg-white/50 border-white/60 hover:bg-white/60'}`}
                                >
                                    <span className={`text-[30px] leading-none drop-shadow-sm transition-all ${slot.plot.isDead ? 'grayscale opacity-70' : ''} ${isSelected ? 'scale-110 mb-1' : ''}`}>
                                        {slot.plot.isDead ? '🥀' : slot.plot.plantType.emoji}
                                    </span>

                                    {!slot.plot.isDead && growth && (
                                        <div className="absolute bottom-1.5 w-[70%] h-1 bg-gray-200/80 rounded-full overflow-hidden border border-black/5">
                                            <div className={`h-full rounded-full ${growth.isReady ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${Math.max(10, growth.percent)}%` }} />
                                        </div>
                                    )}
                                    {slot.plot.isDead && (
                                        <span className="absolute bottom-1.5 text-[7px] text-white font-bold bg-red-500 px-1 rounded shadow-sm">Chết</span>
                                    )}
                                    {growth?.isReady && !slot.plot.isDead && (
                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-yellow-400 border border-white rounded-full flex items-center justify-center text-[10px] animate-pulse">🌾</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div >

                {/* === TOOLBELT (Floating Actions row) === */}
                < div className="px-5 py-2 mb-4 shrink-0 z-40" >
                    <div className="flex justify-between items-center bg-white/30 backdrop-blur-md rounded-[24px] p-2 border border-white/40 shadow-sm max-w-[340px] mx-auto gap-2">

                        <button onClick={() => navigate('/prayer')} className="flex-1 group flex flex-col items-center gap-1 active:scale-95">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#B39DDB] to-[#7E57C2] shadow border border-white/60 flex items-center justify-center">
                                <span className="text-xl drop-shadow-sm">🙏</span>
                            </div>
                        </button>

                        <button onClick={() => navigate('/quiz')} className="flex-1 group flex flex-col items-center gap-1 relative active:scale-95">
                            <span className="absolute top-[-4px] right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm border border-white z-10 animate-bounce">!</span>
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#FFCC80] to-[#FFA726] shadow border border-white/60 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[20px] text-white drop-shadow-sm">school</span>
                            </div>
                        </button>

                        <button onClick={() => navigate('/market')} className="flex-1 group flex flex-col items-center gap-1 active:scale-95">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#80CBC4] to-[#26A69A] shadow border border-white/60 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[20px] text-white drop-shadow-sm">monitoring</span>
                            </div>
                        </button>

                        <button onClick={() => setShowFriends(true)} className="flex-1 group flex flex-col items-center gap-1 active:scale-95">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#F48FB1] to-[#EC407A] shadow border border-white/60 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[20px] text-white drop-shadow-sm">group</span>
                            </div>
                        </button>

                        <button onClick={() => navigate('/campaign')} className="flex-1 group flex flex-col items-center gap-1 active:scale-95">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#FFAB91] to-[#FF7043] shadow border border-white/60 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[20px] text-white drop-shadow-sm">explore</span>
                            </div>
                        </button>

                    </div>
                </div >

            </div >
            {/* end container flex-1 */}

            < div className="z-50 shrink-0" >
                <BottomNav />
            </div >

            <Toast />
            <PointsFlyUp />

            {/* Harvest animation overlay */}
            {
                harvestResult && (
                    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setHarvestResult(null)}
                    >
                        <div className="animate-bounce-short text-center bg-white/95 rounded-[32px] p-8 shadow-2xl border-2 border-green-400 max-w-[85%] relative overflow-hidden pointer-events-auto cursor-pointer">
                            {/* Confetti element */}
                            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>

                            <div className="text-[90px] leading-none mb-3 drop-shadow-lg relative z-10">{harvestResult.plantEmoji}</div>
                            <div className="text-xl font-black text-green-700 mb-2 leading-tight relative z-10">
                                Thu hoạch thành công<br />{harvestResult.plantName}!
                            </div>
                            <div className="flex justify-center gap-2 mt-4 relative z-10">
                                <div className="bg-yellow-50 text-yellow-800 font-bold px-3 py-1.5 rounded-xl border border-yellow-300 whitespace-nowrap shadow-sm flex items-center gap-1">
                                    +{harvestResult.ognEarned} <span className="text-[14px]">🪙</span> OGN
                                </div>
                                <div className="bg-blue-50 text-blue-800 font-bold px-3 py-1.5 rounded-xl border border-blue-300 whitespace-nowrap shadow-sm flex items-center gap-1">
                                    +{harvestResult.xp} <span className="text-[14px]">⚡</span> XP
                                </div>
                            </div>
                            {harvestResult.leveledUp && (
                                <div className="mt-5 text-purple-700 font-black animate-pulse text-lg py-2 bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 rounded-xl border border-purple-300 shadow-sm relative z-10">
                                    🎉 LÊN CẤP NÔNG DÂN 🎉
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            <PlantSeedModal open={showPlantModal} onClose={() => setShowPlantModal(false)} onSelect={handleSelectPlant} />
            {
                showPlantPicker && (
                    <PlantPickerModal
                        onSelect={handleSelectPlantFromPicker}
                        onClose={() => setShowPlantPicker(false)}
                        isPlanting={plantMutation.isPending}
                    />
                )
            }
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
