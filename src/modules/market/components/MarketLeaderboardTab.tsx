import React from 'react';
import { LeaderboardEntry } from '../types/market.types';

interface Props {
    leaderboard: LeaderboardEntry[];
}

export default function MarketLeaderboardTab({ leaderboard }: Props) {
    return (
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
                    Top dự đoán
                </h3>

                <div className="space-y-2">
                    {leaderboard.map((entry) => {
                        const rankColors = entry.rank === 1
                            ? 'bg-yellow-400 text-yellow-900 border-yellow-500'
                            : entry.rank === 2
                                ? 'bg-gray-300 text-gray-700 border-gray-400'
                                : entry.rank === 3
                                    ? 'bg-orange-300 text-orange-800 border-orange-400'
                                    : 'bg-[#f4e4bc] text-[#5d4037] border-[#8c6239]/30';

                        return (
                            <div key={entry.userId}
                                className="flex items-center gap-3 p-2.5 rounded-lg bg-white/60 border border-[#8c6239]/10">
                                {/* Rank badge */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border ${rankColors} shrink-0`}>
                                    {entry.rank}
                                </div>

                                {/* Avatar + Name */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {entry.avatar ? (
                                        <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full border border-[#8c6239]/20 shrink-0" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#8c6239]/20 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-[#5d4037] text-sm">person</span>
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="font-bold text-sm text-[#5d4037] truncate">{entry.username}</div>
                                        <div className="text-[10px] text-gray-500">
                                            {entry.totalCorrect}/{entry.totalPredictions} đúng ({entry.accuracy}%)
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="text-right shrink-0">
                                    <div className="text-sm font-bold text-green-600">+{entry.totalEarned}</div>
                                    {entry.bestStreak > 0 && (
                                        <div className="text-[10px] text-orange-600 font-bold">Best: {entry.bestStreak}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {leaderboard.length === 0 && (
                        <div className="text-center py-6">
                            <div className="text-3xl mb-2">🏆</div>
                            <p className="text-sm text-[#5d4037]/60 font-semibold">Chưa đủ dữ liệu</p>
                            <p className="text-xs text-gray-400 mt-1">Cần ít nhất 1 lượt dự đoán</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
