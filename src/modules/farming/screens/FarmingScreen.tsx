import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useCooldown } from '@/shared/hooks/useCooldown';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useWeather } from '@/shared/hooks/useWeather';
import { PlantType } from '../types/farm.types';
import { useTransformedFarmPlots } from '@/shared/hooks/useFarmPlots';
import { useGrowthTimer } from '@/shared/hooks/useGrowthTimer';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { useVipStatus } from '@/shared/hooks/useVipStatus';
import { playSound, audioManager } from '@/shared/audio';
import { useUIStore } from '@/shared/stores/uiStore';

// UI Components
import FarmHeader from '../components/ui/FarmHeader';
import FarmToolbelt from '../components/ui/FarmToolbelt';
import FarmPlotGrid from '../components/ui/FarmPlotGrid';
import FarmActivePlot from '../components/ui/FarmActivePlot';
import FarmHarvestOverlay from '../components/ui/FarmHarvestOverlay';

// Hooks
import { useFarmingActions } from '../hooks/useFarmingActions';

const MAX_DISPLAY_SLOTS = 3;

export default function FarmingScreen() {
    const navigate = useNavigate();
    const { data: plots, totalSlots, isLoading: plotsLoading, error: plotsError } = useTransformedFarmPlots();
    const { data: profile } = usePlayerProfile();
    const { data: auth } = useAuth();
    const { isVip } = useVipStatus();
    const { data: weatherData, error: weatherError } = useWeather();
    const setWeatherData = useWeatherStore((s) => s.setWeatherData);
    const addToast = useUIStore((s) => s.addToast);
    const getCooldown = useFarmStore((s) => s.getWaterCooldownRemaining);
    const plantSeedZustand = useFarmStore((s) => s.plantSeed);

    const [activePlotIndex, setActivePlotIndex] = useState(0);
    const [plantSlotIndex, setPlantSlotIndex] = useState(0);
    const [showPlantModal, setShowPlantModal] = useState(false);
    const [showPlantPicker, setShowPlantPicker] = useState(false);
    const [showBugGame, setShowBugGame] = useState(false);
    const [showWaterEffect, setShowWaterEffect] = useState(false);
    const [showFriends, setShowFriends] = useState(false);
    const [visitingFriend, setVisitingFriend] = useState<FriendData | null>(null);
    const [showInvite, setShowInvite] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [isMuted, setIsMuted] = useState(audioManager.muted);

    const timeOfDay = useWeatherStore((s) => s.timeOfDay);
    const temperature = useWeatherStore((s) => s.temperature);
    const locationName = useWeatherStore((s) => s.location.province) || 'Thái Nguyên';

    const activePlot = useMemo(() => plots[activePlotIndex] || null, [plots, activePlotIndex]);
    const cooldownSeconds = activePlot ? getCooldown(activePlot.id) : 0;
    const { start } = useCooldown(cooldownSeconds);

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

    const {
        handleWater, canWater, getCooldownRemaining, handleHarvest, handleClear,
        handleSelectPlantFromPicker, harvestResult, setHarvestResult,
        isWatering, isClearing, isPlanting
    } = useFarmingActions(plots, activePlotIndex, growthMap, setActivePlotIndex, start);

    useEffect(() => {
        audioManager.preloadScene('farming');
        audioManager.startBgm('farm');
        return () => { audioManager.stopBgm(); };
    }, []);

    useEffect(() => {
        if (weatherData) setWeatherData(weatherData);
    }, [weatherData, setWeatherData]);

    useEffect(() => { startHappinessDecay(); }, []);

    const toggleMute = () => {
        const muted = audioManager.toggleMute();
        setIsMuted(muted);
        if (!muted) playSound('ui_click');
    };

    const plotBySlot = useMemo(() => new Map(plots.map((p) => [p.slotIndex, p])), [plots]);
    const slotGrid = useMemo(() => {
        return Array.from({ length: MAX_DISPLAY_SLOTS }, (_, i) => ({
            index: i,
            plot: plotBySlot.get(i) ?? null,
            unlocked: i < totalSlots,
        }));
    }, [plotBySlot, totalSlots]);

    const getCelestialState = useCallback(() => {
        const now = new Date();
        const totalMinutes = now.getHours() * 60 + now.getMinutes();
        let isNightLocal = false;
        let progress = 0;

        if (totalMinutes >= 360 && totalMinutes < 1080) {
            isNightLocal = false;
            progress = (totalMinutes - 360) / 720;
        } else {
            isNightLocal = true;
            if (totalMinutes >= 1080) {
                progress = (totalMinutes - 1080) / 720;
            } else {
                progress = (totalMinutes + 360) / 720;
            }
        }
        const left = -10 + progress * 105;
        const top = 25 - (Math.sin(Math.PI * progress) * 18);
        return { left: `${left}%`, top: `${top}%`, isNight: isNightLocal };
    }, []);

    const celestial = getCelestialState();
    const currentDate = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const handleSlotClick = useCallback((slotIndex: number, unlocked: boolean) => {
        if (!unlocked) return navigate('/vip/purchase');
        setPlantSlotIndex(slotIndex);
        setShowPlantPicker(true);
    }, [navigate]);

    const handleWaterWithEffect = useCallback(() => {
        handleWater();
        setShowWaterEffect(true);
        setTimeout(() => setShowWaterEffect(false), 1200);
    }, [handleWater]);

    const handleEmptySlotClick = useCallback(() => handleSlotClick(0, true), [handleSlotClick]);

    const handleSelectPlant = useCallback((plantType: PlantType) => {
        const currentLength = plots.length;
        plantSeedZustand(plantType, currentLength);
        setShowPlantModal(false);
        setActivePlotIndex(currentLength);
        addToast(`Đã trồng ${plantType.name} ${plantType.emoji}!`, 'success');
    }, [plantSeedZustand, addToast, plots.length]);

    if (plotsLoading) {
        return (
            <div className="h-[100dvh] max-w-[430px] mx-auto relative overflow-hidden flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-pulse text-4xl mb-2">🌱</div>
                    <p className="text-sm text-white/70">Đang tải vườn...</p>
                    <div className="grid grid-cols-3 gap-3 mt-4 px-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

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

    return (
        <div className="h-[100dvh] max-w-[430px] mx-auto relative overflow-hidden flex flex-col bg-[#81C784]">
            {/* Background Decor */}
            <div className="landscape-bg-v2 absolute inset-0 z-0 pointer-events-none" style={{
                background: celestial.isNight
                    ? 'linear-gradient(180deg, #1A237E 0%, #3949AB 40%, #A5D6A7 40%, #81C784 100%)'
                    : 'linear-gradient(180deg, #87CEEB 0%, #E0F7FA 40%, #A5D6A7 40%, #81C784 100%)'
            }}>
                <div className={celestial.isNight ? "moon-v2" : "sun-v2"} style={{ left: celestial.left, top: celestial.top }} />
                <div className="cloud w-32 h-12 top-20 left-10 cloud-decoration opacity-80" style={{ fontSize: '40px' }}>☁️</div>
                <div className="cloud w-24 h-8 top-32 right-20 opacity-60 cloud-decoration" style={{ fontSize: '30px' }}>☁️</div>
                <div className="hill-bg-v2 opacity-50"></div>
                <div className="hill-fg-v2"></div>
                <div className="absolute bottom-[35%] left-[10%] opacity-20 pointer-events-none">
                    <span className="material-symbols-outlined text-green-950 text-7xl transform -rotate-12">grass</span>
                </div>
                <div className="absolute bottom-[38%] right-[25%] opacity-20 pointer-events-none">
                    <span className="material-symbols-outlined text-green-950 text-8xl transform rotate-6">grass</span>
                </div>
            </div>

            <div className="relative z-10 flex-1 min-h-0 flex flex-col pb-20 overflow-y-auto overflow-x-hidden hide-scrollbar">
                <FarmHeader
                    profile={profile} auth={auth} isVip={isVip} temperature={temperature}
                    locationName={locationName} currentDate={currentDate} isNightLocal={celestial.isNight}
                    isMuted={isMuted} toggleMute={toggleMute}
                />

                <div className="flex-1 flex flex-col justify-end items-center px-4 w-full relative z-20 min-h-[380px]">
                    <FarmActivePlot
                        activePlot={activePlot} growthMap={growthMap} showWaterEffect={showWaterEffect}
                        canWater={canWater} getCooldownRemaining={getCooldownRemaining}
                        handleWater={handleWaterWithEffect} handleHarvest={handleHarvest} handleClear={handleClear}
                        handleEmptySlotClick={handleEmptySlotClick} isWatering={isWatering} isClearing={isClearing}
                    />
                </div>

                <FarmPlotGrid
                    slotGrid={slotGrid} plots={plots} activePlotIndex={activePlotIndex}
                    plantSlotIndex={plantSlotIndex} growthMap={growthMap}
                    handleSlotClick={handleSlotClick} setActivePlotIndex={setActivePlotIndex}
                />

                <FarmToolbelt setShowFriends={setShowFriends} />
            </div>

            <div className="z-50 shrink-0"><BottomNav /></div>
            <Toast />
            <PointsFlyUp />
            <FarmHarvestOverlay harvestResult={harvestResult} onClose={() => setHarvestResult(null)} />

            <PlantSeedModal open={showPlantModal} onClose={() => setShowPlantModal(false)} onSelect={handleSelectPlant} />
            {showPlantPicker && (
                <PlantPickerModal
                    onSelect={(slotIndex, plantTypeId) => handleSelectPlantFromPicker(slotIndex, plantTypeId, setShowPlantPicker)}
                    onClose={() => setShowPlantPicker(false)}
                    isPlanting={isPlanting}
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
