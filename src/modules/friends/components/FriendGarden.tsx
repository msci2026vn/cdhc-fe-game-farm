/**
 * FriendGarden — View friend's farm (real API data)
 *
 * Phase 1: 6-slot grid, growth timer, water/like interactions
 * Phase 2: gift system, comments (designed, not implemented)
 */
import { useMemo } from 'react';
import { useFriendFarm } from '@/shared/hooks/useFriendFarm';
import { useGrowthTimer } from '@/shared/hooks/useGrowthTimer';
import { useInteractFriend } from '@/shared/hooks/useSocial';
import type { FriendData } from '@/shared/types/game-api.types';

interface FriendGardenProps {
  friend: FriendData;
  onBack: () => void;
}

export default function FriendGarden({ friend, onBack }: FriendGardenProps) {
  const { data: farmData, isLoading, error } = useFriendFarm(friend.id);
  const interact = useInteractFriend();

  // Prepare growth timer inputs
  const growthInputs = useMemo(
    () =>
      (farmData?.plots ?? []).map((p) => ({
        plotId: p.id,
        plantedAt: p.plantedAt,
        growthDurationMs: p.growthDurationMs,
        isDead: p.isDead,
      })),
    [farmData?.plots],
  );
  const growthMap = useGrowthTimer(growthInputs);

  // Build 6-slot array
  const totalSlots = farmData?.totalSlots ?? 6;
  const slots = useMemo(() => {
    const arr = Array.from({ length: totalSlots }, (_, i) => {
      const plot = farmData?.plots.find((p) => p.slotIndex === i);
      return { slotIndex: i, plot: plot ?? null };
    });
    return arr;
  }, [farmData?.plots, totalSlots]);

  const handleWater = () => {
    interact.mutate({ friendId: friend.id, type: 'water' });
  };

  const handleLike = () => {
    interact.mutate({ friendId: friend.id, type: 'like' });
  };

  const friendInfo = farmData?.friend;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col max-w-[430px] mx-auto">
      {/* Background */}
      <div className="absolute inset-0 farm-sky-gradient" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-safe pb-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl header-btn-glass"
        >
          ←
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl avatar-ring">
            <div className="w-full h-full rounded-full bg-primary flex items-center justify-center overflow-hidden">
              {friend.avatar ? (
                <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                '👤'
              )}
            </div>
          </div>
          <div>
            <p className="font-heading text-sm font-bold">{friend.name}</p>
            <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[9px]">
                Lv.{friendInfo?.level ?? friend.level}
              </span>
              {friend.title || 'Nông dân'}
            </p>
          </div>
        </div>
        {friend.online && (
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: 'rgba(46,204,113,0.15)', color: '#27ae60' }}
          >
            Online
          </span>
        )}
      </div>

      {/* Stats bar */}
      <div className="relative z-10 flex gap-2 px-5 mb-3">
        {[
          { icon: '🪙', val: (friendInfo?.ogn ?? friend.ogn).toLocaleString('vi-VN'), label: 'OGN' },
          { icon: '🌱', val: `${farmData?.plots.length ?? 0}/${totalSlots}`, label: 'Ô trồng' },
          { icon: '🌾', val: friend.totalHarvest.toString(), label: 'Thu hoạch' },
        ].map((s) => (
          <div key={s.label} className="flex-1 stat-chip rounded-xl px-2.5 py-2 flex items-center gap-2">
            <span className="text-base">{s.icon}</span>
            <div>
              <p className="font-heading text-sm font-bold leading-tight">{s.val}</p>
              <p className="text-[9px] font-semibold text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Visiting badge */}
      <div className="relative z-10 flex justify-center mb-3">
        <span
          className="px-4 py-1.5 rounded-full text-[11px] font-bold text-white"
          style={{ background: 'rgba(45,138,78,0.8)', backdropFilter: 'blur(8px)' }}
        >
          👀 Đang thăm vườn
        </span>
      </div>

      {/* Farm grid */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-4" style={{ scrollbarWidth: 'none' }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-600 rounded-full animate-spin" />
            <p className="text-sm font-bold text-green-700 mt-3">Đang tải vườn...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">😢</span>
            <p className="text-sm font-bold text-red-600">Không thể tải vườn bạn</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(error as Error).message || 'Lỗi kết nối'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {slots.map(({ slotIndex, plot }) => {
              if (!plot) {
                // Empty slot
                return (
                  <div
                    key={slotIndex}
                    className="rounded-2xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center min-h-[140px]"
                    style={{ background: 'rgba(255,255,255,0.3)' }}
                  >
                    <span className="text-3xl opacity-30">🌱</span>
                    <p className="text-[11px] font-bold text-gray-400 mt-2">Trống</p>
                  </div>
                );
              }

              const growth = growthMap.get(plot.id);
              const percent = growth?.percent ?? plot.growthPercent;
              const isReady = growth?.isReady ?? plot.isReady;
              const countdown = growth?.remainingText ?? '';
              const moodEmoji = plot.happiness >= 70 ? '😊' : plot.happiness >= 40 ? '😐' : '😢';

              if (plot.isDead) {
                return (
                  <div
                    key={slotIndex}
                    className="rounded-2xl border-2 border-gray-200 p-4 flex flex-col items-center justify-center min-h-[140px]"
                    style={{ background: 'rgba(0,0,0,0.03)' }}
                  >
                    <span className="text-3xl grayscale opacity-50">{plot.plantEmoji}</span>
                    <p className="text-[11px] font-bold text-gray-400 mt-1">Đã chết</p>
                  </div>
                );
              }

              return (
                <div
                  key={slotIndex}
                  className="rounded-2xl border-2 border-white/60 p-3 flex flex-col items-center min-h-[140px]"
                  style={{
                    background: isReady
                      ? 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(255,224,102,0.15))'
                      : 'rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Plant emoji + mood */}
                  <div className="relative">
                    <span className="text-4xl">{plot.plantEmoji}</span>
                    <span className="absolute -top-1 -right-3 text-sm">{moodEmoji}</span>
                  </div>

                  {/* Name */}
                  <p className="text-[10px] font-bold text-gray-700 mt-1">{plot.plantName}</p>

                  {/* Growth bar */}
                  <div className="w-full mt-2">
                    <div
                      className="rounded-full p-0.5"
                      style={{ background: 'rgba(0,0,0,0.06)' }}
                    >
                      <div
                        className="h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.max(5, percent)}%`,
                          background: isReady
                            ? 'linear-gradient(90deg, #f0b429, #ffe066)'
                            : 'linear-gradient(90deg, #4eca6a, #b8f0c5)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Status text */}
                  <div className="flex justify-between w-full mt-1 px-0.5">
                    <span
                      className="text-[9px] font-bold"
                      style={{ color: isReady ? '#d49a1a' : '#2d8a4e' }}
                    >
                      {isReady ? 'Thu hoạch!' : `${percent}%`}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground">
                      {isReady ? '' : countdown}
                    </span>
                  </div>

                  {/* Happiness */}
                  <span className="text-[9px] font-semibold text-muted-foreground mt-0.5">
                    ❤️ {plot.happiness}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="relative z-10 px-5 pb-8 pt-3 space-y-3">
        <div className="flex gap-3">
          <button
            onClick={handleWater}
            disabled={interact.isPending}
            className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #3498db, #74b9ff)',
              boxShadow: '0 4px 15px rgba(52,152,219,0.3)',
            }}
          >
            {interact.isPending ? '...' : '💧 Tưới (+5)'}
          </button>
          <button
            onClick={handleLike}
            disabled={interact.isPending}
            className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #e74c3c, #ff6b6b)',
              boxShadow: '0 4px 15px rgba(231,76,60,0.3)',
            }}
          >
            {interact.isPending ? '...' : '❤️ Thích (+5)'}
          </button>
        </div>
        {/* Phase 2: Gift & Comment buttons */}
        {/* <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-xl ..." disabled>🎁 Tặng quà (Sắp có)</button>
          <button className="flex-1 py-3 rounded-xl ..." disabled>💬 Bình luận (Sắp có)</button>
        </div> */}
      </div>
    </div>
  );
}
