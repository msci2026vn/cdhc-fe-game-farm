import React from 'react';
import { PredictResult, RatioData } from '../types/market.types';

interface Props {
    predicting: boolean;
    predictResult: PredictResult | null;
    ratio: RatioData | null;
    streak: number;
    onPredict: (direction: 'up' | 'down') => void;
    playSound: (soundId: string) => void;
}

export default function MarketPredictDock({ predicting, predictResult, ratio, streak, onPredict, playSound }: Props) {
    const buttonsDisabled = predicting || !!predictResult?.success || !!predictResult?.alreadyPredicted;

    return (
        <div className="relative z-20 bg-[#5d4037] rounded-t-2xl px-4 pt-4 pb-safe border-t-4 border-[#8c6239]"
            style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.3)' }}>

            <div className="flex items-center justify-center mb-4">
                <div className="bg-[#3e2723] px-4 py-1 rounded-full border border-[#8c6239]">
                    <span className="text-[#e9c46a] font-bold text-sm uppercase tracking-wider">Dự đoán xu hướng</span>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                {/* TĂNG */}
                <button
                    onClick={() => { playSound('ui_click'); onPredict('up'); }}
                    disabled={buttonsDisabled}
                    className={`flex-1 group relative h-20 rounded-xl border-b-4 shadow-lg overflow-hidden transition-all
            ${buttonsDisabled
                            ? 'bg-gray-400 border-gray-600 cursor-not-allowed opacity-60'
                            : 'bg-red-500 border-red-800 active:border-b-0 active:translate-y-1'}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    {!buttonsDisabled && (
                        <div className="absolute -top-10 -left-10 w-20 h-40 bg-white/20 rotate-12 group-hover:left-full transition-all duration-700" />
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                        {predicting
                            ? <span className="material-symbols-outlined text-white text-3xl animate-spin">progress_activity</span>
                            : <span className="material-symbols-outlined text-white text-3xl group-hover:scale-110 transition-transform">trending_up</span>
                        }
                        <span className="text-white font-black text-xl uppercase tracking-wider drop-shadow-md">Tăng</span>
                    </div>
                </button>

                {/* GIẢM */}
                <button
                    onClick={() => { playSound('ui_click'); onPredict('down'); }}
                    disabled={buttonsDisabled}
                    className={`flex-1 group relative h-20 rounded-xl border-b-4 shadow-lg overflow-hidden transition-all
            ${buttonsDisabled
                            ? 'bg-gray-400 border-gray-600 cursor-not-allowed opacity-60'
                            : 'bg-green-500 border-green-800 active:border-b-0 active:translate-y-1'}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    {!buttonsDisabled && (
                        <div className="absolute -top-10 -left-10 w-20 h-40 bg-white/20 rotate-12 group-hover:left-full transition-all duration-700" />
                    )}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                        {predicting
                            ? <span className="material-symbols-outlined text-white text-3xl animate-spin">progress_activity</span>
                            : <span className="material-symbols-outlined text-white text-3xl group-hover:scale-110 transition-transform">trending_down</span>
                        }
                        <span className="text-white font-black text-xl uppercase tracking-wider drop-shadow-md">Giảm</span>
                    </div>
                </button>
            </div>

            {/* Predict result */}
            {predictResult && (
                <div className={`mb-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-center border
          ${predictResult.success
                        ? 'bg-green-900/40 text-green-300 border-green-700'
                        : predictResult.alreadyPredicted
                            ? 'bg-blue-900/40 text-blue-300 border-blue-700'
                            : 'bg-red-900/40 text-red-300 border-red-700'
                    }`}
                >
                    {predictResult.message}
                </div>
            )}

            {/* Ratio bar */}
            {ratio && ratio.totalVotes > 0 && (
                <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] text-[#bcaaa4] mb-1 px-0.5">
                        <span>TĂNG {ratio.percentUp}%</span>
                        <span className="font-semibold text-[#e9c46a]">{ratio.totalVotes} người</span>
                        <span>GIẢM {ratio.percentDown}%</span>
                    </div>
                    <div className="flex rounded-full overflow-hidden h-3 border border-[#8c6239]/50">
                        <div
                            className="bg-red-500 transition-all duration-500"
                            style={{ width: `${ratio.percentUp}%` }}
                        />
                        <div
                            className="bg-green-500 transition-all duration-500"
                            style={{ width: `${ratio.percentDown}%` }}
                        />
                    </div>
                </div>
            )}

            {/* OGN info + streak */}
            <div className="bg-[#3e2723]/50 rounded-lg p-2 text-center border border-[#8c6239]/30">
                <p className="text-[#fefae0] text-sm font-medium">
                    Đúng: <span className="text-green-400 font-bold">+200 OGN</span>
                    <span className="mx-2 text-white/30">|</span>
                    Sai: <span className="text-red-400 font-bold">-150 OGN</span>
                </p>
                {streak > 0 && (
                    <p className="text-[#e9c46a] text-xs font-bold mt-1">
                        Chuỗi đúng: {streak} ngày liên tiếp
                    </p>
                )}
            </div>
        </div>
    );
}
