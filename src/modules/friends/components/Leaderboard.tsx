import { useState } from 'react';
import { FRIENDS, Friend } from '../data/friends';
import { useFarmStore } from '@/modules/farming/stores/farmStore';

type Tab = 'ogn' | 'harvest';

interface LeaderboardProps {
  open: boolean;
  onClose: () => void;
}

export default function Leaderboard({ open, onClose }: LeaderboardProps) {
  const [tab, setTab] = useState<Tab>('ogn');
  const myOgn = useFarmStore((s) => s.ogn);

  if (!open) return null;

  const me: Friend = {
    id: 'me', name: 'Bạn', avatar: '🧑', level: 5, title: 'Nông dân', online: true,
    plant: { emoji: '🍅', name: '', growthPct: 0, stage: '', happiness: 0 },
    stats: { ogn: myOgn, totalHarvest: 12, daysActive: 14 },
  };

  const all = [...FRIENDS, me];
  const sorted = [...all].sort((a, b) =>
    tab === 'ogn' ? b.stats.ogn - a.stats.ogn : b.stats.totalHarvest - a.stats.totalHarvest
  );

  const medals = ['🥇', '🥈', '🥉'];

  const WEEKLY_REWARDS = [
    { rank: '🥇 Top 1', rewards: ['500 OGN', '1 Hạt giống Vàng', 'Khung avatar Huyền Thoại'], color: '#f0b429' },
    { rank: '🥈 Top 2', rewards: ['300 OGN', '1 Phân bón Cao Cấp'], color: '#95a5a6' },
    { rank: '🥉 Top 3', rewards: ['150 OGN', '1 Bình tưới Bạc'], color: '#cd7f32' },
  ];

  // Mock countdown to end of week (Sunday)
  const now = new Date();
  const daysLeft = 7 - now.getDay();
  const hoursLeft = 23 - now.getHours();

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[430px] rounded-t-2xl bg-white overflow-hidden animate-slide-up"
        style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="px-5 py-4 text-center"
          style={{ background: 'linear-gradient(135deg, #f0b429, #e67e22)' }}>
          <h3 className="font-heading text-lg font-bold text-white">🏆 Bảng xếp hạng</h3>
          <div className="flex gap-2 mt-3 justify-center">
            {([
              { key: 'ogn' as Tab, label: '🪙 OGN' },
              { key: 'harvest' as Tab, label: '🌾 Thu hoạch' },
            ]).map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: tab === t.key ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                  color: tab === t.key ? '#e67e22' : 'white',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 podium */}
        <div className="flex justify-center items-end gap-3 px-5 py-5"
          style={{ background: 'linear-gradient(180deg, #fff8eb, white)' }}>
          {[1, 0, 2].map((rank) => {
            const friend = sorted[rank];
            if (!friend) return null;
            const isMe = friend.id === 'me';
            const heights = [120, 90, 70];
            return (
              <div key={rank} className="flex flex-col items-center" style={{ width: 90 }}>
                <div className="relative mb-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${isMe ? 'ring-2 ring-primary' : ''}`}
                    style={{ background: 'rgba(240,180,41,0.15)' }}>
                    {friend.avatar}
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 text-lg">{medals[rank]}</span>
                </div>
                <p className={`font-heading text-[11px] font-bold truncate w-full text-center ${isMe ? 'text-primary' : ''}`}>
                  {friend.name}
                </p>
                <div className="w-full rounded-t-lg mt-1 flex items-end justify-center"
                  style={{
                    height: heights[rank],
                    background: rank === 0
                      ? 'linear-gradient(180deg, #f0b429, #e67e22)'
                      : rank === 1
                        ? 'linear-gradient(180deg, #bdc3c7, #95a5a6)'
                        : 'linear-gradient(180deg, #cd7f32, #a0522d)',
                  }}>
                  <span className="text-white font-heading text-sm font-bold pb-2">
                    {tab === 'ogn' ? (friend.stats.ogn || 0).toLocaleString('vi-VN') : friend.stats.totalHarvest}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly rewards section */}
        <div className="mx-4 mt-1 mb-3 rounded-2xl overflow-hidden" style={{ border: '2px solid #f0e6d0' }}>
          <div className="px-4 py-2.5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #fff8eb, #ffefd5)' }}>
            <span className="font-heading text-xs font-bold" style={{ color: '#e67e22' }}>
              🎁 Phần thưởng tuần này
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }}>
              ⏰ {daysLeft}d {hoursLeft}h
            </span>
          </div>
          <div className="bg-white divide-y" style={{ borderColor: '#f5f0e8' }}>
            {WEEKLY_REWARDS.map((r, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <span className="font-heading text-xs font-bold whitespace-nowrap mt-0.5" style={{ color: r.color, minWidth: 52 }}>
                  {r.rank}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {r.rewards.map((reward, j) => (
                    <span key={j} className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: '#f9f5ee', color: '#8b6914' }}>
                      {reward}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rest of list */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 480px)' }}>
          {sorted.slice(3).map((friend, i) => {
            const isMe = friend.id === 'me';
            return (
              <div key={friend.id}
                className={`flex items-center gap-3 px-5 py-3 ${isMe ? 'bg-primary/5' : ''}`}
                style={{ borderBottom: '1px solid #f0ebe4' }}>
                <span className="w-7 text-center font-heading text-sm font-bold text-muted-foreground">
                  {i + 4}
                </span>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ background: 'rgba(240,180,41,0.1)' }}>
                  {friend.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-heading text-sm font-bold truncate ${isMe ? 'text-primary' : ''}`}>
                    {friend.name} {isMe && '(Bạn)'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    Lv.{friend.level} · {friend.title}
                  </p>
                </div>
                <span className="font-heading text-sm font-bold" style={{ color: '#d49a1a' }}>
                  {tab === 'ogn' ? `🪙 ${(friend.stats.ogn || 0).toLocaleString('vi-VN')}` : `🌾 ${friend.stats.totalHarvest}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Close */}
        <div className="p-4">
          <button onClick={onClose}
            className="w-full py-3 rounded-xl font-heading text-sm font-bold text-muted-foreground bg-muted active:scale-[0.97] transition-transform">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
