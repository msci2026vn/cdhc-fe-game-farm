import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Toast from '@/shared/components/Toast';
import PointsFlyUp from '@/shared/components/PointsFlyUp';
import PlantSeedModal from '../components/PlantSeedModal';
import PlantPickerModal from '../components/PlantPickerModal';
import BugCatchGame from '../components/BugCatchGame';
import InviteFriends from '@/modules/friends/components/InviteFriends';
import Leaderboard from '@/modules/friends/components/Leaderboard';
import { useFarmStore, startHappinessDecay } from '../stores/farmStore';
import { useWeatherStore } from '../stores/weatherStore';
import { useCooldown } from '@/shared/hooks/useCooldown';
import { useWeather } from '@/shared/hooks/useWeather';
import { PlantType } from '../types/farm.types';
import { useTransformedFarmPlots } from '@/shared/hooks/useFarmPlots';
import { useGrowthTimer } from '@/shared/hooks/useGrowthTimer';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { useVipStatus } from '@/shared/hooks/useVipStatus';
import { audioManager } from '@/shared/audio';
import { useUIStore } from '@/shared/stores/uiStore';

// UI Components
import FarmCharacterHUD from '../components/ui/FarmCharacterHUD';
import FarmWeatherOGN from '../components/ui/FarmWeatherOGN';
import RwaFarmBanner from '../components/ui/RwaFarmBanner';
import FarmPlotRow from '../components/ui/FarmPlotRow';
import FarmActionBar from '../components/ui/FarmActionBar';
import FarmHarvestOverlay from '../components/ui/FarmHarvestOverlay';

// Hooks
import { useFarmingActions } from '../hooks/useFarmingActions';

// CSS
import '@/styles/modules/farm-redesign.css';

const MAX_DISPLAY_SLOTS = 3;

