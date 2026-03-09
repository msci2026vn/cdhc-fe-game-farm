import { useState, useCallback } from 'react';
import { usePlantSeed } from '@/shared/hooks/usePlantSeed';
import { useWaterPlot } from '@/shared/hooks/useWaterPlot';
import { useHarvestPlot } from '@/shared/hooks/useHarvestPlot';
import { useClearPlot } from '@/shared/hooks/useClearPlot';
import { useUIStore } from '@/shared/stores/uiStore';
import { handleGameError, showPlantSuccess, showWaterSuccess, showLevelUp, formatCooldown } from '@/shared/utils/error-handler';
import { playSound } from '@/shared/audio';
import type { FarmPlot } from '@/shared/hooks/useFarmPlots';
import { PlantType } from '../types/farm.types';

export function useFarmingActions(
    plots: FarmPlot[],
    activePlotIndex: number,
    growthMap: Map<string, any>,
    setActivePlotIndex: (index: number) => void,
    startCooldown: (seconds: number) => void
) {
    const plantMutation = usePlantSeed();
    const waterMutation = useWaterPlot();
    const harvestMutation = useHarvestPlot();
    const clearMutation = useClearPlot();

    const addToast = useUIStore((s) => s.addToast);
    const showFlyUp = useUIStore((s) => s.showFlyUp);

    const [waterCooldowns, setWaterCooldowns] = useState<Record<string, number>>({});
    const [harvestResult, setHarvestResult] = useState<{
        plantEmoji: string;
        plantName: string;
        ognEarned: number;
        xp: number;
        leveledUp: boolean;
    } | null>(null);

    const canWater = useCallback((plotId: string) => {
        const cooldownEnd = waterCooldowns[plotId];
        return !cooldownEnd || Date.now() >= cooldownEnd;
    }, [waterCooldowns]);

    const getCooldownRemaining = useCallback((plotId: string) => {
        const cooldownEnd = waterCooldowns[plotId];
        if (!cooldownEnd || Date.now() >= cooldownEnd) return 0;
        return Math.ceil((cooldownEnd - Date.now()) / 1000);
    }, [waterCooldowns]);

    const handleWater = useCallback(() => {
        const currentPlot = plots[activePlotIndex];
        if (!currentPlot || currentPlot.isDead) return;

        const cooldownEnd = waterCooldowns[currentPlot.id];
        if (cooldownEnd && Date.now() < cooldownEnd) {
            const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
            addToast(`Đang chờ tưới! Còn ${remaining} giây ⏳`, 'info');
            return;
        }

        waterMutation.mutate(currentPlot.id, {
            onSuccess: (data) => {
                playSound('water_plant');
                const endTime = Date.now() + ((data.cooldownSeconds || 3600) * 1000);
                setWaterCooldowns(prev => ({ ...prev, [currentPlot.id]: endTime }));
                showFlyUp('+10 💚');
                showWaterSuccess(data.message || 'Cây vui hơn rồi! 💧');
                startCooldown(data.cooldownSeconds || 3600);
            },
            onError: (error: any) => {
                if (error.cooldownRemaining) {
                    const endTime = Date.now() + (error.cooldownRemaining * 1000);
                    setWaterCooldowns(prev => ({ ...prev, [currentPlot.id]: endTime }));
                    addToast(`⏳ Còn ${formatCooldown(error.cooldownRemaining)}`, 'info');
                } else {
                    handleGameError(error, 'water');
                }
            },
        });
    }, [waterCooldowns, waterMutation, showFlyUp, addToast, startCooldown, activePlotIndex, plots]);

    const handleHarvest = useCallback(() => {
        const currentPlot = plots[activePlotIndex];
        if (!currentPlot) return;

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

    const handleClear = useCallback(() => {
        const currentPlot = plots[activePlotIndex];
        if (!currentPlot || !currentPlot.isDead) return;

        clearMutation.mutate(currentPlot.id, {
            onSuccess: (data) => {
                addToast(`Đã dọn cây héo ở ô ${data.slotIndex + 1}! 🧹`, 'success');
            },
            onError: (error) => {
                handleGameError(error, 'clear');
            },
        });
    }, [clearMutation, addToast, activePlotIndex, plots]);

    const handleSelectPlantFromPicker = useCallback((plantSlotIndex: number, plantTypeId: string, setShowPlantPicker: (v: boolean) => void) => {
        plantMutation.mutate(
            { slotIndex: plantSlotIndex, plantTypeId },
            {
                onSuccess: (data) => {
                    playSound('plant_seed');
                    setShowPlantPicker(false);
                    showPlantSuccess(
                        data.plantType?.name || 'Cây',
                        data.plantType?.emoji || '🌱'
                    );

                    if (data.plot) {
                        const newIndex = plots.findIndex((p) => p.slotIndex === data.plot.slotIndex);
                        setActivePlotIndex(newIndex >= 0 ? newIndex : plots.length);
                    }
                },
                onError: (error) => {
                    handleGameError(error, 'plant');
                },
            }
        );
    }, [plantMutation, plots, setActivePlotIndex]);

    return {
        handleWater,
        canWater,
        getCooldownRemaining,
        handleHarvest,
        handleClear,
        handleSelectPlantFromPicker,
        harvestResult,
        setHarvestResult,
        isPlanting: plantMutation.isPending,
        isWatering: waterMutation.isPending,
        isClearing: clearMutation.isPending,
        waterCooldowns,
    };
}
