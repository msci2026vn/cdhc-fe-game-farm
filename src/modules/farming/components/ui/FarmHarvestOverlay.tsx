import React from 'react';

interface Props {
    harvestResult: {
        plantEmoji: string;
        plantName: string;
        ognEarned: number;
        xp: number;
        leveledUp: boolean;
    } | null;
    onClose: () => void;
}

export default function FarmHarvestOverlay({ harvestResult, onClose }: Props) {
    if (!harvestResult) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
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
    );
}
