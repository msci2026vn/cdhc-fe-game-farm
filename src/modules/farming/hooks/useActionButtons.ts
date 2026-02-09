import { useState, useCallback } from 'react';
import { FarmPlot } from '../types/farm.types';
import { useFarmStore } from '../stores/farmStore';
import { isHarvestReady } from '../utils/growth';
import { useUIStore } from '@/shared/stores/uiStore';
import { formatTime } from '@/shared/utils/format';
import { useCooldown } from '@/shared/hooks/useCooldown';

interface ActionButtonsProps {
  plot: FarmPlot;
  onPlantNew: () => void;
}

export default function ActionButtons({ plot, onPlantNew }: ActionButtonsProps) {
  const waterPlot = useFarmStore((s) => s.waterPlot);
  const harvestPlot = useFarmStore((s) => s.harvestPlot);
  const getCooldown = useFarmStore((s) => s.getWaterCooldownRemaining);
  const addToast = useUIStore((s) => s.addToast);
  const showFlyUp = useUIStore((s) => s.showFlyUp);
  const [showWater, setShowWater] = useState(false);

  const cooldownSeconds = getCooldown(plot.id);
  const { remaining, isActive, start } = useCooldown(cooldownSeconds);

  const harvestReady = isHarvestReady(plot);

  const handleWater = useCallback(() => {
    if (plot.isDead) {
      addToast('Cây đã chết, không thể tưới 😢', 'error');
      return;
    }
    const success = waterPlot(plot.id);
    if (success) {
      setShowWater(true);
      setTimeout(() => setShowWater(false), 1200);
      showFlyUp('+15 💚');
      addToast('Tưới thành công! Cây vui hơn rồi 🌱', 'success');
      start(15); // 15s demo cooldown
    } else {
      addToast(`Đang hồi chiêu, chờ thêm nhé ⏳`, 'info');
    }
  }, [plot, waterPlot, addToast, showFlyUp, start]);

  const handleHarvest = useCallback(() => {
    if (!harvestReady) {
      addToast('Cây chưa trưởng thành, chờ thêm nhé!', 'info');
      return;
    }
    const reward = harvestPlot(plot.id);
    showFlyUp(`+${reward} OGN 🪙`);
    addToast(`Thu hoạch thành công! +${reward} OGN 🎉`, 'success');
    setTimeout(() => onPlantNew(), 500);
  }, [harvestReady, harvestPlot, plot.id, showFlyUp, addToast, onPlantNew]);

  const buttons = [
    {
      emoji: '💧',
      label: isActive ? formatTime(remaining) : 'Tưới',
      color: 'bg-farm-blue/10 text-farm-blue border-farm-blue/20',
      disabled: isActive || plot.isDead,
      onClick: handleWater,
    },
    {
      emoji: '🧴',
      label: 'Bón phân',
      color: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
      disabled: plot.isDead,
      onClick: () => addToast('Tính năng bón phân sắp có!', 'info'),
    },
    {
      emoji: '🌾',
      label: 'Thu hoạch',
      color: harvestReady
        ? 'bg-primary text-primary-foreground border-primary animate-pulse-glow'
        : 'bg-primary/10 text-primary border-primary/20',
      disabled: !harvestReady || plot.isDead,
      onClick: handleHarvest,
    },
    {
      emoji: '🎯',
      label: 'Quiz',
      color: 'bg-farm-red/10 text-farm-red border-farm-red/20',
      disabled: false,
      onClick: () => addToast('Quiz sắp có trong bản tiếp theo!', 'info'),
    },
  ];

  return { buttons, showWater };
}
