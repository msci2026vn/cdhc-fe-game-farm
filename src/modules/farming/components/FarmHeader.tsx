import { useNavigate } from 'react-router-dom';
import { useWeatherStore } from '@/modules/farming/stores/weatherStore';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { LEVEL_CONFIG, getLevelTitle } from '@/shared/stores/playerStore';
import { AnimatedNumber } from '@/shared/components/AnimatedNumber';
import { LevelUpButton } from '@/shared/components/LevelUpButton';
import { DailyXpBar } from '@/shared/components/DailyXpBar';
import WeatherControl from './WeatherControl';

export default function FarmHeader() {
  const navigate = useNavigate();
  const weather = useWeatherStore((s) => s.weather);
  const temperature = useWeatherStore((s) => s.temperature);

  // Profile data
  const { data: profile, isLoading: isProfileLoading } = usePlayerProfile();

  // Auth data (Gmail name/picture)
  const { data: auth, isLoading: isAuthLoading } = useAuth();

  const isLoading = isProfileLoading || isAuthLoading;

  const ogn = profile?.ogn ?? 0;
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const title = getLevelTitle(level);

  // Google fallbacks - Prioritize Google data (Gmail name/picture)
  const user = auth?.user;
  const displayName = user?.name || (user as any)?.fullName || profile?.name || (profile as any)?.fullName || 'Farmer';
  const displayPicture = user?.picture || (user as any)?.avatar || (user as any)?.avatarUrl || profile?.picture || (profile as any)?.avatar || (profile as any)?.avatarUrl;

  // XP progress calculation — TIER-BASED (progressive XP per level)
  const xpInLevel = LEVEL_CONFIG.getXpInLevel(xp);
  const xpForLevelUp = LEVEL_CONFIG.getXpForLevel(xp);
  const xpPct = Math.min(100, (xpInLevel / xpForLevelUp) * 100);

  // Loading state — show skeleton while fetching profile
  if (isLoading) {
    return (
      <div className="px-5 pb-3" style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 50px)' }}>
        {/* Top row skeleton */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-[46px] h-[46px] rounded-full bg-white/20 animate-pulse" />
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
              <div className="h-3 w-16 bg-white/20 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-white/20 animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-white/20 animate-pulse" />
          </div>
        </div>
        {/* XP bar skeleton */}
        <div className="mb-3 px-1">
          <div className="flex justify-between mb-1">
            <div className="h-3 w-20 bg-white/20 rounded animate-pulse" />
            <div className="h-3 w-16 bg-white/20 rounded animate-pulse" />
          </div>
          <div className="h-2 rounded-full bg-white/20 animate-pulse" />
        </div>
        {/* Stats skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="stat-chip flex-1 animate-pulse">
              <div className="w-8 h-8 rounded-[10px] bg-white/20" />
              <div className="flex flex-col gap-1">
                <div className="h-4 w-12 bg-white/20 rounded" />
                <div className="h-2.5 w-8 bg-white/20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-3" style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 50px)' }}>
      {/* Top row: avatar + buttons */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-[46px] h-[46px] rounded-full avatar-ring overflow-hidden" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <div className="w-full h-full rounded-full bg-game-green-mid flex items-center justify-center text-[22px]">
              {displayPicture ? (
                <img
                  src={displayPicture}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                '🧑‍🌾'
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-[15px] font-bold">{displayName}</span>
            <span className="text-[11px] font-bold text-game-green-mid flex items-center gap-1">
              <span className="bg-game-green-mid text-white px-2 py-px rounded-[10px] text-[10px] font-bold">Lv.{level}</span>
              {title}
              <LevelUpButton />
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <WeatherControl />
          <button onClick={() => navigate('/points')}
            className="w-10 h-10 rounded-full header-btn-glass flex items-center justify-center text-lg transition-transform active:scale-90">
            🔔
          </button>
          <button className="w-10 h-10 rounded-full header-btn-glass flex items-center justify-center text-lg transition-transform active:scale-90">
            ⚙️
          </button>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="mb-1 px-1">
        <div className="flex justify-between text-[10px] font-bold mb-1">
          <span className="text-game-green-mid">XP: {xpInLevel}/{xpForLevelUp}</span>
          <span className="text-muted-foreground">Lv.{level} &rarr; Lv.{level + 1}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${xpPct}%`,
              background: 'linear-gradient(90deg, #00b894, #55efc4)',
              transition: 'width 0.8s ease-out',
            }}
          />
        </div>
      </div>

      {/* Daily XP progress bar */}
      <div className="mb-3">
        <DailyXpBar />
      </div>

      {/* Stats bar */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="stat-chip flex-1">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-base"
              style={{ background: 'linear-gradient(135deg, #fff8dc, #ffe066)' }}>
              🪙
            </div>
            <div>
              <div className="font-heading text-base font-bold">
                <AnimatedNumber value={ogn} />
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground">OGN</div>
            </div>
          </div>
          <div className="stat-chip flex-1">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-base"
              style={{ background: 'linear-gradient(135deg, #ffe0e0, #ffb3b3)' }}>
              🌡️
            </div>
            <div>
              <div className="font-heading text-base font-bold">{Math.round(temperature)}°C</div>
              <div className="text-[10px] font-semibold text-muted-foreground">Farm</div>
            </div>
          </div>
          <div className="stat-chip flex-1">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-base"
              style={{ background: 'linear-gradient(135deg, #d4f1ff, #87ceeb)' }}>
              ⚡
            </div>
            <div>
              <div className="font-heading text-base font-bold">8/10</div>
              <div className="text-[10px] font-semibold text-muted-foreground">Energy</div>
            </div>
          </div>
        </div>

        {/* Sync Info - Subtle line at bottom of header */}
        <div className="flex justify-between items-center px-1 opacity-50">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-game-green-mid animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-tight text-game-green-dark">Syncing Live</span>
          </div>
          <span className="text-[9px] font-bold text-muted-foreground">
            {new Date(useWeatherStore.getState().lastUpdated).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
