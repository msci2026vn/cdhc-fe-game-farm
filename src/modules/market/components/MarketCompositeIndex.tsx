import React from 'react';
import { MarketIndex } from '../types/market.types';

interface Props {
    index: MarketIndex;
    onShowGuide: () => void;
    playSound: (soundId: string) => void;
}

export default function MarketCompositeIndex({ index, onShowGuide, playSound }: Props) {
    const isUp = index.direction === 'up';

    return (
        <div
            className="p-1 rounded-2xl"
            style={{
                background: '#8c6239',
                border: '3px solid #5d4037',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), 0 4px 0 #3e2723, 0 6px 12px rgba(0,0,0,0.3)',
            }}
        >
            <div className="bg-[#fefae0] rounded-xl p-3 border border-[#bcaaa4] flex flex-col items-center"
                style={{ boxShadow: 'inset 0 0 20px rgba(139,69,19,0.1)' }}>
                <span className="text-[10px] font-bold text-[#5d4037]/70 uppercase tracking-wider mb-1">
                    Xu hướng giá nông sản thế giới
                </span>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-[#5d4037]">
                        {typeof index.value === 'number' ? index.value.toFixed(2) : index.value}
                    </span>
                    <div className={`flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-lg mb-1 ${isUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        <span className="material-symbols-outlined text-base">{isUp ? 'trending_up' : 'trending_down'}</span>
                        <span className="text-sm">
                            {isUp ? 'Tăng' : 'Giảm'} {Math.abs(index.percentChange).toFixed(2)}%
                        </span>
                    </div>
                </div>
                <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(index.percentChange) * 10 + 30, 90)}%` }}
                    />
                </div>
                <p className="text-[10px] text-[#5d4037]/60 mt-2 text-center leading-relaxed">
                    {(index as any).description || (isUp
                        ? `Giá nông sản thế giới hôm nay TĂNG so với hôm qua`
                        : `Giá nông sản thế giới hôm nay GIẢM so với hôm qua`
                    )}
                </p>
                <button
                    onClick={() => { playSound('ui_modal_open'); onShowGuide(); }}
                    className="mt-1.5 text-[11px] text-[#8c6239] font-semibold underline underline-offset-2 active:opacity-60"
                >
                    Hướng dẫn đọc chỉ số
                </button>
            </div>
        </div>
    );
}
