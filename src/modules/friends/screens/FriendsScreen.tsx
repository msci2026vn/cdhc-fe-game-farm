import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/shared/components/BottomNav';
import { useFriends } from '@/shared/hooks/useSocial';
import InviteFriends from '@/modules/friends/components/InviteFriends';
import Leaderboard from '@/modules/friends/components/Leaderboard';
import FriendGarden from '@/modules/friends/components/FriendGarden';
import type { FriendData } from '@/shared/types/game-api.types';

export default function FriendsScreen() {
    const navigate = useNavigate();
    const { data: friendsData, isLoading } = useFriends();
    const friends = friendsData?.friends || [];

    const [visitingFriend, setVisitingFriend] = useState<FriendData | null>(null);
    const [showInvite, setShowInvite] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // If visiting a friend, show their garden
    if (visitingFriend) {
        return <FriendGarden friend={visitingFriend as any} onBack={() => setVisitingFriend(null)} />;
    }

    return (
        <div className="min-h-screen max-w-[430px] mx-auto relative flex flex-col overflow-hidden bg-[#e8f5e9]">
            {/* Background gradient similar to other screens */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#green-50] to-[#e8f5e9] z-0" />

            {/* Header */}
            <div className="relative z-10 px-5 pt-safe pb-4 bg-gradient-to-r from-[#2d8a4e] to-[#4eca6a] text-white rounded-b-[30px] shadow-lg">
                <div className="flex justify-between items-center mt-4">
                    <div>
                        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
                            🏡 Bạn bè
                        </h1>
                        <p className="text-white/80 text-xs font-semibold mt-1">
                            Kết nối và thăm vườn hàng xóm
                        </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                        <span className="text-2xl">🤝</span>
                    </div>
                </div>

                {/* Quick Actions in Header */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => setShowInvite(true)}
                        className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-2 px-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <span className="text-lg">💌</span>
                        <span className="text-xs font-bold text-white">Mời bạn</span>
                    </button>
                    <button
                        onClick={() => setShowLeaderboard(true)}
                        className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-2 px-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <span className="text-lg">🏆</span>
                        <span className="text-xs font-bold text-white">BXH</span>
                    </button>
                </div>
            </div>

            {/* Content - Scrollable List */}
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 relative z-10 space-y-3" style={{ scrollbarWidth: 'none' }}>
                {isLoading ? (
                    <div className="text-center py-10 space-y-3">
                        <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-600 rounded-full animate-spin mx-auto" />
                        <p className="text-sm font-bold text-green-700">Đang tải danh sách...</p>
                    </div>
                ) : friends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                        <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-4 text-6xl shadow-inner">
                            👥
                        </div>
                        <h3 className="font-heading text-xl font-bold text-green-800 mb-2">Chưa có bạn bè</h3>
                        <p className="text-sm text-green-600/80 mb-6 max-w-[250px]">
                            Hãy mời bạn bè cùng chơi để nhận thưởng và thăm vườn của nhau nhé!
                        </p>
                        <button
                            onClick={() => setShowInvite(true)}
                            className="btn-green px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-green-600/20 w-full">
                            Mời bạn ngay (+50 OGN)
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Danh sách ({friends.length})</span>
                        </div>
                        {friends.map((friend) => (
                            <button key={friend.id}
                                onClick={() => setVisitingFriend(friend)}
                                className="w-full bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.98] transition-all hover:shadow-md animate-slide-up">

                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl overflow-hidden border-2 border-white shadow-sm">
                                        {friend.avatar ? <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" /> : '👤'}
                                    </div>
                                    {friend.online && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="font-heading font-bold text-gray-800 text-sm truncate max-w-[120px]">{friend.name}</span>
                                        <span className="bg-yellow-100 text-yellow-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-yellow-200">
                                            Lv.{friend.level}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium truncate">{friend.title || 'Nông dân tập sự'}</p>
                                </div>

                                {/* Stats/Action */}
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Tài sản</p>
                                        <p className="font-heading font-bold text-amber-600 text-xs">
                                            🪙 {friend.ogn.toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </>
                )}
            </div>

            <InviteFriends open={showInvite} onClose={() => setShowInvite(false)} />
            <Leaderboard open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

            <BottomNav />
        </div>
    );
}
