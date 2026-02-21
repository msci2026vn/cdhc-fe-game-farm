import { usePrayerLeaderboard } from '../hooks/usePrayerLeaderboard';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';

export interface PrayerLeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PrayerLeaderboardModal({ isOpen, onClose }: PrayerLeaderboardModalProps) {
    const { data: leaderboard, isLoading } = usePrayerLeaderboard(50);
    const { data: profile } = usePlayerProfile();

    if (!isOpen) return null;

    const top3 = leaderboard?.slice(0, 3) || [];
    const rest = leaderboard?.slice(3) || [];

    // Find current user in the leaderboard if present
    const currentUserRank = leaderboard?.find(entry => entry.userId === profile?.id);

    return (
        <div className="fixed inset-0 z-50 max-w-md mx-auto h-[100dvh] flex flex-col bg-spiritual shadow-2xl overflow-hidden animate-slide-up">
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/floral-linen.png')]"></div>
                <span className="material-symbols-outlined absolute top-10 left-[-20px] text-green-200 text-9xl rotate-45">eco</span>
                <span className="material-symbols-outlined absolute bottom-20 right-[-20px] text-green-200 text-9xl -rotate-12">local_florist</span>
                <span className="material-symbols-outlined absolute top-1/3 right-10 text-yellow-100 text-8xl opacity-50">wb_sunny</span>
            </div>

            <div className="relative z-30 px-4 pt-12 pb-2 flex items-center justify-between safe-top">
                <button
                    onClick={onClose}
                    className="w-10 h-10 bg-farm-straw rounded-full border-2 border-farm-brown-dark shadow-wood-shadow flex items-center justify-center active:translate-y-1 active:shadow-none transition-all"
                >
                    <span className="material-symbols-outlined text-farm-brown-dark font-bold">arrow_back</span>
                </button>
                <div className="flex-1 text-center mx-2">
                    <div className="bg-[#5d4037] py-1 px-4 rounded-xl border-2 border-[#8c6239] shadow-lg inline-block relative">
                        <span className="text-farm-straw font-display font-bold text-lg uppercase tracking-wider drop-shadow-md">Bảng Vàng Nhân Ái</span>
                        <div className="absolute -top-3 -right-3">
                            <span className="material-symbols-outlined text-yellow-400 text-2xl drop-shadow-md animate-pulse">spa</span>
                        </div>
                        <div className="absolute -bottom-3 -left-3 rotate-180">
                            <span className="material-symbols-outlined text-green-400 text-2xl drop-shadow-md">eco</span>
                        </div>
                    </div>
                </div>
                <button className="w-10 h-10 bg-farm-straw rounded-full border-2 border-farm-brown-dark shadow-wood-shadow flex items-center justify-center active:translate-y-1 active:shadow-none transition-all">
                    <span className="material-symbols-outlined text-farm-brown-dark font-bold">help</span>
                </button>
            </div>

            <div className="relative z-20 px-6 py-2">
                <div className="flex justify-between bg-[#fdf6e3]/50 p-1.5 rounded-full border-2 border-[#8c6239] backdrop-blur-sm shadow-md">
                    <button className="flex-1 py-1.5 rounded-full text-xs font-bold font-display uppercase tracking-wide tab-active transition-all">Bảng</button>
                    <button className="flex-1 py-1.5 rounded-full text-xs font-bold font-display uppercase tracking-wide text-farm-brown-dark hover:bg-[#e9c46a]/50 opacity-50 cursor-not-allowed transition-all">Tháng</button>
                    <button className="flex-1 py-1.5 rounded-full text-xs font-bold font-display uppercase tracking-wide text-farm-brown-dark hover:bg-[#e9c46a]/50 opacity-50 cursor-not-allowed transition-all">Mùa</button>
                </div>
            </div>

            <div className="flex-1 relative z-10 px-4 pb-24 overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-farm-brown-dark font-display font-bold text-lg animate-pulse">Đang tải bảng vàng...</div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-end justify-center mb-6 pt-4 h-48 relative">
                            {/* Top 2 */}
                            {top3[1] && (
                                <div className="flex flex-col items-center -mr-4 z-10 mb-2 transform translate-y-2">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-gray-300 overflow-hidden shadow-lg relative z-10 bg-gray-200">
                                            {top3[1].userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -top-4 -left-2 z-20">
                                            <span className="material-symbols-outlined text-gray-400 text-4xl drop-shadow-md">workspace_premium</span>
                                        </div>
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold border border-gray-300 z-20 whitespace-nowrap">Hạt Giống Nhỏ</div>
                                    </div>
                                    <div className="w-20 h-24 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg border-x-2 border-t-2 border-gray-500 shadow-lg flex flex-col items-center justify-start pt-2 relative">
                                        <span className="text-3xl font-display font-bold text-white text-outline-light">2</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="material-symbols-outlined text-white text-xs">favorite</span>
                                            <span className="text-xs font-bold text-white">{top3[1].totalPrayers}</span>
                                        </div>
                                        <div className="absolute bottom-2 w-full flex justify-center opacity-30">
                                            <span className="material-symbols-outlined text-white">grass</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Top 1 */}
                            {top3[0] && (
                                <div className="flex flex-col items-center z-20 mb-2">
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-yellow-400 rounded-full blur opacity-75 animate-pulse"></div>
                                        <div className="w-20 h-20 rounded-full border-4 border-yellow-400 overflow-hidden shadow-xl relative z-10 bg-yellow-100 flex items-center justify-center font-bold text-2xl text-yellow-600">
                                            {top3[0].userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -top-6 -right-4 z-20">
                                            <span className="material-symbols-outlined text-yellow-500 text-5xl drop-shadow-lg rotate-12">crown</span>
                                        </div>
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-600 text-white text-xs px-3 py-0.5 rounded-full font-bold border border-yellow-300 z-20 whitespace-nowrap shadow-md">Mẹ Thiên Nhiên</div>
                                    </div>
                                    <div className="w-24 h-32 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-t-xl border-x-2 border-t-2 border-yellow-600 shadow-xl flex flex-col items-center justify-start pt-3 relative">
                                        <span className="text-5xl font-display font-bold text-white text-outline-light">1</span>
                                        <div className="flex items-center gap-1 mt-2 bg-yellow-600/30 px-2 py-0.5 rounded-full">
                                            <span className="material-symbols-outlined text-white text-sm fill-current">favorite</span>
                                            <span className="text-sm font-bold text-white">{top3[0].totalPrayers}</span>
                                        </div>
                                        <div className="absolute bottom-2 w-full flex justify-center text-yellow-700/30">
                                            <span className="material-symbols-outlined text-2xl">potted_plant</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Top 3 */}
                            {top3[2] && (
                                <div className="flex flex-col items-center -ml-4 z-10 mb-2 transform translate-y-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-orange-700 overflow-hidden shadow-lg relative z-10 bg-orange-100 flex items-center justify-center font-bold text-xl text-orange-600">
                                            {top3[2].userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -top-4 -right-2 z-20">
                                            <span className="material-symbols-outlined text-orange-800 text-4xl drop-shadow-md">workspace_premium</span>
                                        </div>
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#8b4513] text-white text-[10px] px-2 py-0.5 rounded-full font-bold border border-[#cd7f32] z-20 whitespace-nowrap">Bác Nông Dân</div>
                                    </div>
                                    <div className="w-20 h-20 bg-gradient-to-b from-[#cd7f32] to-[#a0522d] rounded-t-lg border-x-2 border-t-2 border-[#8b4513] shadow-lg flex flex-col items-center justify-start pt-2 relative">
                                        <span className="text-3xl font-display font-bold text-white text-outline-light">3</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="material-symbols-outlined text-white text-xs">favorite</span>
                                            <span className="text-xs font-bold text-white">{top3[2].totalPrayers}</span>
                                        </div>
                                        <div className="absolute bottom-2 w-full flex justify-center opacity-30">
                                            <span className="material-symbols-outlined text-white">forest</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 bg-[#fffdf5] rounded-t-3xl border-t-4 border-[#8c6239] shadow-[0_-5px_15px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 left-0 h-full w-4 bg-[url('https://www.transparenttextures.com/patterns/floral-linen.png')] opacity-50 z-0"></div>
                            <div className="absolute top-0 right-0 h-full w-4 bg-[url('https://www.transparenttextures.com/patterns/floral-linen.png')] opacity-50 z-0"></div>

                            <div className="h-full overflow-y-auto custom-scrollbar px-3 pt-4 pb-20 relative z-10 space-y-3">
                                {/* Current User Logged In highlight (if applicable) */}
                                {currentUserRank && currentUserRank.rank > 3 && (
                                    <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-xl p-3 flex items-center shadow-md border-2 border-green-500 transform scale-[1.02] sticky top-0 z-20 mb-3">
                                        <div className="w-8 flex justify-center text-farm-brown-dark font-display font-bold text-lg">{currentUserRank.rank}</div>
                                        <div className="relative mx-3">
                                            <div className="w-12 h-12 rounded-full border-2 border-green-600 overflow-hidden bg-green-200 flex items-center justify-center font-bold text-sm text-green-700">
                                                {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border border-white">
                                                <span className="material-symbols-outlined text-white text-xs">person</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-green-800 font-bold text-sm">Tôi ({profile?.name})</div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-green-200 shadow-sm">
                                            <span className="material-symbols-outlined text-pink-500 text-sm">favorite</span>
                                            <span className="text-green-800 font-bold text-sm">{currentUserRank.totalPrayers}</span>
                                        </div>
                                    </div>
                                )}

                                {rest.map((entry) => {
                                    const isCurrent = entry.userId === profile?.id;
                                    if (isCurrent) return null; // Already rendered sticky above

                                    return (
                                        <div key={entry.userId} className="bg-white rounded-xl p-3 flex items-center shadow-sm border border-[#e9c46a]">
                                            <div className="w-8 flex justify-center text-farm-brown font-display font-bold text-lg">{entry.rank}</div>
                                            <div className="relative mx-3">
                                                <div className="w-10 h-10 rounded-full border-2 border-farm-brown-dark/30 overflow-hidden bg-orange-50 flex items-center justify-center font-bold text-sm text-farm-brown">
                                                    {entry.userName.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-farm-brown-dark font-bold text-sm">{entry.userName}</div>
                                                {entry.currentStreak > 0 && <div className="text-[10px] text-orange-500 font-bold">Chuỗi: {entry.currentStreak} ngày</div>}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-pink-400 text-sm">favorite</span>
                                                <span className="text-farm-brown font-bold text-sm">{entry.totalPrayers}</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="flex justify-center pt-4 opacity-60">
                                    <span className="material-symbols-outlined text-green-700 text-4xl">cruelty_free</span>
                                </div>
                                <div className="text-center text-[10px] text-farm-brown-dark/60 italic pb-4">
                                    "Mỗi lời cầu nguyện là một hạt giống thiện lành."
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="absolute bottom-0 w-full h-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-[#8c6239] border-t-4 border-[#5d4037] z-40 px-6 rounded-t-3xl shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
                <div className="flex justify-between items-center h-full pb-2">
                    <button onClick={onClose} className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[#fefae0] text-2xl">home</span>
                        <span className="text-[9px] font-bold text-[#fefae0] uppercase">Trở Lại</span>
                    </button>

                    <button onClick={onClose} className="flex flex-col items-center gap-1 transform -translate-y-4">
                        <div className="w-14 h-14 bg-farm-green-light rounded-full border-4 border-[#fefae0] flex items-center justify-center shadow-lg relative z-10">
                            <span className="material-symbols-outlined text-white text-3xl animate-pulse">volunteer_activism</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#fefae0] uppercase mt-1 bg-[#5d4037] px-2 rounded-full">Cầu Nguyện</span>
                    </button>

                    <button className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[#fefae0] text-2xl">emoji_events</span>
                        <span className="text-[9px] font-bold text-[#fefae0] uppercase">Phần Thưởng</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
