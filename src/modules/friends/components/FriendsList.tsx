import { Friend, FRIENDS } from '../data/friends';

interface FriendsListProps {
  open: boolean;
  onClose: () => void;
  onVisit: (friend: Friend) => void;
  onInvite: () => void;
}

export default function FriendsList({ open, onClose, onVisit, onInvite }: FriendsListProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[430px] rounded-t-2xl overflow-hidden animate-slide-up"
        style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="px-5 py-4 flex justify-between items-center"
          style={{ background: 'linear-gradient(135deg, #2d8a4e, #4eca6a)' }}>
          <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
            🏡 Bạn bè ({FRIENDS.length})
          </h3>
          <button onClick={onClose} className="text-white/70 text-xl font-bold w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Friends list */}
        <div className="bg-white overflow-y-auto" style={{ maxHeight: 'calc(80vh - 60px)' }}>
          {FRIENDS.map((friend) => (
            <button key={friend.id}
              onClick={() => onVisit(friend)}
              className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors active:bg-green-50"
              style={{ borderBottom: '1px solid #f0ebe4' }}>
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl avatar-ring">
                  <div className="w-full h-full rounded-full bg-primary flex items-center justify-center">
                    {friend.avatar}
                  </div>
                </div>
                {friend.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                    style={{ background: '#2ecc71' }} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-sm font-bold truncate">{friend.name}</span>
                  {friend.online && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Online</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary text-white">Lv.{friend.level}</span>
                  <span className="text-[11px] text-muted-foreground font-semibold">{friend.title}</span>
                </div>
              </div>

              {/* Plant preview */}
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <span className="text-2xl">{friend.plant.emoji}</span>
                <span className="text-[9px] font-bold text-muted-foreground">{friend.plant.growthPct}%</span>
              </div>

              {/* Arrow */}
              <span className="text-muted-foreground/40 text-lg">›</span>
            </button>
          ))}

          {/* Invite button */}
          <div className="px-5 py-5 text-center">
            <button onClick={onInvite}
              className="w-full py-3.5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform"
              style={{ background: 'linear-gradient(135deg, #f0b429, #e67e22)', boxShadow: '0 4px 15px rgba(240,180,41,0.3)' }}>
              🎁 Mời bạn bè nhận {50} OGN
            </button>
            <p className="text-[10px] text-muted-foreground font-semibold mt-2">Mời càng nhiều, nhận càng lớn!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
