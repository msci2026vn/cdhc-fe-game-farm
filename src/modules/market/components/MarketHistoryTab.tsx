import React from 'react';
import { HistoryStats, PredictionRow } from '../types/market.types';

interface Props {
    history: { predictions: PredictionRow[]; stats: HistoryStats } | null;
}

export default function MarketHistoryTab({ history }: Props) {
    if (!history) return null;

    return (
        <div className="space-y-3">
            {/* Stats overview */}
            {history.stats && (
                <div
                    className="p-1 rounded-2xl"
                    style={{
                        background: '#8c6239',
                        border: '3px solid #5d4037',
                        boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), 0 4px 0 #3e2723, 0 6px 12px rgba(0,0,0,0.3)',
                    }}
                >
                    <div className="bg-[#fefae0] rounded-xl p-4 border border-[#bcaaa4]"
                        style={{ boxShadow: 'inset 0 0 20px rgba(139,69,19,0.1)' }}>
                        <h3 className="text-center font-bold text-[#5d4037] border-b-2 border-dashed border-[#8c6239]/30 pb-2 mb-3 uppercase text-sm">
                            Thống kê của bạn
                        </h3>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
                                <div className="text-xl font-black text-green-600">{history.stats.won}</div>
                                <div className="text-[10px] font-bold text-green-700 uppercase">Đúng</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2 text-center border border-red-200">
                                <div className="text-xl font-black text-red-500">{history.stats.lost}</div>
                                <div className="text-[10px] font-bold text-red-700 uppercase">Sai</div>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-200">
                                <div className="text-xl font-black text-[#5d4037]">{history.stats.accuracy}%</div>
                                <div className="text-[10px] font-bold text-[#8c6239] uppercase">Chính xác</div>
                            </div>
                        </div>

                        <div className="flex justify-between text-xs text-[#5d4037] bg-white/60 rounded-lg p-2 border border-[#8c6239]/10">
                            <span className="font-semibold">Streak: <span className="text-orange-600">{history.stats.currentStreak}</span></span>
                            <span className="font-semibold">Kỷ lục: <span className="text-amber-600">{history.stats.bestStreak}</span></span>
                            <span className="font-semibold">Lời: <span className={history.stats.totalEarned - history.stats.totalPenalty >= 0 ? 'text-green-600' : 'text-red-500'}>
                                {history.stats.totalEarned - history.stats.totalPenalty >= 0 ? '+' : ''}{history.stats.totalEarned - history.stats.totalPenalty}
                            </span></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Prediction list */}
            <div
                className="p-1 rounded-2xl"
                style={{
                    background: '#8c6239',
                    border: '3px solid #5d4037',
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), 0 4px 0 #3e2723, 0 6px 12px rgba(0,0,0,0.3)',
                }}
            >
                <div className="bg-[#fefae0] rounded-xl p-4 border border-[#bcaaa4]"
                    style={{ boxShadow: 'inset 0 0 20px rgba(139,69,19,0.1)' }}>
                    <h3 className="text-center font-bold text-[#5d4037] border-b-2 border-dashed border-[#8c6239]/30 pb-2 mb-3 uppercase text-sm">
                        Lịch sử dự đoán
                    </h3>

                    <div className="space-y-2">
                        {history.predictions?.map((p) => (
                            <div key={p.id}
                                className={`flex items-center justify-between p-2.5 rounded-lg border ${p.status === 'won' ? 'bg-green-50 border-green-200' :
                                    p.status === 'lost' ? 'bg-red-50 border-red-200' :
                                        p.status === 'refund' ? 'bg-gray-50 border-gray-200' :
                                            'bg-yellow-50 border-yellow-200'
                                    }`}
                            >
                                <div>
                                    <div className="text-sm font-bold text-[#5d4037]">{p.targetDate}</div>
                                    <div className="text-xs text-gray-600">
                                        {p.direction === 'up' ? '🔺 TĂNG' : '🔻 GIẢM'}
                                        {p.actualDirection && (
                                            <span className="ml-1.5 text-gray-500">
                                                → {p.actualDirection === 'up' ? '📈' : p.actualDirection === 'down' ? '📉' : '➡️'} {p.actualChange}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {p.status === 'won' && (
                                        <span className="text-green-600 font-bold text-sm">+{p.reward} OGN</span>
                                    )}
                                    {p.status === 'lost' && (
                                        <span className="text-red-500 font-bold text-sm">-{p.penalty} OGN</span>
                                    )}
                                    {p.status === 'pending' && (
                                        <span className="text-yellow-600 font-semibold text-sm">Chờ...</span>
                                    )}
                                    {p.status === 'refund' && (
                                        <span className="text-gray-500 font-semibold text-sm">Hoàn</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {(!history.predictions || history.predictions.length === 0) && (
                            <div className="text-center py-6">
                                <div className="text-3xl mb-2">📋</div>
                                <p className="text-sm text-[#5d4037]/60 font-semibold">Chưa có dự đoán nào</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
