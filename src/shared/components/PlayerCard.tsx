import { usePlayerProfile, useOgn } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { LEVEL_CONFIG, getLevelTitle, getLevelIcon } from '@/shared/stores/playerStore';
import { AnimatedNumber } from '@/shared/components/AnimatedNumber';
import { useTranslation } from 'react-i18next';

interface PlayerCardProps {
  compact?: boolean;
}

export default function PlayerCard({ compact }: PlayerCardProps) {
  const { t } = useTranslation();
  const { data: profile, isLoading: isProfileLoading } = usePlayerProfile();
  const { data: auth, isLoading: isAuthLoading } = useAuth();
  const ogn = useOgn();

  const isLoading = isProfileLoading || isAuthLoading;

  if (isLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 border-2 border-[#d4c5a3] shadow-sm animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#d4c5a3]/40" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-[#d4c5a3]/40 rounded" />
            <div className="h-3 w-16 bg-[#d4c5a3]/40 rounded" />
            <div className="h-2 w-full bg-[#d4c5a3]/40 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const level = profile.level ?? 1;
  const xp = profile.xp ?? 0;
  const title = getLevelTitle(level);
  const icon = getLevelIcon(level);

  const user = auth?.user;
  const displayName = user?.name || (user as any)?.fullName || profile.name || (profile as any)?.fullName || t('farmer');
  const displayPicture = user?.picture || (user as any)?.avatar || (user as any)?.avatarUrl || profile.picture || (profile as any)?.avatar || (profile as any)?.avatarUrl;

  const xpInLevel = LEVEL_CONFIG.getXpInLevel(xp);
  const xpForLevelUp = LEVEL_CONFIG.getXpForLevel(xp);
  const xpPct = Math.min(100, (xpInLevel / xpForLevelUp) * 100);

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 border-2 border-[#d4c5a3] shadow-sm">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-xl bg-[#f4e4bc] border-2 border-[#8B4513] shadow-sm overflow-hidden flex items-center justify-center text-xl">
            {displayPicture ? (
              <img src={displayPicture} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              '🧑‍🌾'
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#2d6a4f] text-white text-[7px] px-1 py-px rounded-full font-bold border border-white shadow-sm">
            Lv.{level}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-heading font-bold text-sm text-[#5D4037] truncate">{displayName}</span>
            <span className="text-xs">{icon}</span>
          </div>
          <div className="text-[10px] font-bold text-[#2d6a4f] mb-1.5">{title}</div>

          {/* XP Bar */}
          {!compact && (
            <div>
              <div className="h-2 rounded-full overflow-hidden bg-black/8 border border-black/5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${xpPct}%`,
                    background: 'linear-gradient(90deg, #00b894, #55efc4)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-0.5 text-[8px] font-bold text-[#5D4037]/60">
                <span>{xpInLevel}/{xpForLevelUp} XP</span>
                <span>Lv.{level} → Lv.{Math.min(level + 1, 100)}</span>
              </div>
            </div>
          )}
        </div>

        {/* OGN */}
        <div className="shrink-0 bg-[#fff8dc] border border-[#e9c46a] rounded-xl px-2.5 py-1.5 text-center shadow-sm">
          <div className="flex justify-center mb-1">
            <img src="/icons/ogn_coin.png" alt="coin" className="w-3.5 h-3.5 object-contain" />
          </div>
          <div className="font-heading font-bold text-xs text-[#5D4037] leading-tight">
            <AnimatedNumber value={ogn} />
          </div>
          <div className="text-[7px] font-bold text-[#8B4513]/60 uppercase">OGN</div>
        </div>
      </div>
    </div>
  );
}
