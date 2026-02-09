import { useMemo } from 'react';
import BottomNav from '@/shared/components/BottomNav';

const GEM_TYPES = [
  { type: 'atk', emoji: '⚔️', css: 'gem-atk' },
  { type: 'hp', emoji: '💚', css: 'gem-hp' },
  { type: 'def', emoji: '🛡️', css: 'gem-def' },
  { type: 'star', emoji: '⭐', css: 'gem-star' },
] as const;

export default function BossScreen() {
  const gems = useMemo(() =>
    Array.from({ length: 36 }, () => GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)]),
  []);

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative boss-gradient flex flex-col">
      {/* Top half: Boss arena */}
      <div className="flex-[0_0_50%] pt-[50px] px-5 pb-2 flex flex-col relative overflow-hidden">
        {/* Radial effects */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 50% 60%, rgba(231,76,60,0.15) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(142,68,173,0.1) 0%, transparent 40%)'
        }} />

        {/* Header */}
        <div className="flex justify-between items-center mb-2 z-10">
          <div className="animate-event-pulse px-3 py-1 rounded-[20px] text-[11px] font-bold flex items-center gap-1.5"
            style={{ background: 'rgba(231,76,60,0.2)', border: '1px solid rgba(231,76,60,0.4)', color: '#ff6b6b' }}>
            🔴 LIVE — DePIN Event
          </div>
          <span className="font-heading text-sm font-semibold text-white/70">⏱ 14:32</span>
        </div>

        {/* Boss name + HP */}
        <div className="z-10 mb-2">
          <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2 mb-1.5">
            <span className="text-xl">💀</span> Rồng Lửa Đại Hạn
          </h2>
          <div className="w-full h-5 rounded-xl overflow-hidden relative"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-xl relative boss-hp-glow" style={{ width: '63%', background: 'linear-gradient(90deg, #e74c3c, #ff6b6b)' }}>
              <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)' }} />
            </div>
            <span className="absolute inset-0 flex items-center justify-center font-heading text-[11px] font-bold text-white text-shadow-sm">
              6,300 / 10,000 HP
            </span>
          </div>
        </div>

        {/* Boss sprite */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          <span className="text-[100px] animate-boss-idle" style={{ filter: 'drop-shadow(0 0 30px rgba(231,76,60,0.5))' }}>
            🐲
          </span>
          <span className="absolute top-[20%] right-[25%] font-heading text-2xl font-bold animate-damage-float text-shadow-sm"
            style={{ color: '#ffe066' }}>-128</span>
          <span className="absolute top-[30%] right-[20%] font-heading text-lg font-bold animate-damage-float text-shadow-sm"
            style={{ color: '#ff6b6b', animationDelay: '0.5s' }}>-64</span>
          <span className="absolute top-[50%] left-[15%] font-heading text-xl font-bold animate-damage-float text-shadow-sm"
            style={{ color: '#74b9ff', animationDelay: '1s' }}>+32</span>
        </div>

        {/* Mini leaderboard */}
        <div className="z-10 mt-1 rounded-lg p-2 px-3"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">🏆 Top Damage</div>
          {[
            { rank: '1', name: 'CryptoFarmer', dmg: '2,450', bg: 'linear-gradient(135deg, #f0b429, #d49a1a)' },
            { rank: '2', name: 'GreenHero92', dmg: '1,820', bg: 'linear-gradient(135deg, #c0c0c0, #808080)' },
            { rank: '3', name: 'Farmer Minh ⭐', dmg: '1,540', bg: 'linear-gradient(135deg, #cd7f32, #8b5e34)' },
          ].map((r) => (
            <div key={r.rank} className="flex items-center gap-2 py-1">
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white"
                style={{ background: r.bg }}>{r.rank}</span>
              <span className="flex-1 text-xs text-white/80 font-semibold">{r.name}</span>
              <span className="font-heading text-xs font-bold" style={{ color: '#ffe066' }}>{r.dmg} DMG</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom half: Match-3 */}
      <div className="flex-[0_0_50%] rounded-t-2xl px-4 pt-4 pb-[80px] flex flex-col"
        style={{ background: 'rgba(0,0,0,0.3)' }}>
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.2)' }} />

        {/* Player stats */}
        <div className="flex gap-2 mb-2.5">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-bold mb-1" style={{ color: '#55efc4' }}>
              <span>❤️ HP</span><span>750/1000</span>
            </div>
            <div className="h-2.5 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-md" style={{ width: '75%', background: 'linear-gradient(90deg, #00b894, #55efc4)', boxShadow: '0 0 8px rgba(85,239,196,0.3)' }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-bold mb-1" style={{ color: '#74b9ff' }}>
              <span>🛡️ Shield</span><span>200</span>
            </div>
            <div className="h-2.5 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-md" style={{ width: '40%', background: 'linear-gradient(90deg, #0984e3, #74b9ff)', boxShadow: '0 0 8px rgba(116,185,255,0.3)' }} />
            </div>
          </div>
        </div>

        {/* Gem grid */}
        <div className="grid grid-cols-6 gap-1.5 p-1.5 rounded-lg flex-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {gems.map((gem, i) => (
            <div key={i}
              className={`aspect-square rounded-[10px] flex items-center justify-center text-[22px] cursor-pointer relative gem-shine transition-transform active:scale-[0.88] ${gem.css}`}>
              {gem.emoji}
            </div>
          ))}
        </div>

        {/* Ultimate bar */}
        <div className="flex items-center gap-2.5 mt-2">
          <div className="flex-1 h-2 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded ult-gradient" style={{ width: '72%' }} />
          </div>
          <button className="px-4 py-2 rounded-[20px] text-white font-heading text-xs font-bold opacity-50 ult-btn-gradient">
            ⚡ ULTIMATE
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
