import { useState } from 'react';
import { usePrayerLeaderboard } from '../hooks/usePrayerLeaderboard';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';

export interface PrayerLeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Avatar dùng useState để handle lỗi ảnh đúng cách
function Avatar({
    picture, gmailAvatar, avatarUrl, name, gmailName,
    sizeClass = 'w-12 h-12',
    textClass = 'text-base',
}: {
    picture?: string | null;
    gmailAvatar?: string | null;
    avatarUrl?: string | null;
    name?: string | null;
    gmailName?: string | null;
    sizeClass?: string;
    textClass?: string;
}) {
    const [imgError, setImgError] = useState(false);
    const src = gmailAvatar || picture || avatarUrl || null;
    const displayName = gmailName || name || '?';
    const initials = displayName.charAt(0).toUpperCase();

    if (src && !imgError) {
        return (
            <img
                src={src}
                alt={displayName}
                className={`${sizeClass} rounded-full object-cover`}
                onError={() => setImgError(true)}
            />
        );
    }
    return (
        <div className={`${sizeClass} ${textClass} rounded-full flex items-center justify-center font-bold bg-gradient-to-br from-green-400 to-green-600 text-white`}>
            {initials}
        </div>
    );
}

// Config cho từng vị trí CỘT podium (colIdx 0=trái/hạng2, 1=giữa/hạng1, 2=phải/hạng3)
const PODIUM_COL = [
    {
        // Cột trái - hạng 2 (bạc)
        rankNum: 2,
        label: 'Tấm Lòng Vàng',
        medal: 'workspace_premium',
        medalColor: 'text-gray-400',
        border: 'border-gray-300',
        barGrad: 'from-gray-300 to-gray-500',
        barBorder: 'border-gray-500',
        barH: 96,
        barW: 76,
        avatarSize: 'w-14 h-14' as const,
        avatarText: 'text-lg',
        yOffset: 16, // translate-y px
    },
    {
        // Cột giữa - hạng 1 (vàng)
        rankNum: 1,
        label: 'Đại Sứ Nhân Ái',
        medal: 'crown',
        medalColor: 'text-yellow-500',
        border: 'border-yellow-400',
        barGrad: 'from-yellow-300 to-yellow-600',
        barBorder: 'border-yellow-700',
        barH: 128,
        barW: 88,
        avatarSize: 'w-20 h-20' as const,
        avatarText: 'text-2xl',
        yOffset: 0,
    },
    {
        // Cột phải - hạng 3 (đồng)
        rankNum: 3,
        label: 'Người Gieo Hạt',
        medal: 'workspace_premium',
        medalColor: 'text-orange-700',
        border: 'border-orange-600',
        barGrad: 'from-[#cd7f32] to-[#8b4513]',
        barBorder: 'border-[#8b4513]',
        barH: 72,
        barW: 76,
        avatarSize: 'w-14 h-14' as const,
        avatarText: 'text-lg',
        yOffset: 28,
    },
];

// Dữ liệu: top3[0]=hạng1, top3[1]=hạng2, top3[2]=hạng3
// Thứ tự cột hiển thị: [hạng2, hạng1, hạng3] → dataIdx [1, 0, 2]
const PODIUM_DATA_ORDER = [1, 0, 2];

