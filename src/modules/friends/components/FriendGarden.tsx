import { useState } from 'react';
import { Friend } from '../data/friends';
import { useFarmStore } from '@/modules/farming/stores/farmStore';
import { useUIStore } from '@/shared/stores/uiStore';
import { useActivityStore } from '@/shared/stores/activityStore';

const GIFT_OPTIONS = [
  { emoji: '💧', name: 'Nước tưới', cost: 5 },
  { emoji: '🌱', name: 'Phân bón', cost: 10 },
  { emoji: '☀️', name: 'Ánh nắng', cost: 15 },
  { emoji: '🎁', name: 'Hộp quà', cost: 30 },
];

interface FriendGardenProps {
  friend: Friend;
  onBack: () => void;
}

export default function FriendGarden({ friend, onBack }: FriendGardenProps) {
  const addOgn = useFarmStore((s) => s.addOgn);
  const ogn = useFarmStore((s) => s.ogn);
  const showFlyUp = useUIStore((s) => s.showFlyUp);
  const addToast = useUIStore((s) => s.addToast);
  const actAddLike = useActivityStore((s) => s.addLike);
  const actAddComment = useActivityStore((s) => s.addComment);
  const actAddGift = useActivityStore((s) => s.addGift);
  const actAddWater = useActivityStore((s) => s.addWater);
  const [watered, setWatered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{ name: string; text: string; time: string }[]>([
    { name: 'CryptoFarmer', text: 'Vườn đẹp quá! 🌿', time: '2 phút trước' },
    { name: 'GreenHero92', text: 'Cây sắp thu hoạch rồi nè!', time: '10 phút trước' },
  ]);
  const [giftsSent, setGiftsSent] = useState<string[]>([]);

  const handleWater = () => {
    if (watered) return;
    setWatered(true);
    addOgn(5);
    showFlyUp('+5 OGN 🪙');
    addToast(`Đã tưới giúp ${friend.name}! +5 OGN 💧`, 'success');
    actAddWater(friend.name);
  };

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    addOgn(2);
    showFlyUp('+2 OGN ❤️');
    addToast(`Đã thích vườn của ${friend.name}! ❤️`, 'success');
    actAddLike(friend.name);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    setComments((prev) => [
      { name: 'Bạn', text: commentText.trim(), time: 'Vừa xong' },
      ...prev,
    ]);
    addOgn(1);
    showFlyUp('+1 OGN 💬');
    actAddComment(friend.name, commentText.trim());
    setCommentText('');
  };

  const handleGift = (gift: typeof GIFT_OPTIONS[0]) => {
    if (ogn < gift.cost || giftsSent.includes(gift.name)) return;
    addOgn(-gift.cost);
    setGiftsSent((prev) => [...prev, gift.name]);
    showFlyUp(`${gift.emoji} -${gift.cost} OGN`);
    addToast(`Đã tặng ${gift.name} cho ${friend.name}! ${gift.emoji}`, 'success');
    actAddGift(friend.name, gift.name);
  };

  const moodEmoji = friend.plant.happiness >= 70 ? '😊' : friend.plant.happiness >= 40 ? '😐' : '😢';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col max-w-[430px] mx-auto">
      {/* Background */}
      <div className="absolute inset-0 farm-sky-gradient" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-safe pb-3">
        <button onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl header-btn-glass">
          ←
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl avatar-ring">
            <div className="w-full h-full rounded-full bg-primary flex items-center justify-center">
              {friend.avatar}
            </div>
          </div>
          <div>
            <p className="font-heading text-sm font-bold">{friend.name}</p>
            <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[9px]">Lv.{friend.level}</span>
              {friend.title}
            </p>
          </div>
        </div>
        {friend.online && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: 'rgba(46,204,113,0.15)', color: '#27ae60' }}>
            🟢 Online
          </span>
        )}
      </div>

      {/* Stats bar */}
      <div className="relative z-10 flex gap-2 px-5 mb-3">
        {[
          { icon: '🪙', val: friend.stats.ogn.toLocaleString(), label: 'OGN' },
          { icon: '🌾', val: friend.stats.totalHarvest.toString(), label: 'Thu hoạch' },
          { icon: '📅', val: `${friend.stats.daysActive}d`, label: 'Hoạt động' },
        ].map(s => (
          <div key={s.label} className="flex-1 stat-chip rounded-xl px-2.5 py-2 flex items-center gap-2">
            <span className="text-base">{s.icon}</span>
            <div>
              <p className="font-heading text-sm font-bold leading-tight">{s.val}</p>
              <p className="text-[9px] font-semibold text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Garden scene */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5">
        {/* Sun */}
        <div className="absolute top-2 right-8 w-[50px] h-[50px] rounded-full animate-sun-pulse"
          style={{ background: 'radial-gradient(circle, #ffe066 30%, #f0b429 60%, transparent 70%)' }} />

        {/* Plant */}
        <div className="flex flex-col items-center relative" style={{ width: 260 }}>
          {/* Mood */}
          <span className="absolute -top-2 right-8 text-2xl">{moodEmoji}</span>

          {/* Visiting badge */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white whitespace-nowrap"
            style={{ background: 'rgba(45,138,78,0.8)', backdropFilter: 'blur(8px)' }}>
            👀 Đang thăm vườn
          </div>

          <div className="animate-plant-sway flex flex-col items-center">
            <span className="text-7xl drop-shadow-md" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,100,0,0.2))' }}>
              {friend.plant.emoji}
            </span>
            <div className="w-2 h-14 rounded-full -mt-2"
              style={{ background: 'linear-gradient(180deg, #4eca6a, #2d8a4e)' }} />
          </div>

          {/* Pot */}
          <div className="relative -mt-1" style={{ width: 140 }}>
            <div className="h-4 rounded-lg -mb-px"
              style={{ background: 'linear-gradient(180deg, #c49a6c, #8b5e34)', margin: '0 -8px' }} />
            <div className="h-[60px] rounded-b-[25px] plant-pot-gradient relative"
              style={{ boxShadow: '0 8px 25px rgba(92,61,31,0.3)' }}>
              <span className="absolute bottom-3 left-0 right-0 text-center font-heading text-[10px] text-white/70 font-semibold tracking-wider">
                {friend.name}
              </span>
            </div>
          </div>

          {/* Growth bar */}
          <div className="w-[200px] mt-4">
            <div className="rounded-[20px] p-1" style={{ background: 'rgba(255,255,255,0.6)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
              <div className="h-3 rounded-2xl relative"
                style={{
                  width: `${Math.max(5, friend.plant.growthPct)}%`,
                  background: friend.plant.growthPct >= 100
                    ? 'linear-gradient(90deg, #f0b429, #ffe066)'
                    : 'linear-gradient(90deg, #4eca6a, #b8f0c5)',
                  boxShadow: '0 2px 6px rgba(78,202,106,0.3)',
                }}>
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-extrabold whitespace-nowrap"
                  style={{ color: '#1a5c2a' }}>
                  {friend.plant.growthPct >= 100 ? '🌾 Sẵn sàng!' : `🌱 ${friend.plant.growthPct}%`}
                </span>
              </div>
            </div>
            <div className="flex justify-between px-1 mt-1 text-[10px] font-bold text-muted-foreground">
              <span>{friend.plant.stage}</span>
              <span>❤️ {friend.plant.happiness}%</span>
            </div>
          </div>

          {/* Status tags */}
          <div className="flex gap-2 mt-2">
            <span className="px-3 py-1 rounded-[20px] text-[10px] font-bold"
              style={{ background: '#d4f8dc', color: '#1a7a30' }}>
              {friend.plant.name}
            </span>
            <span className="px-3 py-1 rounded-[20px] text-[10px] font-bold"
              style={{ background: '#fff8dc', color: '#d49a1a' }}>
              🪙 {friend.stats.ogn} OGN
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="relative z-10 px-5 pb-8 space-y-3">
        <div className="flex gap-3">
          <button onClick={handleWater} disabled={watered}
            className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-all disabled:opacity-50"
            style={{ background: watered ? '#95a5a6' : 'linear-gradient(135deg, #3498db, #74b9ff)', boxShadow: '0 4px 15px rgba(52,152,219,0.3)' }}>
            {watered ? '✅ Đã tưới' : '💧 Tưới (+5)'}
          </button>
          <button onClick={handleLike} disabled={liked}
            className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-all disabled:opacity-50"
            style={{ background: liked ? '#95a5a6' : 'linear-gradient(135deg, #e74c3c, #ff6b6b)', boxShadow: '0 4px 15px rgba(231,76,60,0.3)' }}>
            {liked ? '❤️ Đã thích' : '❤️ Thích (+2)'}
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowComments(true)}
            className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-all"
            style={{ background: 'linear-gradient(135deg, #9b59b6, #c39bd3)', boxShadow: '0 4px 15px rgba(155,89,182,0.3)' }}>
            💬 Bình luận ({comments.length})
          </button>
          <button onClick={() => setShowGifts(true)}
            className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-all"
            style={{ background: 'linear-gradient(135deg, #f39c12, #f1c40f)', boxShadow: '0 4px 15px rgba(243,156,18,0.3)' }}>
            🎁 Tặng quà
          </button>
        </div>
      </div>

      {/* Comments modal */}
      {showComments && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowComments(false)} />
          <div className="relative w-full max-w-[430px] rounded-t-2xl bg-white overflow-hidden animate-slide-up" style={{ maxHeight: '60vh' }}>
            <div className="px-5 py-3 flex justify-between items-center border-b"
              style={{ background: 'linear-gradient(135deg, #9b59b6, #c39bd3)' }}>
              <h3 className="font-heading text-base font-bold text-white">💬 Bình luận</h3>
              <button onClick={() => setShowComments(false)} className="text-white/70 text-xl font-bold w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(60vh - 120px)' }}>
              {comments.map((c, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-xs font-bold">{c.name}</span>
                      <span className="text-[9px] text-muted-foreground">{c.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6">Chưa có bình luận nào</p>
              )}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                placeholder="Viết bình luận... (+1 OGN)"
                className="flex-1 px-3 py-2 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={(e) => e.key === 'Enter' && handleComment()} />
              <button onClick={handleComment} disabled={!commentText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #9b59b6, #c39bd3)' }}>
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gifts modal */}
      {showGifts && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGifts(false)} />
          <div className="relative w-full max-w-[430px] rounded-t-2xl bg-white overflow-hidden animate-slide-up" style={{ maxHeight: '50vh' }}>
            <div className="px-5 py-3 flex justify-between items-center border-b"
              style={{ background: 'linear-gradient(135deg, #f39c12, #f1c40f)' }}>
              <h3 className="font-heading text-base font-bold text-white">🎁 Tặng quà cho {friend.name}</h3>
              <button onClick={() => setShowGifts(false)} className="text-white/70 text-xl font-bold w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {GIFT_OPTIONS.map((gift) => {
                const sent = giftsSent.includes(gift.name);
                const canAfford = ogn >= gift.cost;
                return (
                  <button key={gift.name} onClick={() => handleGift(gift)}
                    disabled={sent || !canAfford}
                    className="flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all active:scale-95 disabled:opacity-40"
                    style={{
                      borderColor: sent ? '#2ecc71' : '#f0ebe4',
                      background: sent ? 'rgba(46,204,113,0.08)' : 'white',
                    }}>
                    <span className="text-3xl">{gift.emoji}</span>
                    <span className="font-heading text-xs font-bold">{gift.name}</span>
                    <span className="text-[10px] font-bold" style={{ color: sent ? '#27ae60' : '#d49a1a' }}>
                      {sent ? '✅ Đã tặng' : `🪙 ${gift.cost} OGN`}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="px-4 pb-4 text-center">
              <p className="text-[10px] text-muted-foreground font-semibold">
                Số dư: 🪙 {ogn.toLocaleString()} OGN
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
