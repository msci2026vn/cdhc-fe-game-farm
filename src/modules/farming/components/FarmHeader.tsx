import { useNavigate } from 'react-router-dom';
import { useWeatherStore } from '@/modules/farming/stores/weatherStore';
import { useOgn, useXp, useLevel } from '@/shared/hooks/usePlayerProfile';
import { xpForNextLevel, getLevelTitle } from '@/shared/stores/playerStore';
import WeatherControl from './WeatherControl';

export default function FarmHeader() {
  const navigate = useNavigate();
  const ogn = useOgn(); // TanStack Query single source of truth
  const weather = useWeatherStore((s) => s.weather);
  const level = useLevel();
  const xp = useXp();
  const nextXp = xpForNextLevel(level);
  const xpPct = nextXp > 0 ? Math.min(100, Math.round((xp / nextXp) * 100)) : 100;
  const title = getLevelTitle(level);

  return (
    <div className="px-5 pb-3" style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 50px)' }}>
      {/* Top row: avatar + buttons */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-[46px] h-[46px] rounded-full avatar-ring" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <div className="w-full h-full rounded-full bg-game-green-mid flex items-center justify-center text-[22px]">
              🧑‍🌾
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-[15px] font-bold">Farmer Minh</span>
            <span className="text-[11px] font-bold text-game-green-mid flex items-center gap-1">
              <span className="bg-game-green-mid text-white px-2 py-px rounded-[10px] text-[10px] font-bold">Lv.{level}</span>
              {title}
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
      <div className="mb-3 px-1">
        <div className="flex justify-between text-[10px] font-bold mb-1">
          <span className="text-game-green-mid">⭐ XP: {xp}/{nextXp}</span>
          <span className="text-muted-foreground">Lv.{level} → Lv.{level + 1}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg, #00b894, #55efc4)' }} />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2">
        <div className="stat-chip flex-1">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg, #fff8dc, #ffe066)' }}>
            🪙
          </div>
          <div>
            <div className="font-heading text-base font-bold">{ogn.toLocaleString('vi-VN')}</div>
            <div className="text-[10px] font-semibold text-muted-foreground">OGN</div>
          </div>
        </div>
        <div className="stat-chip flex-1">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg, #ffe0e0, #ffb3b3)' }}>
            🌡️
          </div>
          <div>
            <div className="font-heading text-base font-bold">28°C</div>
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
    </div>
  );
}