export default function FarmingScreen() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: plots, totalSlots, isLoading: plotsLoading, error: plotsError } = useTransformedFarmPlots();
    const { data: profile } = usePlayerProfile();
    const { data: auth } = useAuth();
    const { isVip } = useVipStatus();
    const { data: weatherData } = useWeather();
    const setWeatherData = useWeatherStore((s) => s.setWeatherData);
    const addToast = useUIStore((s) => s.addToast);
    const getCooldown = useFarmStore((s) => s.getWaterCooldownRemaining);
    const plantSeedZustand = useFarmStore((s) => s.plantSeed);

    const [activePlotIndex, setActivePlotIndex] = useState(0);
    const [plantSlotIndex, setPlantSlotIndex] = useState(0);
    const [showPlantModal, setShowPlantModal] = useState(false);
    const [showPlantPicker, setShowPlantPicker] = useState(false);
    const [showBugGame, setShowBugGame] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const temperature = useWeatherStore((s) => s.temperature);
    const humidity = useWeatherStore((s) => s.humidity ?? 50);

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

    const plotBySlot = useMemo(() => new Map(plots.map((p) => [p.slotIndex, p])), [plots]);
    const slotGrid = useMemo(() => {
        return Array.from({ length: MAX_DISPLAY_SLOTS }, (_, i) => ({
            index: i,
            plot: plotBySlot.get(i) ?? null,
            unlocked: i < totalSlots,
        }));
    }, [plotBySlot, totalSlots]);

    // Per-plot action wrappers: set activePlotIndex then call handler
    const handlePlotWater = useCallback((plotIdx: number) => {
        setActivePlotIndex(plotIdx);
        // Need to call water directly since setState is async
        // The handler reads plots[activePlotIndex], so we schedule it
        setTimeout(() => handleWater(), 0);
    }, [handleWater]);

    const handlePlotHarvest = useCallback((plotIdx: number) => {
        setActivePlotIndex(plotIdx);
        setTimeout(() => handleHarvest(), 0);
    }, [handleHarvest]);

    const handlePlotClear = useCallback((plotIdx: number) => {
        setActivePlotIndex(plotIdx);
        setTimeout(() => handleClear(), 0);
    }, [handleClear]);

    const handlePlotPlant = useCallback((slotIndex: number) => {
        setPlantSlotIndex(slotIndex);
        setShowPlantPicker(true);
    }, []);

    const handleLockedSlot = useCallback(() => {
        navigate('/vip/purchase');
    }, [navigate]);

    const handleSelectPlant = useCallback((plantType: PlantType) => {
        const currentLength = plots.length;
        plantSeedZustand(plantType, currentLength);
        setShowPlantModal(false);
        setActivePlotIndex(currentLength);
        addToast(t('farming.messages.planted', { plantName: plantType.name, emoji: plantType.emoji }), 'success');
    }, [plantSeedZustand, addToast, plots.length, t]);

    // Loading
    if (plotsLoading) {
        return (
            <div className="farm-screen-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="farm-bg" />
                <div style={{ textAlign: 'center', zIndex: 10 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }} className="animate-pulse">🌱</div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{t('farming.messages.loading')}</p>
                </div>
            </div>
        );
    }

    // Error
    if (plotsError) {
        return (
            <div className="farm-screen-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="farm-bg" />
                <div style={{ textAlign: 'center', zIndex: 10, padding: 16 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>😵</div>
                    <p style={{ color: '#ef5350', fontSize: 13 }}>{t('farming.messages.error_load')}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>{String(plotsError)}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="farm-screen-container">
            {/* Background — nen.jpeg */}
            <div className="farm-bg" />

            {/* TOP-LEFT: Character HUD */}
            <FarmCharacterHUD
                avatarUrl={auth?.user?.picture || profile?.picture}
                name={auth?.user?.name || profile?.name || t('farming.default_farmer')}
                title={t('farming.title')}
                level={profile?.level || 1}
                hp={profile?.hp ?? 100}
                maxHp={profile?.maxHp ?? 100}
                mana={profile?.mana ?? 50}
                maxMana={profile?.maxMana ?? 100}
                armor={profile?.armor ?? 3}
                maxArmor={profile?.maxArmor ?? 5}
            />

            {/* TOP-RIGHT: Weather + OGN */}
            <FarmWeatherOGN
                temperature={temperature}
                humidity={humidity}
                ognBalance={profile?.ogn ?? 0}
            />

            {/* CENTER-TOP: RWA Farm Banner */}
            <RwaFarmBanner isVip={isVip} />

            {/* Breadcrumb */}
            <div className="farm-breadcrumb">{t('farming.breadcrumb')}</div>

            {/* 3 Plot Row — all interactions built-in */}
            <FarmPlotRow
                slotGrid={slotGrid}
                growthMap={growthMap}
                canWater={canWater}
                getCooldownRemaining={getCooldownRemaining}
                onPlant={handlePlotPlant}
                onWater={handlePlotWater}
                onHarvest={handlePlotHarvest}
                onClear={handlePlotClear}
                onLocked={handleLockedSlot}
                isWatering={isWatering}
                isClearing={isClearing}
            />

            {/* BOTTOM: 4 Action Buttons */}
            <FarmActionBar
                onHome={() => navigate('/')}
                onDuGia={() => navigate('/market')}
                onShop={() => navigate('/shop')}
                onKhoDo={() => navigate('/inventory')}
            />

            {/* Overlays & Modals */}
            <Toast />
            <PointsFlyUp />
            <FarmHarvestOverlay harvestResult={harvestResult} onClose={() => setHarvestResult(null)} />
            <PlantSeedModal open={showPlantModal} onClose={() => setShowPlantModal(false)} onSelect={handleSelectPlant} />
            {showPlantPicker && (
                <PlantPickerModal
                    onSelect={(plantTypeId) => handleSelectPlantFromPicker(plantSlotIndex, plantTypeId, setShowPlantPicker)}
                    onClose={() => setShowPlantPicker(false)}
                    isPlanting={isPlanting}
                />
            )}
            <BugCatchGame open={showBugGame} onClose={() => setShowBugGame(false)} />
            <InviteFriends open={showInvite} onClose={() => setShowInvite(false)} />
            <Leaderboard open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
        </div>
    );
}
