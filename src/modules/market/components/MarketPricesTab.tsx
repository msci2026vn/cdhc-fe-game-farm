import React from 'react';
import { CommodityPrice } from '../types/market.types';
import { COMMODITY_ICON, COMMODITY_VI, DEFAULT_ICON } from '../constants';

interface Props {
    prices: CommodityPrice[];
}

export default function MarketPricesTab({ prices }: Props) {
    return (
        <div
            className="p-1 rounded-2xl relative"
            style={{
                background: '#8c6239',
                border: '3px solid #5d4037',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), 0 4px 0 #3e2723, 0 6px 12px rgba(0,0,0,0.3)',
            }}
        >
            <div className="absolute -top-3 -right-2 rotate-12 z-20">
                <span className="material-symbols-outlined text-green-700 text-3xl drop-shadow-sm">eco</span>
            </div>

            <div className="bg-[#fefae0] rounded-xl p-4 border border-[#bcaaa4]"
                style={{ boxShadow: 'inset 0 0 20px rgba(139,69,19,0.1)' }}>
                <h3 className="text-center font-bold text-[#5d4037] border-b-2 border-dashed border-[#8c6239]/30 pb-1 mb-1 uppercase text-sm">
                    Bảng giá hôm nay
                </h3>
                <p className="text-center text-[10px] text-[#5d4037]/50 mb-3">Giá nông sản thế giới — cập nhật hàng ngày</p>

                <div className="space-y-3">
                    {prices.map(p => {
                        const change = p.percentChange ?? 0;
                        const positive = change >= 0;
                        const ic = COMMODITY_ICON[p.id] || DEFAULT_ICON;
                        const vi = COMMODITY_VI[p.id];
                        const displayName = p.nameVi || vi?.name || p.name || p.id;
                        const displaySubname = vi?.subname || p.id;
                        return (
                            <div key={p.id}
                                className="flex items-center justify-between bg-white/60 p-2 rounded-lg border border-[#8c6239]/10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${ic.bg} ${ic.border}`}>
                                        <span className={`material-symbols-outlined ${ic.text}`}>{ic.icon}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[#5d4037]">{displayName}</span>
                                        <span className="text-xs text-gray-500">{displaySubname}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="font-bold text-[#5d4037]">{(typeof p.price === 'number' ? p.price : parseFloat(String(p.price))).toFixed(2)}</span>
                                    <span className={`text-xs font-bold ${positive ? 'text-green-600' : 'text-red-500'}`}>
                                        {positive ? '+' : ''}{change.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-3 text-center text-[10px] text-gray-500 italic">
                    Đơn vị: cents/đơn vị hàng hóa
                </div>
            </div>
        </div>
    );
}
