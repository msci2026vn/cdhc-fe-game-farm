import { useState, useEffect } from 'react';
import { useFriends, useFriendRequests, useUnfriend } from '@/shared/hooks/useSocial';
import InviteFriends from '@/modules/friends/components/InviteFriends';
import Leaderboard from '@/modules/friends/components/Leaderboard';
import FriendGarden from '@/modules/friends/components/FriendGarden';
import FriendRequestsTab from '@/modules/friends/components/FriendRequestsTab';
import SearchTab from '@/modules/friends/components/SearchTab';
import type { FriendData } from '@/shared/types/game-api.types';
import { playSound, audioManager } from '@/shared/audio';

type FriendTab = 'friends' | 'requests' | 'search';

export default function FriendsScreen() {
  const { data: friendsData, isLoading, isError } = useFriends();
  const { data: requestsData } = useFriendRequests();
  const unfriend = useUnfriend();

  const friends = friendsData?.friends || [];
  const requestCount = requestsData?.requests.length ?? 0;

  const [activeTab, setActiveTab] = useState<FriendTab>('friends');
  const [visitingFriend, setVisitingFriend] = useState<FriendData | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [unfriendTarget, setUnfriendTarget] = useState<FriendData | null>(null);

  useEffect(() => {
    audioManager.startBgm('farm');
    return () => { audioManager.stopBgm(); };
  }, []);

  if (visitingFriend) {
    return <FriendGarden friend={visitingFriend} onBack={() => setVisitingFriend(null)} />;
  }

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto relative flex flex-col overflow-hidden bg-[#e8f5e9]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e8f5e9] to-[#f0faf2] z-0" />

      {/* Header */}
      <div className="relative z-10 px-5 pt-safe pb-4 bg-gradient-to-r from-[#2d8a4e] to-[#4eca6a] text-white rounded-b-[28px] shadow-lg">
        <div className="flex justify-between items-center mt-4">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">🏡 Bạn bè</h1>
            <p className="text-white/80 text-xs font-semibold mt-1">Kết nối và thăm vườn hàng xóm</p>
          </div>
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <span className="text-2xl">🤝</span>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => { playSound('ui_click'); setShowInvite(true); }}
            className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-2 px-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <span className="text-lg">💌</span>
            <span className="text-xs font-bold text-white">Mời bạn</span>
          </button>
          <button
            onClick={() => { playSound('ui_click'); setShowLeaderboard(true); }}
            className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-2 px-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <span className="text-lg">🏆</span>
            <span className="text-xs font-bold text-white">BXH</span>
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="relative z-10 flex bg-white border-b border-gray-100 shadow-sm">
        {([
          { key: 'friends'  as FriendTab, label: 'Bạn bè',   icon: '👥', badge: 0 },
          { key: 'requests' as FriendTab, label: 'Lời mời',  icon: '📨', badge: requestCount },
          { key: 'search'   as FriendTab, label: 'Tìm kiếm', icon: '🔍', badge: 0 },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => { playSound('ui_tab'); setActiveTab(tab.key); }}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 relative transition-colors ${
              activeTab === tab.key ? 'text-[#2d8a4e]' : 'text-gray-400'
            }`}>
            <span className="text-base">{tab.icon}</span>
            <span className="text-[10px] font-bold">{tab.label}</span>
            {tab.badge > 0 && (
              <span className="absolute top-1.5 right-[calc(50%-18px)] min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1">
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#2d8a4e] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto relative z-10" style={{ scrollbarWidth: 'none' }}>

        {/* Tab: Bạn bè */}
        {activeTab === 'friends' && (
          <div className="px-5 py-4 pb-24 space-y-3">
            {isLoading ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-600 rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-green-700">Đang tải danh sách...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-5xl mb-3">😿</span>
                <h3 className="font-heading text-lg font-bold text-red-700 mb-2">Không tải được dữ liệu</h3>
                <p className="text-sm text-gray-500">Vui lòng thử lại sau</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-4 text-6xl shadow-inner">
                  👥
                </div>
                <h3 className="font-heading text-xl font-bold text-green-800 mb-2">Chưa có bạn bè</h3>
                <p className="text-sm text-green-600/80 mb-6 max-w-[250px]">
                  Tìm kiếm hoặc mời bạn bè cùng chơi để nhận thưởng và thăm vườn nhau nhé!
                </p>
                <button
                  onClick={() => { playSound('ui_tab'); setActiveTab('search'); }}
                  className="btn-green px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-green-600/20 w-full mb-2">
                  🔍 Tìm bạn bè
                </button>
                <button
                  onClick={() => setShowInvite(true)}
                  className="w-full py-3 rounded-xl font-bold text-green-700 border border-green-300 bg-green-50">
                  💌 Mời bạn (+50 OGN)
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Danh sách ({friends.length})
                  </span>
                </div>
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 p-3 animate-slide-up">
                    {/* Clickable left area → visit garden */}
                    <button
                      onClick={() => { playSound('ui_click'); setVisitingFriend(friend); }}
                      className="flex items-center gap-3 flex-1 min-w-0 active:scale-[0.98] transition-all text-left">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl overflow-hidden border-2 border-white shadow-sm">
                          {friend.avatar
                            ? <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                            : '👤'}
                        </div>
                        {friend.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-gray-800 text-sm truncate max-w-[110px]">{friend.name}</span>
                          <span className="bg-yellow-100 text-yellow-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-yellow-200 flex-shrink-0">
                            Lv.{friend.level}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium truncate">{friend.title || 'Nông dân tập sự'}</p>
                        <p className="font-heading font-bold text-amber-600 text-[10px] flex items-center gap-1">
                          <img src="/icons/ogn_coin.png" alt="coin" className="w-3 h-3 object-contain" />
                          {friend.ogn.toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </button>

                    {/* Unfriend menu button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); playSound('ui_click'); setUnfriendTarget(friend); }}
                      className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-50 hover:border-red-100 transition-colors flex-shrink-0"
                      title="Hủy kết bạn">
                      <span className="text-sm leading-none">···</span>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Tab: Lời mời */}
        {activeTab === 'requests' && (
          <div className="pb-24">
            <FriendRequestsTab />
          </div>
        )}

        {/* Tab: Tìm kiếm */}
        {activeTab === 'search' && (
          <div className="pb-24">
            <SearchTab />
          </div>
        )}
      </div>

      {/* Unfriend Confirm Overlay */}
      {unfriendTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setUnfriendTarget(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl text-center">
            <div className="text-4xl mb-3">💔</div>
            <h3 className="font-heading text-base font-bold text-gray-800 mb-2">Hủy kết bạn?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Bạn có chắc muốn hủy kết bạn với{' '}
              <span className="font-bold text-gray-700">{unfriendTarget.name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setUnfriendTarget(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 active:scale-95 transition-transform">
                Hủy
              </button>
              <button
                onClick={() => {
                  unfriend.mutate(unfriendTarget.id);
                  setUnfriendTarget(null);
                }}
                disabled={unfriend.isPending}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white active:scale-95 transition-transform disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #e74c3c, #ff6b6b)' }}>
                {unfriend.isPending ? '...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      <InviteFriends open={showInvite} onClose={() => setShowInvite(false)} />
      <Leaderboard open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
          </div>
  );
}
