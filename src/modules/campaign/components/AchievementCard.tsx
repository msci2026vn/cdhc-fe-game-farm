// ═══════════════════════════════════════════════════════════════
// AchievementCard — 4 states: claimable, in-progress, hidden, claimed
// ═══════════════════════════════════════════════════════════════

import { CATEGORY_CONFIG } from '../types/achievement.types';
import type { Achievement } from '../types/achievement.types';

interface AchievementCardProps {
  achievement: Achievement;
  onClaim: (id: number) => void;
  isClaiming: boolean;
}

export default function AchievementCard({ achievement: a, onClaim, isClaiming }: AchievementCardProps) {
  const catCfg = CATEGORY_CONFIG[a.category];
  const progress = Math.min(a.progress, a.conditionValue);
  const progressPct = (progress / a.conditionValue) * 100;
  const isClaimable = a.isUnlocked && !a.isClaimed;
  const isHiddenLocked = a.isHidden && !a.isUnlocked;

  // ─── Hidden achievement ────────────────────────────────────
  if (isHiddenLocked) {
    return (
      <div
        className="rounded-xl p-3 opacity-50"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">❓</span>
          <div className="flex-1">
            <span className="text-[13px] font-bold text-white/40">???</span>
            <span className="block text-[10px] text-white/20">Thành tựu ẩn — tiếp tục chơi!</span>
          </div>
          <span className="text-white/20">🔒</span>
        </div>
      </div>
    );
  }

  // ─── Claimed achievement ───────────────────────────────────
  if (a.isClaimed) {
    return (
      <div
        className="rounded-xl p-3 opacity-50"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{catCfg.emoji}</span>
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-bold text-white/60 truncate block">{a.name}</span>
            <span className="text-[10px] text-green-400/50">✓ Đã nhận</span>
          </div>
          <span className="text-lg">🏆</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-green-500/30 w-full" />
        </div>
      </div>
    );
  }

  // ─── Claimable or in-progress ──────────────────────────────
  return (
    <div
      className={`rounded-xl p-3.5 transition-all ${isClaimable ? 'ring-2 ring-amber-500/50' : ''}`}
      style={{
        background: isClaimable ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isClaimable ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {/* Top row */}
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="text-xl shrink-0">{catCfg.emoji}</span>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-bold text-white block truncate">{a.name}</span>
          <span className="text-[10px] text-white/40 block truncate">{a.description}</span>
        </div>
        {isClaimable ? (
          <span className="text-lg">✅</span>
        ) : (
          <span className="text-white/20">⬜</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: isClaimable
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                : 'linear-gradient(90deg, #3b82f6, #6366f1)',
            }}
          />
        </div>
        <span className="text-[10px] font-mono font-bold text-white/50 shrink-0 w-12 text-right">
          {progress}/{a.conditionValue}
        </span>
      </div>

      {/* Rewards row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-yellow-400">🏆 {a.rewardOgn} OGN</span>
          {a.rewardTitle && (
            <span className="text-purple-400">+ "{a.rewardTitle}"</span>
          )}
          {a.rewardFragmentTier && a.rewardFragmentCount && (
            <span className="text-blue-400">+ 🧩x{a.rewardFragmentCount}</span>
          )}
        </div>

        {isClaimable && (
          <button
            onClick={() => onClaim(a.id)}
            disabled={isClaiming}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            {isClaiming ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : (
              'Nhận'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