export function PrayerLeaderboardModal({ isOpen, onClose }: PrayerLeaderboardModalProps) {
    const { data: leaderboard, isLoading } = usePrayerLeaderboard(50);
    const { data: profile } = usePlayerProfile();
    const { data: auth } = useAuth();

    if (!isOpen) return null;

    const top3 = leaderboard?.slice(0, 3) || [];
    const rest = leaderboard?.slice(3) || [];
    const currentUserRank = leaderboard?.find(e => e.userId === profile?.userId);

    // Ảnh đại diện của user hiện tại — ưu tiên như FarmHeader
    const myPicture =
        auth?.user?.picture ||
        (auth?.user as any)?.avatar ||
        (auth?.user as any)?.avatarUrl ||
        profile?.picture ||
        null;
    const myName = auth?.user?.name || (auth?.user as any)?.fullName || profile?.name || '?';

    return (
        <div className="fixed inset-0 z-50 max-w-md mx-auto h-[100dvh] flex flex-col bg-spiritual shadow-2xl overflow-hidden animate-slide-up">

            {/* Nền trang trí */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/floral-linen.png')]" />
                <span className="material-symbols-outlined absolute top-8 -left-4 text-green-300 text-[120px] rotate-45">eco</span>
                <span className="material-symbols-outlined absolute bottom-24 -right-4 text-green-300 text-[120px] -rotate-12">local_florist</span>
            </div>

            {/* Header */}
            <div className="relative z-30 px-4 pt-10 pb-2 flex items-center gap-2 safe-top">
                <button
                    onClick={onClose}
                    className="w-10 h-10 bg-farm-straw rounded-full border-2 border-farm-brown-dark shadow-md flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
                >
                    <span className="material-symbols-outlined text-farm-brown-dark">arrow_back</span>
                </button>
                <div className="flex-1 flex justify-center">
                    <div className="bg-[#5d4037] py-1.5 px-5 rounded-xl border-2 border-[#8c6239] shadow-lg inline-flex items-center gap-2 relative">
                        <span className="material-symbols-outlined text-yellow-400 text-xl animate-pulse">spa</span>
                        <span className="text-farm-straw font-display font-bold text-base uppercase tracking-wider drop-shadow-md">Bảng Vàng Nhân Ái</span>
                        <span className="material-symbols-outlined text-green-400 text-xl">eco</span>
                    </div>
                </div>
                <div className="w-10 flex-shrink-0" />
            </div>

            {/* Tabs */}
            <div className="relative z-20 px-5 py-2">
                <div className="flex bg-[#fdf6e3]/60 p-1 rounded-full border-2 border-[#8c6239] backdrop-blur-sm shadow-sm">
                    <button className="flex-1 py-1.5 rounded-full text-xs font-bold font-display uppercase tracking-wide tab-active">Tuần</button>
                    <button className="flex-1 py-1.5 rounded-full text-xs font-bold font-display uppercase tracking-wide text-farm-brown-dark opacity-40 cursor-not-allowed">Tháng</button>
                    <button className="flex-1 py-1.5 rounded-full text-xs font-bold font-display uppercase tracking-wide text-farm-brown-dark opacity-40 cursor-not-allowed">Mùa</button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 relative z-10 overflow-hidden flex flex-col px-3 pb-20">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center flex-1 gap-3">
                        <span className="material-symbols-outlined text-green-600 text-5xl animate-pulse">volunteer_activism</span>
                        <p className="text-farm-brown-dark font-display font-bold">Đang tải bảng vàng...</p>
                    </div>
                ) : (
                    <>
                        {/* ── PODIUM TOP 3 ── */}
                        <div className="flex items-end justify-center gap-1 pt-4 pb-3 flex-shrink-0">
                            {PODIUM_DATA_ORDER.map((dataIdx, colIdx) => {
                                const entry = top3[dataIdx];
                                const col = PODIUM_COL[colIdx]; // dùng colIdx để lấy config đúng vị trí
                                const isMe = entry?.userId === profile?.userId;

                                if (!entry) return <div key={colIdx} style={{ width: col.barW }} />;

                                return (
                                    <div
                                        key={entry.userId}
                                        className="flex flex-col items-center"
                                        style={{ transform: `translateY(${col.yOffset}px)` }}
                                    >
                                        {/* Medal icon */}
                                        <span className={`material-symbols-outlined ${col.medalColor} ${colIdx === 1 ? 'text-4xl' : 'text-3xl'} drop-shadow-md mb-1`}
                                            style={{ fontVariationSettings: "'FILL' 1" }}>
                                            {col.medal}
                                        </span>

                                        {/* Avatar */}
                                        <div className="relative mb-2">
                                            {colIdx === 1 && (
                                                <div className="absolute -inset-1.5 bg-yellow-400 rounded-full blur-md opacity-50 animate-pulse" />
                                            )}
                                            {isMe && (
                                                <div className="absolute -inset-1 bg-green-400 rounded-full blur-sm opacity-40 animate-pulse" />
                                            )}
                                            <div className={`${col.avatarSize} rounded-full border-4 ${col.border} overflow-hidden shadow-xl relative z-10 flex-shrink-0`}>
                                                <Avatar
                                                    picture={isMe ? myPicture : (entry.picture ?? null)}
                                                    gmailAvatar={isMe ? null : (entry.gmailAvatar ?? null)}
                                                    avatarUrl={isMe ? null : (entry.avatarUrl ?? null)}
                                                    name={isMe ? myName : entry.userName}
                                                    gmailName={isMe ? null : (entry.gmailName ?? null)}
                                                    sizeClass={col.avatarSize}
                                                    textClass={col.avatarText}
                                                />
                                            </div>
                                            {isMe && (
                                                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full z-20 border border-white shadow leading-tight">
                                                    Bạn
                                                </div>
                                            )}
                                        </div>

                                        {/* Tên */}
                                        <p className={`font-bold text-center leading-tight mb-1 ${isMe ? 'text-green-700' : 'text-farm-brown-dark'}`}
                                            style={{
                                                fontSize: colIdx === 1 ? 11 : 10,
                                                maxWidth: col.barW + 8,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical' as const,
                                                overflow: 'hidden',
                                                wordBreak: 'break-word',
                                            }}>
                                            {entry.gmailName || entry.userName}
                                        </p>

                                        {/* Title label */}
                                        <div className="text-center mb-1.5">
                                            <span className="text-[9px] font-bold text-farm-brown/70 italic">{col.label}</span>
                                        </div>

                                        {/* Thanh podium */}
                                        <div
                                            className={`bg-gradient-to-b ${col.barGrad} rounded-t-lg border-x-2 border-t-2 ${col.barBorder} shadow-lg flex flex-col items-center justify-start pt-2 gap-1`}
                                            style={{ width: col.barW, height: col.barH }}
                                        >
                                            <span className={`font-display font-bold text-white drop-shadow ${colIdx === 1 ? 'text-4xl' : 'text-2xl'}`}>
                                                {col.rankNum}
                                            </span>
                                            <div className="flex items-center gap-0.5 bg-black/10 px-2 py-0.5 rounded-full">
                                                <span className="material-symbols-outlined text-red-300 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                                <span className={`font-bold text-white ${colIdx === 1 ? 'text-xs' : 'text-[10px]'}`}>
                                                    {entry.totalPrayers}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── DANH SÁCH ── */}
                        <div className="flex-1 bg-[#fffdf5] rounded-t-3xl border-t-4 border-[#8c6239] shadow-[0_-5px_15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">
                            <div className="h-full overflow-y-auto custom-scrollbar px-3 pt-3 pb-4 space-y-2">

                                {/* Sticky: user hiện tại nếu ngoài top3 */}
                                {currentUserRank && currentUserRank.rank > 3 && (
                                    <div className="sticky top-0 z-20 rounded-xl overflow-hidden shadow-md border-2 border-green-500">
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 flex items-center gap-3">
                                            <span className="w-7 text-center font-display font-bold text-sm text-green-700 flex-shrink-0">
                                                #{currentUserRank.rank}
                                            </span>
                                            <div className="relative flex-shrink-0">
                                                <div className="w-11 h-11 rounded-full border-2 border-green-500 overflow-hidden">
                                                    <Avatar
                                                        picture={myPicture}
                                                        name={myName}
                                                        sizeClass="w-11 h-11"
                                                        textClass="text-sm"
                                                    />
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow">
                                                    <span className="material-symbols-outlined text-white" style={{ fontSize: 11 }}>person</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-green-800 truncate">
                                                    {myName}
                                                    <span className="ml-1 text-green-500 font-normal text-xs">(Bạn)</span>
                                                </p>
                                                {currentUserRank.currentStreak > 0 && (
                                                    <p className="text-[10px] text-orange-500 font-bold">🔥 Chuỗi {currentUserRank.currentStreak} ngày</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-green-200 shadow-sm flex-shrink-0">
                                                <span className="material-symbols-outlined text-pink-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                                <span className="text-green-800 font-bold text-sm">{currentUserRank.totalPrayers}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Danh sách từ hạng 4 trở đi */}
                                {rest.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-50">
                                        <span className="material-symbols-outlined text-green-600 text-4xl">volunteer_activism</span>
                                        <p className="text-sm font-display text-farm-brown-dark">Chưa có thêm người dùng</p>
                                    </div>
                                ) : (
                                    rest.map((entry) => {
                                        const isCurrent = entry.userId === profile?.userId;
                                        if (isCurrent) return null;

                                        return (
                                            <div key={entry.userId}
                                                className="bg-white rounded-xl flex items-center gap-2 shadow-sm border border-[#e9c46a]/50 overflow-hidden">
                                                {/* Rank */}
                                                <div className="w-10 flex-shrink-0 flex items-center justify-center py-3 bg-[#fdf6e3] border-r border-[#e9c46a]/30 self-stretch">
                                                    <span className="font-display font-bold text-sm text-farm-brown">{entry.rank}</span>
                                                </div>
                                                {/* Avatar */}
                                                <div className="flex-shrink-0 py-2">
                                                    <div className="w-10 h-10 rounded-full border-2 border-farm-brown-dark/20 overflow-hidden">
                                                        <Avatar
                                                            picture={entry.picture}
                                                            gmailAvatar={entry.gmailAvatar}
                                                            avatarUrl={entry.avatarUrl}
                                                            name={entry.userName}
                                                            gmailName={entry.gmailName}
                                                            sizeClass="w-10 h-10"
                                                            textClass="text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Tên + streak */}
                                                <div className="flex-1 min-w-0 py-2">
                                                    <p className="text-farm-brown-dark font-bold text-sm truncate leading-tight">
                                                        {entry.gmailName || entry.userName}
                                                    </p>
                                                    {entry.currentStreak > 0 && (
                                                        <p className="text-[10px] text-orange-500 font-semibold">🔥 {entry.currentStreak} ngày</p>
                                                    )}
                                                </div>
                                                {/* Số cầu nguyện */}
                                                <div className="flex-shrink-0 flex items-center gap-1 pr-3 py-2">
                                                    <span className="material-symbols-outlined text-pink-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                                    <span className="text-farm-brown font-bold text-sm">{entry.totalPrayers}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {/* Footer quote */}
                                <div className="flex flex-col items-center pt-4 pb-2 gap-1 opacity-50">
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
                    <button onClick={onClose} className="flex flex-col items-center gap-0.5 opacity-70 hover:opacity-100 transition-opacity active:scale-95">
                        <span className="material-symbols-outlined text-[#fefae0] text-2xl">home</span>
                        <span className="text-[9px] font-bold text-[#fefae0] uppercase">Trở Lại</span>
                    </button>
                    <button onClick={onClose} className="flex flex-col items-center gap-0.5 -translate-y-4">
                        <div className="w-14 h-14 bg-farm-green-light rounded-full border-4 border-[#fefae0] flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-white text-3xl animate-pulse">volunteer_activism</span>
                        </div>
                        <span className="text-[9px] font-bold text-[#fefae0] uppercase mt-1 bg-[#5d4037] px-2 py-0.5 rounded-full">Cầu Nguyện</span>
                    </button>
                    <button className="flex flex-col items-center gap-0.5 opacity-70 hover:opacity-100 transition-opacity active:scale-95">
                        <span className="material-symbols-outlined text-[#fefae0] text-2xl">emoji_events</span>
                        <span className="text-[9px] font-bold text-[#fefae0] uppercase">Phần Thưởng</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
