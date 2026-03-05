import type { FriendStatus } from '@/shared/types/social.types';
import { playSound } from '@/shared/audio';

interface AddFriendButtonProps {
  userId: string;
  friendStatus: FriendStatus;
  onAdd: (userId: string) => void;
  onAccept: (userId: string) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<
  Exclude<FriendStatus, 'blocked'>,
  { label: string; active: boolean; bg: string; color: string }
> = {
  none: {
    label: '+ Kết bạn',
    active: true,
    bg: 'linear-gradient(135deg, #2d8a4e, #4eca6a)',
    color: 'white',
  },
  request_sent: {
    label: 'Đã gửi lời mời',
    active: false,
    bg: '#f0f0f0',
    color: '#9ca3af',
  },
  request_received: {
    label: 'Chấp nhận ✓',
    active: true,
    bg: 'linear-gradient(135deg, #f0b429, #e67e22)',
    color: 'white',
  },
  friends: {
    label: 'Bạn bè ✓',
    active: false,
    bg: '#f0f0f0',
    color: '#9ca3af',
  },
};

export default function AddFriendButton({
  userId,
  friendStatus,
  onAdd,
  onAccept,
  isLoading,
}: AddFriendButtonProps) {
  if (friendStatus === 'blocked') return null;

  const cfg = STATUS_CONFIG[friendStatus];

  const handleClick = () => {
    if (!cfg.active || isLoading) return;
    playSound('ui_click');
    if (friendStatus === 'request_received') {
      onAccept(userId);
    } else {
      onAdd(userId);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!cfg.active || isLoading}
      className="px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform disabled:opacity-70 flex-shrink-0 whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}>
      {isLoading && friendStatus === 'none' ? '...' : cfg.label}
    </button>
  );
}
