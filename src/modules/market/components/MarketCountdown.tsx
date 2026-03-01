import React from 'react';
import { useCountdownTo18 } from '../hooks/useCountdownTo18';

export default function MarketCountdown() {
    const { h, m, s, pad, secs } = useCountdownTo18();
    const isUrgent = secs <= 3600;

    return (
        <div
            className="p-1 rounded-2xl"
            style={{
                background: '#5d4037',
                border: '3px solid #3e2723',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.1), 0 4px 0 #1a0f0a, 0 6px 12px rgba(0,0,0,0.35)',
            }}
        >
            <div className="bg-[#3e2723] rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' }}>
                <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-xl ${isUrgent ? 'text-red-400 animate-pulse' : 'text-[#e9c46a]'}`}>
                        schedule
                    </span>
                    <div>
                        <div className="text-[10px] text-[#bcaaa4] uppercase tracking-widest font-semibold">Công bố kết quả lúc</div>
                        <div className="text-[#e9c46a] text-xs font-bold">18:00 hằng ngày</div>
                    </div>
                </div>

                {/* Countdown digits */}
                <div className="flex items-center gap-1">
                    {[pad(h), pad(m), pad(s)].map((unit, i) => (
                        <span key={i} className="flex items-center gap-1">
                            <span
                                className={`w-9 text-center py-1 rounded-lg font-black text-lg tabular-nums
                  ${isUrgent ? 'bg-red-900/60 text-red-300' : 'bg-[#1a0f0a]/60 text-[#fefae0]'}`}
                            >
                                {unit}
                            </span>
                            {i < 2 && (
                                <span className={`font-black text-lg pb-0.5 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-[#e9c46a]'}`}>:</span>
                            )}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
