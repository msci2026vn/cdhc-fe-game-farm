import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/shared/components/BottomNav';
import Toast from '@/shared/components/Toast';
import PointsFlyUp from '@/shared/components/PointsFlyUp';
import FarmHeader from '../components/FarmHeader';
import PlantSeedModal from '../components/PlantSeedModal';
import BugCatchGame from '../components/BugCatchGame';
import { useFarmStore, startHappinessDecay } from '../stores/farmStore';
import { useUIStore } from '@/shared/stores/uiStore';
import { calculateGrowthPercent, calculateStage, isHarvestReady, getPlantSprite, getMoodEmoji } from '../utils/growth';
import { formatTime } from '@/shared/utils/format';
import { useCooldown } from '@/shared/hooks/useCooldown';
import { PlantType } from '../types/farm.types';

export default function FarmingScreen() {
  const navigate = useNavigate();
  const plots = useFarmStore((s) => s.plots);
  const ogn = useFarmStore((s) => s.ogn);
  const plantSeed = useFarmStore((s) => s.plantSeed);
  const waterPlot = useFarmStore((s) => s.waterPlot);
  const harvestPlot = useFarmStore((s) => s.harvestPlot);
  const getCooldown = useFarmStore((s) => s.getWaterCooldownRemaining);
  const addToast = useUIStore((s) => s.addToast);
  const showFlyUp = useUIStore((s) => s.showFlyUp);

  const [activePlotIndex, setActivePlotIndex] = useState(0);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [showBugGame, setShowBugGame] = useState(false);
  const [showWaterEffect, setShowWaterEffect] = useState(false);
  const [, forceUpdate] = useState(0);

  const activePlot = plots[activePlotIndex] || null;

  const cooldownSeconds = activePlot ? getCooldown(activePlot.id) : 0;
  const { remaining, isActive, start } = useCooldown(cooldownSeconds);

  // Tick growth bars
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { startHappinessDecay(); }, []);

  const handleWater = useCallback(() => {
    if (!activePlot || activePlot.isDead) return;
    const success = waterPlot(activePlot.id);
    if (success) {
      setShowWaterEffect(true);
      setTimeout(() => setShowWaterEffect(false), 1200);
      showFlyUp('+15 💚');
      addToast('Tưới thành công! Cây vui hơn rồi 🌱', 'success');
      start(15);
    } else {
      addToast('Đang hồi chiêu, chờ thêm nhé ⏳', 'info');
    }
  }, [activePlot, waterPlot, showFlyUp, addToast, start]);

  const handleHarvest = useCallback(() => {
    if (!activePlot || !isHarvestReady(activePlot)) return;
    const reward = harvestPlot(activePlot.id);
    showFlyUp(`+${reward} OGN 🪙`);
    addToast(`Thu hoạch thành công! +${reward} OGN 🎉`, 'success');
    setTimeout(() => setShowPlantModal(true), 500);
  }, [activePlot, harvestPlot, showFlyUp, addToast]);

  const handleSelectPlant = useCallback((plantType: PlantType) => {
    plantSeed(plantType, plots.length);
    setShowPlantModal(false);
    setActivePlotIndex(plots.length);
    addToast(`Đã trồng ${plantType.name} ${plantType.emoji}!`, 'success');
  }, [plots.length, plantSeed, addToast]);

  const growthPct = activePlot ? calculateGrowthPercent(activePlot) : 0;
  const stage = activePlot ? calculateStage(activePlot) : 'seed';
  const harvestReady = activePlot ? isHarvestReady(activePlot) : false;

  const STAGE_LABELS: Record<string, string> = {
    seed: 'Giai đoạn 1/5', sprout: 'Giai đoạn 2/5', seedling: 'Giai đoạn 3/5', mature: 'Giai đoạn 4/5', dead: 'Đã chết',
  };

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative farm-sky-gradient">
      <FarmHeader />

      {/* Farm Scene */}
      <div className="flex-1 relative flex flex-col items-center justify-center px-5 py-2" style={{ minHeight: '45vh' }}>
        {/* Sun */}
        <div className="absolute top-2 right-8 w-[60px] h-[60px] rounded-full animate-sun-pulse"
          style={{ background: 'radial-gradient(circle, #ffe066 30%, #f0b429 60%, transparent 70%)' }} />

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
            <div className="flex gap-2 mt-2.5">
              {!activePlot.isDead && (
                <span className="px-3.5 py-1 rounded-[20px] text-[11px] font-bold flex items-center gap-1"
                  style={{ background: '#d4f8dc', color: '#1a7a30' }}>
                  ✅ Khỏe mạnh
                </span>
              )}
              {activePlot.isDead && (
                <span className="px-3.5 py-1 rounded-[20px] text-[11px] font-bold"
                  style={{ background: '#ffe8e6', color: '#c0392b' }}>
                  💀 Đã chết
                </span>
              )}
              {!activePlot.isDead && activePlot.happiness >= 50 && (
                <span className="px-3.5 py-1 rounded-[20px] text-[11px] font-bold flex items-center gap-1"
                  style={{ background: '#d4eeff', color: '#1a6a9a' }}>
                  💧 Đã tưới
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
          onClick={() => addToast('Tính năng sắp có!', 'info')}>
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
          <button onClick={() => setShowPlantModal(true)}
            className="w-full py-3.5 rounded-lg btn-green text-white font-heading font-bold text-base active:scale-[0.97] transition-transform">
            🌱 Trồng cây mới
          </button>
        </div>
      )}

      <BottomNav />
      <Toast />
      <PointsFlyUp />
      <PlantSeedModal open={showPlantModal} onClose={() => setShowPlantModal(false)} onSelect={handleSelectPlant} />
      <BugCatchGame open={showBugGame} onClose={() => setShowBugGame(false)} />
    </div>
  );
}
