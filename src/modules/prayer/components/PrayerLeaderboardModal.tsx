import { usePrayerLeaderboard } from '../hooks/usePrayerLeaderboard';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';

export interface PrayerLeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function Avatar({
    picture, gmailAvatar, avatarUrl, name, gmailName, size = 'md', className = '',
}: {
    picture?: string | null;
    gmailAvatar?: string | null;
    avatarUrl?: string | null;
    name?: string | null;
    gmailName?: string | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const src = gmailAvatar || picture || avatarUrl || null;
    const displayName = gmailName || name || '?';
    const initials = displayName.charAt(0).toUpperCase();
    const sizeClass = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'md' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-sm';

    if (src) {
        return (
            <img
                src={src}
                alt={displayName}
                className={`${sizeClass} rounded-full object-cover ${className}`}
                onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.display = 'none';
                    const fallback = el.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = 'flex';
                }}
            />
        );
    }
    return (
        <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold bg-gradient-to-br from-green-400 to-green-600 text-white ${className}`}>
            {initials}
        </div>
    );
}

export function PrayerLeaderboardModal({ isOpen, onClose }: PrayerLeaderboardModalProps) {
    const { data: leaderboard, isLoading } = usePrayerLeaderboard(50);
    const { data: profile } = usePlayerProfile();

    if (!isOpen) return null;

    const top3 = leaderboard?.slice(0, 3) || [];
    const rest = leaderboard?.slice(3) || [];

    // Fix: dùng profile?.userId (không phải profile?.id)
    const currentUserRank = leaderboard?.find(entry => entry.userId === profile?.userId);

    const TOP3_CONFIG = [
        {
            title: 'Tấm Lòng Vàng',
            borderColor: 'border-gray-300',
            bgGrad: 'from-gray-300 to-gray-400',
            barH: 'h-24',
            barBorder: 'border-gray-500',
            iconColor: 'text-gray-400',
            numSize: 'text-3xl',
            avatarSize: 'sm' as const,
            avatarBorder: 'border-gray-300',
            titleBg: 'bg-gray-600',
            titleBorder: 'border-gray-300',
            wrapperClass: 'z-10 translate-y-2',
        },
        {
            title: 'Đại Sứ Nhân Ái',
            borderColor: 'border-yellow-400',
            bgGrad: 'from-yellow-300 to-yellow-500',
            barH: 'h-32',
            barBorder: 'border-yellow-600',
            iconColor: 'text-yellow-500',
            numSize: 'text-5xl',
            avatarSize: 'lg' as const,
            avatarBorder: 'border-yellow-400',
            titleBg: 'bg-yellow-600',
            titleBorder: 'border-yellow-300',
            wrapperClass: 'z-20',
        },
        {
            title: 'Người Gieo Hạt',
            borderColor: 'border-orange-700',
            bgGrad: 'from-[#cd7f32] to-[#a0522d]',
            barH: 'h-20',
            barBorder: 'border-[#8b4513]',
            iconColor: 'text-orange-800',
            numSize: 'text-3xl',
            avatarSize: 'sm' as const,
            avatarBorder: 'border-orange-700',
            titleBg: 'bg-[#8b4513]',
            titleBorder: 'border-[#cd7f32]',
            wrapperClass: 'z-10 translate-y-4',
        },
    ];

    // Podium order: 2nd, 1st, 3rd
    const podiumOrder = [1, 0, 2];

    return (
        <div className="fixed inset-0 z-50 max-w-md mx-auto h-[100dvh] flex flex-col bg-spiritual shadow-2xl overflow-hidden animate-slide-up">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/floral-linen.png')]" />
                <span className="material-symbols-outlined absolute top-10 left-[-20px] text-green-200 text-9xl rotate-45">eco</span>
                <span className="material-symbols-outlined absolute bottom-20 right-[-20px] text-green-200 text-9xl -rotate-12">local_florist</span>
                <span className="material-symbols-outlined absolute top-1/3 right-10 text-yellow-100 text-8xl opacity-50">wb_sunny</span>
            </div>

            {/* Header */}
            <div className="relative z-30 px-4 pt-12 pb-2 flex items-center justify-between safe-top">
                <button
                    onClick={onClose}
                    className="w-10 h-10 bg-farm-straw rounded-full border-2 border-farm-brown-dark shadow-wood-shadow flex items-center justify-center active:translate-y-1 active:shadow-none transition-all"
                >
                    <span className="material-symbols-outlined text-farm-brown-dark font-bold">arrow_back</span>
                </button>
                <div className="flex-1 text-center mx-2">
                    <div className="bg-[#5d4037] py-1.5 px-5 rounded-xl border-2 border-[#8c6239] shadow-lg inline-block relative">
                        <span className="text-farm-straw font-display font-bold text-lg uppercase tracking-wider drop-shadow-md">Bảng Vàng Nhân Ái</span>
                        <div className="absolute -top-3 -right-3">
                            <span className="material-symbols-outlined text-yellow-400 text-2xl drop-shadow-md animate-pulse">spa</span>
                        </div>
                        <div className="absolute -bottom-3 -left-3 rotate-180">
                            <span className="material-symbols-outlined text-green-400 text-2xl drop-shadow-md">eco</span>
                        </div>
                    </div>
                </div>
                <div className="w-10 h-10" /> {/* spacer */}
            </div>

            {/* Tabs */}
            <div className="relative z-20 px-6 py-2">
                <div className="flex justify-between bg-[#fdf6e3]/50 p-1.5 rounded-full border-2 border-[#8c6239] backdrop-blur-sm shadow-md">
                    <button className="flex-1 py-1.5 rounded-full text-xs font-bold font-display uppercase tracking-wide tab-active transition-all">Tuần</button>
                    <button className="flex-1 py-1.5 rounded-full text-xs font-bold font-display uppercase tracking-wide text-farm-brown-dark opacity-40 cursor-not-allowed">Tháng</button>
                    <button className="flex-1 py-1.5 rounded-full text-xs font-bold font-display uppercase tracking-wide text-farm-brown-dark opacity-40 cursor-not-allowed">Mùa</button>
                </div>
            </div>

            <div className="flex-1 relative z-10 px-4 pb-24 overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <span className="material-symbols-outlined text-green-600 text-5xl animate-pulse">volunteer_activism</span>
                        <div className="text-farm-brown-dark font-display font-bold text-base">Đang tải bảng vàng...</div>
                    </div>
                ) : (
                    <>
                        {/* Podium top 3 */}
                        <div className="flex items-end justify-center mb-4 pt-6 shrink-0">
                            {podiumOrder.map((dataIdx, colIdx) => {
                                const entry = top3[dataIdx];
                                const cfg = TOP3_CONFIG[dataIdx];
                                const isMe = entry?.userId === profile?.userId;
                                const offsetClass = colIdx === 0 ? '-mr-3' : colIdx === 2 ? '-ml-3' : '';

                                if (!entry) return <div key={colIdx} className="w-20" />;

                                return (
                                    <div key={entry.userId} className={`flex flex-col items-center ${cfg.wrapperClass} ${offsetClass}`}>
                                        {/* Avatar area */}
                                        <div className="relative mb-6">
                                            {isMe && (
                                                <div className="absolute -inset-2 rounded-full bg-green-400/30 animate-pulse" />
                                            )}
                                            {dataIdx === 0 && (
                                                <div className="absolute -inset-1 bg-yellow-400 rounded-full blur opacity-60 animate-pulse" />
                                            )}
                                            <div className={`rounded-full border-4 ${cfg.borderColor} overflow-hidden shadow-xl relative z-10 flex items-center justify-center ${cfg.avatarSize === 'lg' ? 'w-20 h-20' : 'w-14 h-14'}`}>
                                                <Avatar
                                                    picture={entry.picture}
                                                    gmailAvatar={entry.gmailAvatar}
                                                    avatarUrl={entry.avatarUrl}
                                                    name={entry.userName}
                                                    gmailName={entry.gmailName}
                                                    size={cfg.avatarSize}
                                                />
                                            </div>
                                            {/* Crown / medal icon */}
                                            <div className={`absolute ${dataIdx === 0 ? '-top-7 -right-4 z-20' : '-top-5 -right-3 z-20'}`}>
                                                <span className={`material-symbols-outlined ${cfg.iconColor} ${dataIdx === 0 ? 'text-5xl rotate-12 drop-shadow-lg' : 'text-4xl drop-shadow-md'}`}>
                                                    {dataIdx === 0 ? 'crown' : 'workspace_premium'}
                                                </span>
                                            </div>
                                            {/* Title badge */}
                                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${cfg.titleBg} text-white px-2 py-0.5 rounded-full font-bold border ${cfg.titleBorder} z-20 whitespace-nowrap shadow-md`}
                                                style={{ fontSize: 9 }}>
                                                {cfg.title}
                                            </div>
                                            {/* Me badge */}
                                            {isMe && (
                                                <div className="absolute -top-1 -left-2 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full z-30 border border-white shadow">
                                                    Bạn
                                                </div>
                                            )}
                                        </div>

                                        {/* Name */}
                                        <p className={`text-[10px] font-bold font-display truncate max-w-[72px] text-center mb-1 ${isMe ? 'text-green-700' : 'text-farm-brown-dark'}`}>
                                            {entry.gmailName || entry.userName}
                                        </p>

                                        {/* Podium bar */}
                                        <div className={`${dataIdx === 0 ? 'w-24' : 'w-20'} ${cfg.barH} bg-gradient-to-b ${cfg.bgGrad} rounded-t-lg border-x-2 border-t-2 ${cfg.barBorder} shadow-lg flex flex-col items-center justify-start pt-2 relative`}>
                                            <span className={`${cfg.numSize} font-display font-bold text-white text-outline-light`}>{dataIdx + 1}</span>
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="material-symbols-outlined text-white text-xs fill-current">favorite</span>
                                                <span className={`font-bold text-white ${dataIdx === 0 ? 'text-sm' : 'text-xs'}`}>{entry.totalPrayers}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* List */}
                        <div className="flex-1 bg-[#fffdf5] rounded-t-3xl border-t-4 border-[#8c6239] shadow-[0_-5px_15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">
                            <div className="h-full overflow-y-auto custom-scrollbar px-3 pt-3 pb-20 space-y-2">

                                {/* Sticky: Current user (nếu ngoài top 3) */}
                                {currentUserRank && currentUserRank.rank > 3 && (
                                    <div className="sticky top-0 z-20 bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-3 flex items-center shadow-md border-2 border-green-500 scale-[1.01] mb-1">
                                        <div className="w-8 text-center font-display font-bold text-base text-green-700">
                                            {currentUserRank.rank}
                                        </div>
                                        <div className="relative mx-3 flex-shrink-0">
                                            <div className="w-11 h-11 rounded-full border-2 border-green-500 overflow-hidden flex items-center justify-center">
                                                <Avatar
                                                    picture={profile?.picture}
                                                    gmailAvatar={(profile as any)?.gmailAvatar}
                                                    name={profile?.name}
                                                    gmailName={(profile as any)?.gmailName}
                                                    size="sm"
                                                />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border border-white shadow">
                                                <span className="material-symbols-outlined text-white" style={{ fontSize: 12 }}>person</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-green-800 font-bold text-sm truncate">
                                                {(profile as any)?.gmailName || profile?.name}
                                                <span className="text-green-500 font-normal text-xs ml-1">(Bạn)</span>
                                            </div>
                                            {currentUserRank.currentStreak > 0 && (
                                                <div className="text-[10px] text-orange-500 font-bold">🔥 Chuỗi: {currentUserRank.currentStreak} ngày</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-green-200 shadow-sm flex-shrink-0">
                                            <span className="material-symbols-outlined text-pink-500 text-sm fill-current">favorite</span>
                                            <span className="text-green-800 font-bold text-sm">{currentUserRank.totalPrayers}</span>
                                        </div>
                                    </div>
                                )}

                                {rest.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-60">
                                        <span className="material-symbols-outlined text-green-600 text-4xl">volunteer_activism</span>
                                        <p className="text-sm font-display text-farm-brown-dark">Chưa có thêm người dùng</p>
                                    </div>
                                ) : (
                                    rest.map((entry) => {
                                        const isCurrent = entry.userId === profile?.userId;
                                        if (isCurrent) return null;

                                        return (
                                            <div key={entry.userId}
                                                className="bg-white rounded-xl p-3 flex items-center shadow-sm border border-[#e9c46a]/60 transition-all">
                                                <div className="w-8 text-center font-display font-bold text-base text-farm-brown">{entry.rank}</div>
                                                <div className="relative mx-2 flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-full border-2 border-farm-brown-dark/20 overflow-hidden flex items-center justify-center">
                                                        <Avatar
                                                            picture={entry.picture}
                                                            gmailAvatar={entry.gmailAvatar}
                                                            avatarUrl={entry.avatarUrl}
                                                            name={entry.userName}
                                                            gmailName={entry.gmailName}
                                                            size="sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-farm-brown-dark font-bold text-sm truncate">{entry.gmailName || entry.userName}</div>
                                                    {entry.currentStreak > 0 && (
                                                        <div className="text-[10px] text-orange-500 font-bold">🔥 Chuỗi: {entry.currentStreak} ngày</div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <span className="material-symbols-outlined text-pink-400 text-sm fill-current">favorite</span>
                                                    <span className="text-farm-brown font-bold text-sm">{entry.totalPrayers}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                <div className="flex flex-col items-center pt-4 pb-2 opacity-50 gap-1">
                                    <span className="material-symbols-outlined text-green-700 text-4xl">cruelty_free</span>
                                    <p className="text-center text-[10px] text-farm-brown-dark italic">
                                        "Mỗi lời cầu nguyện là một hạt giống thiện lành."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom nav */}
            <div className="absolute bottom-0 w-full h-20 bg-[#8c6239] border-t-4 border-[#5d4037] z-40 px-6 rounded-t-3xl shadow-[0_-5px_15px_rgba(0,0,0,0.3)]"
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/wood-pattern.png')" }}>
                <div className="flex justify-between items-center h-full pb-2">
                    <button onClick={onClose} className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity active:scale-95">
                        <span className="material-symbols-outlined text-[#fefae0] text-2xl">home</span>
                        <span className="text-[9px] font-bold text-[#fefae0] uppercase">Trở Lại</span>
                    </button>
                    <button onClick={onClose} className="flex flex-col items-center gap-1 transform -translate-y-4">
                        <div className="w-14 h-14 bg-farm-green-light rounded-full border-4 border-[#fefae0] flex items-center justify-center shadow-lg relative z-10">
                            <span className="material-symbols-outlined text-white text-3xl animate-pulse">volunteer_activism</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#fefae0] uppercase mt-1 bg-[#5d4037] px-2 rounded-full">Cầu Nguyện</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity active:scale-95">
                        <span className="material-symbols-outlined text-[#fefae0] text-2xl">emoji_events</span>
                        <span className="text-[9px] font-bold text-[#fefae0] uppercase">Phần Thưởng</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
