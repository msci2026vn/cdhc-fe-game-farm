import { useState } from 'react';
import { useLeaderboard } from '@/shared/hooks/useLeaderboard';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';
import { useQueryClient } from '@tanstack/react-query';
import { playSound } from '@/shared/audio';

type Tab = 'ogn' | 'xp' | 'level' | 'harvests';

interface LeaderboardProps {
  open: boolean;
  onClose: () => void;
}

function Avatar({ picture, name, size = 10, className = '' }: { picture?: string | null; name?: string | null; size?: number; className?: string }) {
  const initials = (name ?? '?').charAt(0).toUpperCase();
  if (picture) {
    return (
      <img
        src={picture}
        alt={name ?? ''}
        className={`w-${size} h-${size} rounded-full object-cover ${className}`}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center font-bold text-white ${className}`}
      style={{ background: 'linear-gradient(135deg, #f0b429, #e67e22)', fontSize: size > 10 ? 18 : 13 }}>
      {initials}
    </div>
  );
}

export default function Leaderboard({ open, onClose }: LeaderboardProps) {
  const [tab, setTab] = useState<Tab>('ogn');
  const { data: profile } = usePlayerProfile();
  const { data, isLoading, refetch } = useLeaderboard(tab, 1, 50);
  const queryClient = useQueryClient();

  if (!open) return null;

  const myUserId = profile?.userId;
  const rankings = data?.rankings || [];
  const myRank = data?.myRank;
  const total = data?.total || 0;

  const top3 = rankings.slice(0, 3);

  const WEEKLY_REWARDS = [
    { rank: '🥇 Top 1', rewards: ['500 OGN', '1 Hạt giống Vàng', 'Khung avatar Huyền Thoại'], color: '#f0b429' },
    { rank: '🥈 Top 2', rewards: ['300 OGN', '1 Phân bón Cao Cấp'], color: '#95a5a6' },
    { rank: '🥉 Top 3', rewards: ['150 OGN', '1 Bình tưới Bạc'], color: '#cd7f32' },
  ];

  const now = new Date();
  const daysLeft = 7 - now.getDay();
  const hoursLeft = 23 - now.getHours();

  const getDisplayValue = (entry: (typeof rankings)[0]) =>
    tab === 'ogn' ? (entry.ogn ?? 0)
      : tab === 'xp' ? (entry.xp ?? 0)
        : tab === 'level' ? (entry.level ?? 0)
          : (entry.totalHarvests ?? 0);

  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
  const podiumHeights = [100, 130, 80];
  const podiumColors = [
    'linear-gradient(180deg, #bdc3c7, #95a5a6)',
    'linear-gradient(180deg, #f0b429, #e67e22)',
    'linear-gradient(180deg, #cd7f32, #a0522d)',
  ];
  const medals = ['🥈', '🥇', '🥉'];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[430px] rounded-t-2xl bg-white overflow-hidden animate-slide-up flex flex-col"
        style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #f0b429 0%, #e67e22 100%)' }}>
          <h3 className="font-heading text-lg font-bold text-white drop-shadow">🏆 Bảng xếp hạng</h3>
          <div className="flex gap-2 mt-3 justify-center flex-wrap">
            {([
              { key: 'ogn' as Tab, label: '🪙 OGN' },
              { key: 'xp' as Tab, label: '⭐ XP' },
              { key: 'level' as Tab, label: '🏆 Cấp' },
              { key: 'harvests' as Tab, label: '🌾 Thu hoạch' },
            ]).map((t) => (
              <button key={t.key} onClick={() => { playSound('ui_tab'); setTab(t.key); }}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
                style={{
                  background: tab === t.key ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                  color: tab === t.key ? '#e67e22' : 'white',
                  boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Top 3 Podium */}
          <div className="flex justify-center items-end gap-2 px-4 pt-6 pb-4"
            style={{ background: 'linear-gradient(180deg, #fff8eb, #fdf5ec)' }}>
            {podiumOrder.map((idx, col) => {
              const entry = top3[idx];
              if (!entry) return <div key={col} style={{ width: 90 }} />;
              const isMe = entry.userId === myUserId;
              const value = getDisplayValue(entry);
              return (
                <div key={entry.userId} className="flex flex-col items-center" style={{ width: col === 1 ? 100 : 85 }}>
                  {/* Avatar */}
                  <div className="relative mb-2">
                    {isMe && (
                      <div className="absolute -inset-1.5 rounded-full animate-pulse"
                        style={{ background: 'rgba(240,180,41,0.4)' }} />
                    )}
                    <div className={`rounded-full overflow-hidden border-4 shadow-lg flex items-center justify-center ${col === 1 ? 'w-16 h-16' : 'w-12 h-12'}`}
                      style={{ borderColor: col === 1 ? '#f0b429' : col === 0 ? '#95a5a6' : '#cd7f32' }}>
                      <Avatar picture={entry.picture} name={entry.name} size={col === 1 ? 16 : 12} />
                    </div>
                    <span className="absolute -top-2 -right-2 text-xl">{medals[col]}</span>
                    {isMe && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap border border-white shadow">
                        Bạn
                      </div>
                    )}
                  </div>
                  {/* Name */}
                  <p className={`font-heading text-[11px] font-bold truncate w-full text-center mb-1 ${isMe ? 'text-orange-600' : 'text-gray-700'}`}>
                    {entry.name}
                  </p>
                  {/* Podium bar */}
                  <div className="w-full rounded-t-lg flex flex-col items-center justify-end pb-2 shadow-md"
                    style={{ height: podiumHeights[col], background: podiumColors[col] }}>
                    <span className="text-white font-heading text-xs font-bold px-1 text-center">
                      {tab === 'level' ? `Lv.${value}` : value.toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* My rank banner (nếu ngoài top 3) */}
          {myRank && myRank > 3 && (
            <div className="mx-4 mb-3 rounded-xl p-3 flex items-center gap-3 shadow-sm border-2"
              style={{ background: 'linear-gradient(135deg, #fff8eb, #ffefd5)', borderColor: '#f0b429' }}>
              <span className="font-heading text-sm font-bold text-orange-500 w-8 text-center">#{myRank}</span>
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-400 flex-shrink-0">
                <Avatar picture={profile?.picture} name={profile?.name} size={10} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm font-bold text-orange-700 truncate">{profile?.name} <span className="text-orange-400 font-normal text-xs">(Bạn)</span></p>
                <p className="text-[10px] text-gray-500">Hạng của bạn trong tổng {total} người</p>
              </div>
            </div>
          )}

          {/* Weekly rewards */}
          <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ border: '2px solid #f0e6d0' }}>
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
          <div className="pb-2">
            {isLoading ? (
              <div className="px-5 py-10 text-center text-muted-foreground">
                <div className="text-3xl mb-2 animate-bounce">🔄</div>
                <p className="text-sm font-semibold">Đang tải bảng xếp hạng...</p>
              </div>
            ) : rankings.length === 0 ? (
              <div className="px-5 py-10 text-center text-muted-foreground">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-sm font-semibold">Chưa có dữ liệu</p>
              </div>
            ) : (
              rankings.slice(3).map((entry) => {
                const isMe = entry.userId === myUserId;
                const value = getDisplayValue(entry);
                return (
                  <div key={entry.userId}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isMe ? 'sticky top-0 z-10' : ''}`}
                    style={{
                      borderBottom: '1px solid #f0ebe4',
                      background: isMe
                        ? 'linear-gradient(135deg, #fff8eb, #ffefd5)'
                        : undefined,
                      borderLeft: isMe ? '3px solid #f0b429' : '3px solid transparent',
                    }}>
                    <span className="w-7 text-center font-heading text-sm font-bold"
                      style={{ color: isMe ? '#e67e22' : '#9ca3af' }}>
                      #{entry.rank ?? '-'}
                    </span>
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0"
                      style={{ borderColor: isMe ? '#f0b429' : '#f0e6d0' }}>
                      <Avatar picture={entry.picture} name={entry.name} size={10} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-heading text-sm font-bold truncate ${isMe ? 'text-orange-600' : 'text-gray-800'}`}>
                        {entry.name} {isMe && <span className="text-orange-400 font-normal text-xs">(Bạn)</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold">Lv.{entry.level ?? 1}</p>
                    </div>
                    <span className={`font-heading text-sm font-bold ${isMe ? 'text-orange-600' : ''}`}
                      style={{ color: isMe ? '#e67e22' : '#d49a1a' }}>
                      {tab === 'ogn' && `🪙 ${value.toLocaleString('vi-VN')}`}
                      {tab === 'xp' && `⭐ ${value.toLocaleString('vi-VN')}`}
                      {tab === 'level' && `🏆 Lv.${value}`}
                      {tab === 'harvests' && `🌾 ${value}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 p-4 flex gap-2 border-t" style={{ background: '#fdf9f3' }}>
          <button onClick={() => { playSound('ui_click'); refetch(); }}
            className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform shadow-md"
            style={{ background: 'linear-gradient(135deg, #3498db, #74b9ff)' }}>
            🔄 Làm mới
          </button>
          <button onClick={() => { playSound('ui_modal_close'); onClose(); }}
            className="flex-1 py-3 rounded-xl font-heading text-sm font-bold active:scale-[0.97] transition-transform"
            style={{ background: '#f0ebe4', color: '#6b7280' }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
