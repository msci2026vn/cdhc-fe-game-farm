import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmPlot } from '@/shared/hooks/useFarmPlots';

interface SlotData {
    index: number;
    plot: FarmPlot | null;
    unlocked: boolean;
}

interface Props {
    slotGrid: SlotData[];
    plots: FarmPlot[];
    activePlotIndex: number;
    plantSlotIndex: number;
    growthMap: Map<string, any>;
    handleSlotClick: (slotIndex: number, unlocked: boolean) => void;
    setActivePlotIndex: (index: number) => void;
}

export default function FarmPlotGrid({
    slotGrid, plots, activePlotIndex, plantSlotIndex, growthMap, handleSlotClick, setActivePlotIndex
}: Props) {
    const { t } = useTranslation();

    return (
        <div className="px-4 py-2 shrink-0 z-30">
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
                                <span className="text-[8px] font-black text-white/50 uppercase tracking-wider">{t('farming.plot.open_vip')}</span>
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
                                <span className="text-[9px] font-bold text-green-800 mt-0.5">{t('farming.plot.empty')}</span>
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
                                <span className="absolute bottom-1.5 text-[7px] text-white font-bold bg-red-500 px-1 rounded shadow-sm">{t('farming.plot.dead_short')}</span>
                            )}
                            {growth?.isReady && !slot.plot.isDead && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-yellow-400 border border-white rounded-full flex items-center justify-center text-[10px] animate-pulse">🌾</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
