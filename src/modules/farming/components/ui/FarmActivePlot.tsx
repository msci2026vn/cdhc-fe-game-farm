import React from 'react';
import type { FarmPlot } from '@/shared/hooks/useFarmPlots';
import { calculateStage, getPlantSprite } from '../../utils/growth';

interface Props {
    activePlot: FarmPlot | null;
    growthMap: Map<string, any>;
    showWaterEffect: boolean;
    canWater: (plotId: string) => boolean;
    getCooldownRemaining: (plotId: string) => number;
    handleWater: () => void;
    handleHarvest: () => void;
    handleClear: () => void;
    handleEmptySlotClick: () => void;
    isWatering: boolean;
    isClearing: boolean;
}

const STAGE_LABELS: Record<string, string> = {
    seed: 'Giai đoạn 1/5', sprout: 'Giai đoạn 2/5', seedling: 'Giai đoạn 3/5', mature: 'Giai đoạn 4/5', dead: 'Đã chết',
};

export default function FarmActivePlot({
    activePlot, growthMap, showWaterEffect,
    canWater, getCooldownRemaining, handleWater, handleHarvest, handleClear, handleEmptySlotClick,
    isWatering, isClearing
}: Props) {

    if (!activePlot) {
        return (
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
        );
    }

    const activeGrowth = growthMap.get(activePlot.id);
    const growthPct = activeGrowth?.percent ?? 0;
    const stage = calculateStage(activePlot);
    const harvestReady = activeGrowth?.isReady ?? false;

    return (
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
            {harvestReady && !activePlot.isDead && (
                <div className="absolute top-16 z-30 pointer-events-none animate-bounce flex flex-col items-center">
                    <div className="bg-yellow-400 text-yellow-900 border-2 border-white px-4 py-1.5 rounded-full font-black text-sm shadow-lg flex items-center gap-1 drop-shadow-md">
                        <span className="text-lg">🌾</span> Thu hoạch ngay!
                    </div>
                </div>
            )}

            {/* Progress UI Card */}
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
            {showWaterEffect && (
                <div className="absolute inset-x-0 bottom-[120px] pointer-events-none z-40 flex items-center justify-center">
                    {[...Array(6)].map((_, i) => (
                        <span key={i} className="absolute animate-sparkle-up text-3xl" style={{ left: `${40 + Math.random() * 20}%`, top: `${-20 + Math.random() * 40}px`, animationDelay: `${i * 0.1}s` }}>💦</span>
                    ))}
                </div>
            )}

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

                {/* Contextual Floating Actions */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-[40%] -translate-y-[20%] w-full flex justify-center pointer-events-none">

                    {/* Water Action */}
                    {!harvestReady && !activePlot.isDead && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleWater(); }}
                            disabled={!canWater(activePlot.id) || isWatering}
                            className={`pointer-events-auto absolute -right-2 top-0 bg-[#039BE5] p-3 rounded-full shadow-lg border-[3px] border-white text-white z-40 transition-all ${(!canWater(activePlot.id) || isWatering) ? 'opacity-50 grayscale scale-95' : 'hover:scale-105 active:scale-95 shadow-[#039BE5]/50 animate-bounce'}`}
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
                            disabled={isClearing}
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
        </div>
    );
}
