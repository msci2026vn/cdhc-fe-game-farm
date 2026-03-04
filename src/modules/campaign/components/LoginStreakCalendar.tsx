// ═══════════════════════════════════════════════════════════════
// LoginStreakCalendar — 28-day grid with milestones
// ═══════════════════════════════════════════════════════════════

import type { LoginStreak } from '../types/achievement.types';
import { STREAK_MILESTONES, DAILY_OGN } from '../types/achievement.types';

interface LoginStreakCalendarProps {
  streak: LoginStreak;
}

const MILESTONE_DAYS = new Set(STREAK_MILESTONES.map(m => m.day));

export default function LoginStreakCalendar({ streak }: LoginStreakCalendarProps) {
  const { currentStreak, longestStreak, monthlyDay, milestones, todayReward } = streak;

  // Build 28-day grid: 4 rows x 7 cols
  const days = Array.from({ length: 28 }, (_, i) => {
    const dayNum = i + 1;
    const milestone = milestones.find(m => m.day === dayNum);
    const isMilestoneDay = MILESTONE_DAYS.has(dayNum);
    const isPast = dayNum < monthlyDay;
    const isToday = dayNum === monthlyDay;
    const isFuture = dayNum > monthlyDay;
    const isClaimed = milestone?.isClaimed ?? isPast; // past days assumed claimed if not milestone
    const streakMilestone = STREAK_MILESTONES.find(m => m.day === dayNum);
    const ognReward = streakMilestone?.ogn ?? DAILY_OGN;

    return {
      dayNum,
      isPast,
      isToday,
      isFuture,
      isClaimed: isPast || (milestone?.isClaimed ?? false),
      isMilestoneDay,
      ognReward,
      fragment: streakMilestone?.fragment,
      title: streakMilestone && 'title' in streakMilestone ? (streakMilestone as any).title : undefined,
    };
  });

  return (
    <div className="space-y-4">
      {/* Streak info */}
      <div className="flex items-center justify-between px-1">
        <div className="text-center">
          <div className="text-2xl mb-0.5">🔥</div>
          <div className="text-lg font-bold text-amber-400">{currentStreak}</div>
          <div className="text-[9px] text-white/40">Liên tiếp</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-0.5">📅</div>
          <div className="text-lg font-bold text-white">Ngay {monthlyDay}</div>
          <div className="text-[9px] text-white/40">Tháng này</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-0.5">🏆</div>
          <div className="text-lg font-bold text-purple-400">{longestStreak}</div>
          <div className="text-[9px] text-white/40">Kỷ lục</div>
        </div>
      </div>

      {/* 28-day grid: 4 rows x 7 cols */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(day => {
          const isDay28 = day.dayNum === 28;

          let bgColor = 'rgba(255,255,255,0.03)';
          let borderColor = 'rgba(255,255,255,0.06)';
          let textColor = 'text-white/30';
          let icon = '';

          if (day.isToday) {
            bgColor = 'rgba(245,158,11,0.15)';
            borderColor = 'rgba(245,158,11,0.5)';
            textColor = 'text-amber-400';
            icon = '🔥';
          } else if (day.isPast && day.isClaimed) {
            bgColor = 'rgba(34,197,94,0.1)';
            borderColor = 'rgba(34,197,94,0.3)';
            textColor = 'text-green-400';
            icon = '✅';
          } else if (day.isMilestoneDay && day.isFuture) {
            bgColor = 'rgba(168,85,247,0.1)';
            borderColor = 'rgba(168,85,247,0.3)';
            textColor = 'text-purple-400';
            icon = isDay28 ? '👑' : '🎁';
          }

          return (
            <div
              key={day.dayNum}
              className={`relative rounded-lg p-1 flex flex-col items-center justify-center min-h-[52px] transition-all ${
                day.isToday ? 'animate-pulse' : ''
              }`}
              style={{ background: bgColor, border: `1.5px solid ${borderColor}` }}
            >
              {/* Day label */}
              <span className={`text-[8px] font-bold ${textColor}`}>
                D{day.dayNum}
              </span>

              {/* Icon or empty */}
              {icon ? (
                <span className="text-sm">{icon}</span>
              ) : (
                <span className="text-sm opacity-20">{'  '}</span>
              )}

              {/* OGN reward */}
              <span className={`text-[7px] font-bold ${
                day.isMilestoneDay ? 'text-yellow-400' : 'text-white/20'
              }`}>
                {day.ognReward}
              </span>

              {/* Fragment indicator */}
              {day.fragment && (
                <span className="absolute -top-1 -right-1 text-[8px]">🧩</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Today's reward */}
      <div
        className="rounded-xl p-3 text-center"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
      >
        {todayReward ? (
          <div className="text-[12px]">
            <span className="text-white/50">Hôm nay:</span>
            <span className="font-bold text-yellow-400">+{todayReward.ogn} OGN</span>
            {todayReward.fragment && (
              <span className="text-purple-400 ml-1">+ 🧩</span>
            )}
            <span className="ml-2 text-green-400 text-[10px]">✅ Đã nhận</span>
          </div>
        ) : (
          <div className="text-[12px] text-white/40">
            Đăng nhập mỗi ngày để nhận thưởng!
          </div>
        )}
      </div>

      {/* Milestone legend */}
      <div className="space-y-1 px-1">
        <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold mb-1">Mốc thưởng</div>
        {STREAK_MILESTONES.map(m => (
          <div key={m.day} className="flex items-center gap-2 text-[10px]">
            <span className="text-white/20 w-6 text-right">D{m.day}</span>
            <span className="text-yellow-400 font-bold">{m.ogn} OGN</span>
            {m.fragment && (
              <span className="text-purple-400">+ 🧩 {m.fragment.tier} x{m.fragment.count}</span>
            )}
            {'title' in m && m.title && (
              <span className="text-amber-400">+ "{m.title}"</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
