import { useState } from 'react';
import { Friend } from '../data/friends';
import { useFarmStore } from '@/modules/farming/stores/farmStore';
import { useUIStore } from '@/shared/stores/uiStore';

interface FriendGardenProps {
  friend: Friend;
  onBack: () => void;
}

export default function FriendGarden({ friend, onBack }: FriendGardenProps) {
  const addOgn = useFarmStore((s) => s.addOgn);
  const showFlyUp = useUIStore((s) => s.showFlyUp);
  const addToast = useUIStore((s) => s.addToast);
  const [watered, setWatered] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleWater = () => {
    if (watered) return;
    setWatered(true);
    addOgn(5);
    showFlyUp('+5 OGN 🪙');
    addToast(`Đã tưới giúp ${friend.name}! +5 OGN 💧`, 'success');
  };

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    addToast(`Đã thích vườn của ${friend.name}! ❤️`, 'success');
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
      <div className="relative z-10 px-5 pb-8 flex gap-3">
        <button onClick={handleWater} disabled={watered}
          className="flex-1 py-3.5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-all disabled:opacity-50"
          style={{ background: watered ? '#95a5a6' : 'linear-gradient(135deg, #3498db, #74b9ff)', boxShadow: '0 4px 15px rgba(52,152,219,0.3)' }}>
          {watered ? '✅ Đã tưới' : '💧 Tưới giúp (+5 OGN)'}
        </button>
        <button onClick={handleLike} disabled={liked}
          className="flex-1 py-3.5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-all disabled:opacity-50"
          style={{ background: liked ? '#95a5a6' : 'linear-gradient(135deg, #e74c3c, #ff6b6b)', boxShadow: '0 4px 15px rgba(231,76,60,0.3)' }}>
          {liked ? '❤️ Đã thích' : '❤️ Thích vườn'}
        </button>
      </div>
    </div>
  );
}
