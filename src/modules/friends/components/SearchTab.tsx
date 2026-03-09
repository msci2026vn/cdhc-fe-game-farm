import { useState, useEffect } from 'react';
import { useSearchUsers, useAddFriend, useAcceptFriend } from '@/shared/hooks/useSocial';
import AddFriendButton from './AddFriendButton';

export default function SearchTab() {
  const [inputValue, setInputValue] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(inputValue.trim()), 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data, isLoading } = useSearchUsers(debouncedQ);
  const addFriend = useAddFriend();
  const acceptFriend = useAcceptFriend();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const results = data?.results ?? [];

  const handleAdd = (userId: string) => {
    setLoadingId(userId);
    addFriend.mutate({ friendId: userId }, { onSettled: () => setLoadingId(null) });
  };

  const handleAccept = (userId: string) => {
    setLoadingId(userId);
    acceptFriend.mutate(userId, { onSettled: () => setLoadingId(null) });
  };

  return (
    <div className="px-5 py-4">
      {/* Search input */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none">🔍</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Nhập tên để tìm bạn bè..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
          autoComplete="off"
        />
        {inputValue && (
          <button
            onClick={() => setInputValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100">
            ✕
          </button>
        )}
      </div>

      {/* State: chưa nhập đủ */}
      {debouncedQ.length < 2 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-sm font-semibold text-gray-500">Nhập ít nhất 2 ký tự để tìm kiếm</p>
        </div>
      ) : isLoading ? (
        // Skeleton loading
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-2/5" />
                <div className="h-2.5 bg-gray-100 rounded w-1/5" />
              </div>
              <div className="w-20 h-7 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl mb-3">😔</span>
          <p className="text-sm font-semibold text-gray-600">Không tìm thấy người dùng nào</p>
          <p className="text-xs text-gray-400 mt-1">Thử tìm với tên khác</p>
        </div>
      ) : (
        <div className="space-y-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block px-1">
            Kết quả ({results.length})
          </span>
          {results.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 animate-slide-up">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                {user.picture
                  ? <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                  : '👤'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="font-heading font-bold text-gray-800 text-sm truncate block">{user.name}</span>
                <span className="text-[10px] text-gray-500 font-medium">Lv.{user.level}</span>
              </div>

              {/* Add Friend Button */}
              <AddFriendButton
                userId={user.id}
                friendStatus={user.friendStatus}
                onAdd={handleAdd}
                onAccept={handleAccept}
                isLoading={loadingId === user.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
