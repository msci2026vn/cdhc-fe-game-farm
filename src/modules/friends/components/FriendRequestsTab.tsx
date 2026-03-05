import { useState } from 'react';
import { useFriendRequests, useAcceptFriend, useDeclineFriend } from '@/shared/hooks/useSocial';
import RequestCard from './RequestCard';

export default function FriendRequestsTab() {
  const { data, isLoading } = useFriendRequests();
  const acceptFriend = useAcceptFriend();
  const declineFriend = useDeclineFriend();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const requests = data?.requests ?? [];

  const handleAccept = (fromId: string) => {
    setLoadingId(fromId);
    acceptFriend.mutate(fromId, { onSettled: () => setLoadingId(null) });
  };

  const handleDecline = (fromId: string) => {
    setLoadingId(fromId);
    declineFriend.mutate(fromId, { onSettled: () => setLoadingId(null) });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-600 rounded-full animate-spin" />
        <p className="text-sm font-bold text-green-700 mt-3">Đang tải...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <span className="text-5xl mb-3">📭</span>
        <h3 className="font-heading text-base font-bold text-gray-700 mb-1">Chưa có lời mời nào</h3>
        <p className="text-sm text-gray-400">Khi ai đó gửi lời mời kết bạn, bạn sẽ thấy ở đây</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 space-y-3">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block px-1">
        Lời mời ({requests.length})
      </span>
      {requests.map((req) => (
        <RequestCard
          key={req.fromId}
          request={req}
          onAccept={handleAccept}
          onDecline={handleDecline}
          isLoading={loadingId === req.fromId}
        />
      ))}
    </div>
  );
}
