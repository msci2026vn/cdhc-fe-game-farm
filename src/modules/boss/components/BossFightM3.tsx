import { useEffect, useRef } from 'react';
import BottomNav from '@/shared/components/BottomNav';
import { useMatch3 } from '../hooks/useMatch3';
import { BossInfo } from '../data/bosses';
import { useFarmStore } from '@/modules/farming/stores/farmStore';
import { useBossProgressStore } from '../stores/bossProgressStore';

interface Props {
  boss: BossInfo;
  onBack: () => void;
}

export default function BossFightM3({ boss: bossInfo, onBack }: Props) {
  const {
    grid, selected, animating, matchedCells, combo, showCombo, boss, popups,
    handleTap, GEM_META, getComboInfo, bossAttackMsg, screenShake,
    result, totalDmgDealt, attackWarning, handleDodge, fireUltimate, ultActive,
  } = useMatch3(bossInfo);

  const addOgn = useFarmStore(s => s.addOgn);
  const addKill = useBossProgressStore(s => s.addKill);
  const addDmg = useBossProgressStore(s => s.addDmg);
  const rewardedRef = useRef(false);

  // Give reward on victory
  useEffect(() => {
    if (result === 'victory' && !rewardedRef.current) {
      rewardedRef.current = true;
      addOgn(bossInfo.reward);
      addKill(bossInfo.id);
      addDmg(totalDmgDealt);
    }
  }, [result, bossInfo, addOgn, addKill, addDmg, totalDmgDealt]);

  const bossHpPct = Math.round((boss.bossHp / boss.bossMaxHp) * 100);
  const playerHpPct = Math.round((boss.playerHp / boss.playerMaxHp) * 100);
  const shieldPct = Math.min(100, Math.round((boss.shield / 500) * 100));
  const ultReady = boss.ultCharge >= 100;
  const comboInfo = getComboInfo(combo);

  // Victory / Defeat overlay
  if (result !== 'fighting') {
    const won = result === 'victory';
    return (
      <div className="min-h-screen max-w-[430px] mx-auto boss-gradient flex flex-col items-center justify-center px-8">
        <div className="animate-scale-in text-center">
          <div className="text-[80px] mb-4">{won ? '🏆' : '💀'}</div>
          <h2 className="font-heading text-2xl font-bold text-white mb-2">
            {won ? 'Chiến thắng!' : 'Thất bại!'}
          </h2>
          <p className="text-white/60 text-sm mb-1">
            {won ? `Đã tiêu diệt ${bossInfo.name}!` : `${bossInfo.name} đã đánh bại bạn!`}
          </p>
          <div className="flex items-center justify-center gap-4 my-4 text-sm font-bold">
            <span style={{ color: '#ff6b6b' }}>⚔️ {totalDmgDealt.toLocaleString()} DMG</span>
            {won && <span style={{ color: '#fdcb6e' }}>🪙 +{bossInfo.reward} OGN</span>}
          </div>
          {won && (
            <div className="px-5 py-3 rounded-xl mb-6 animate-fade-in"
              style={{ background: 'rgba(240,180,41,0.15)', border: '1px solid rgba(240,180,41,0.3)' }}>
              <span className="text-2xl">🪙</span>
              <span className="font-heading text-xl font-bold ml-2" style={{ color: '#d49a1a' }}>+{bossInfo.reward} OGN</span>
            </div>
          )}
          <button onClick={onBack}
            className="w-full py-4 rounded-lg btn-green text-white font-heading text-base font-bold active:scale-[0.97] transition-transform">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen max-w-[430px] mx-auto relative boss-gradient flex flex-col ${screenShake ? 'animate-screen-shake' : ''}`}>
      {/* Ultimate fullscreen flash */}
      {ultActive && (
        <div className="absolute inset-0 z-50 pointer-events-none animate-fade-in">
          <div className="absolute inset-0" style={{ background: 'rgba(108,92,231,0.25)' }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-scale-in">
            <div className="text-6xl mb-2 text-center">⚡</div>
            <div className="px-6 py-3 rounded-2xl font-heading text-lg font-bold text-white text-center"
              style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', boxShadow: '0 0 60px rgba(108,92,231,0.8)' }}>
              ULTIMATE!
            </div>
          </div>
        </div>
      )}

      {/* Boss attack flash */}
      {bossAttackMsg && !ultActive && (
        <div className="absolute inset-0 z-50 pointer-events-none animate-fade-in">
          <div className="absolute inset-0" style={{ background: bossAttackMsg.emoji === '💨' ? 'rgba(85,239,196,0.1)' : 'rgba(231,76,60,0.15)' }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="px-6 py-3 rounded-2xl font-heading font-bold text-white text-center animate-scale-in"
              style={{ background: bossAttackMsg.emoji === '💨' ? 'rgba(85,239,196,0.9)' : 'rgba(231,76,60,0.9)', boxShadow: '0 0 40px rgba(231,76,60,0.6)' }}>
              <span className="text-3xl block mb-1">{bossAttackMsg.emoji}</span>
              <span className="text-sm">{bossAttackMsg.text}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dodge warning overlay */}
      {attackWarning && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          <div className="absolute inset-0" style={{
            background: attackWarning.phase === 'warning'
              ? 'rgba(243,156,18,0.08)'
              : 'rgba(231,76,60,0.12)',
            animation: 'pulse 0.5s ease-in-out infinite',
          }} />
          {/* Warning text at top */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
            <div className={`px-4 py-2 rounded-full font-heading text-sm font-bold text-center ${
              attackWarning.phase === 'dodge_window' ? 'animate-pulse' : ''
            }`} style={{
              background: attackWarning.phase === 'warning'
                ? 'rgba(243,156,18,0.9)'
                : 'rgba(231,76,60,0.95)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(231,76,60,0.5)',
            }}>
              {attackWarning.phase === 'warning'
                ? `⚠️ ${attackWarning.skill?.name || 'Boss'} sắp tấn công!`
                : '🏃 BẤM NÉ NGAY!'}
            </div>
          </div>
        </div>
      )}

      {/* Top half: Boss arena */}
      <div className="flex-[0_0_46%] pt-safe px-5 pb-2 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 50% 60%, rgba(231,76,60,0.15) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(142,68,173,0.1) 0%, transparent 40%)'
        }} />

        {/* Header */}
        <div className="flex justify-between items-center mb-2 z-10">
          <button onClick={onBack} className="text-white/50 text-sm font-bold active:scale-95">← Thoát</button>
          <div className="animate-event-pulse px-3 py-1 rounded-[20px] text-[11px] font-bold flex items-center gap-1.5"
            style={{ background: 'rgba(231,76,60,0.2)', border: '1px solid rgba(231,76,60,0.4)', color: '#ff6b6b' }}>
            🔴 LIVE — DePIN Event
          </div>
        </div>

        {/* Boss name + HP */}
        <div className="z-10 mb-2">
          <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2 mb-1.5">
            <span className="text-xl">{bossInfo.emoji}</span> {bossInfo.name}
          </h2>
          <div className="w-full h-5 rounded-xl overflow-hidden relative"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-xl relative boss-hp-glow transition-all duration-500"
              style={{ width: `${bossHpPct}%`, background: 'linear-gradient(90deg, #e74c3c, #ff6b6b)' }}>
              <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)' }} />
            </div>
            <span className="absolute inset-0 flex items-center justify-center font-heading text-[11px] font-bold text-white text-shadow-sm">
              {boss.bossHp.toLocaleString()} / {boss.bossMaxHp.toLocaleString()} HP
            </span>
          </div>
        </div>

        {/* Boss sprite + damage popups */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          <span className={`text-[80px] animate-boss-idle ${boss.bossHp <= 0 ? 'opacity-30 grayscale' : ''} ${
            attackWarning?.phase === 'dodge_window' ? 'animate-screen-shake' : ''
          }`} style={{ filter: 'drop-shadow(0 0 30px rgba(231,76,60,0.5))' }}>
            {bossInfo.emoji}
          </span>
          {popups.map(p => (
            <span key={p.id}
              className="absolute font-heading text-2xl font-bold animate-damage-float text-shadow-sm pointer-events-none"
              style={{ color: p.color, left: `${p.x}%`, top: `${p.y}%` }}>
              {p.text}
            </span>
          ))}
          {showCombo && combo >= 2 && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-scale-in pointer-events-none z-20">
              <div className="px-4 py-1.5 rounded-full font-heading font-bold text-white text-center"
                style={{
                  background: combo >= 5 ? 'linear-gradient(135deg, #e056fd, #f0932b)' :
                    combo >= 4 ? 'linear-gradient(135deg, #e74c3c, #fd79a8)' :
                    combo >= 3 ? 'linear-gradient(135deg, #f39c12, #e74c3c)' :
                    'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                  boxShadow: `0 0 20px ${comboInfo.color}80`,
                }}>
                <span className="text-lg">{combo >= 6 ? '🔥' : '💥'} {comboInfo.label} x{combo}</span>
                <span className="block text-[10px] text-white/80">DMG ×{comboInfo.mult}</span>
              </div>
            </div>
          )}
        </div>

        {/* Mini leaderboard */}
        <div className="z-10 mt-1 rounded-lg p-2 px-3"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">🏆 Top Damage</div>
          {[
            { rank: '1', name: 'CryptoFarmer', dmg: '2,450', bg: 'linear-gradient(135deg, #f0b429, #d49a1a)' },
            { rank: '2', name: 'GreenHero92', dmg: '1,820', bg: 'linear-gradient(135deg, #c0c0c0, #808080)' },
            { rank: '3', name: 'Farmer Minh ⭐', dmg: '1,540', bg: 'linear-gradient(135deg, #cd7f32, #8b5e34)' },
          ].map(r => (
            <div key={r.rank} className="flex items-center gap-2 py-1">
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white"
                style={{ background: r.bg }}>{r.rank}</span>
              <span className="flex-1 text-xs text-white/80 font-semibold">{r.name}</span>
              <span className="font-heading text-xs font-bold" style={{ color: '#ffe066' }}>{r.dmg} DMG</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom half: Match-3 + Dodge */}
      <div className="flex-[0_0_54%] rounded-t-2xl px-4 pt-3 pb-[80px] flex flex-col"
        style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-2" style={{ background: 'rgba(255,255,255,0.2)' }} />

        {/* Player stats row */}
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-bold mb-1" style={{ color: '#55efc4' }}>
              <span>❤️ HP</span><span>{boss.playerHp}/{boss.playerMaxHp}</span>
            </div>
            <div className="h-2.5 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-md transition-all duration-500" style={{
                width: `${playerHpPct}%`,
                background: playerHpPct > 30 ? 'linear-gradient(90deg, #00b894, #55efc4)' : 'linear-gradient(90deg, #e74c3c, #ff6b6b)',
              }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-bold mb-1" style={{ color: '#74b9ff' }}>
              <span>🛡️ Shield</span><span>{boss.shield}</span>
            </div>
            <div className="h-2.5 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-md transition-all duration-500" style={{ width: `${shieldPct}%`, background: 'linear-gradient(90deg, #0984e3, #74b9ff)' }} />
            </div>
          </div>
        </div>

        {/* Gem grid */}
        <div className="grid grid-cols-6 gap-1.5 p-1.5 rounded-lg flex-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {grid.map((gem, i) => {
            const meta = GEM_META[gem.type];
            const isSelected = selected === i;
            const isMatched = matchedCells.has(i);
            return (
              <div key={gem.id} onClick={() => handleTap(i)}
                className={`aspect-square rounded-[10px] flex items-center justify-center text-[22px] cursor-pointer relative gem-shine transition-all duration-200 ${meta.css}
                  ${isSelected ? 'ring-2 ring-white scale-110 z-10' : 'active:scale-[0.88]'}
                  ${isMatched ? 'scale-0 opacity-0' : ''}
                  ${animating && !isMatched ? 'pointer-events-none' : ''}
                `}>
                {meta.emoji}
              </div>
            );
          })}
        </div>

        {/* Bottom: Ult + Dodge row */}
        <div className="flex items-center gap-2 mt-2">
          {/* Dodge button */}
          <button onClick={handleDodge}
            className={`px-4 py-2 rounded-[20px] font-heading text-xs font-bold transition-all ${
              attackWarning?.phase === 'dodge_window'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse scale-110'
                : 'text-white/40'
            }`}
            style={attackWarning?.phase !== 'dodge_window' ? { background: 'rgba(255,255,255,0.08)' } : {}}>
            🏃 NÉ
          </button>

          {/* Ult bar */}
          <div className="flex-1 h-2 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded ult-gradient transition-all duration-500" style={{ width: `${boss.ultCharge}%` }} />
          </div>

          {/* Ultimate button */}
          <button onClick={fireUltimate}
            className={`px-4 py-2 rounded-[20px] text-white font-heading text-xs font-bold ult-btn-gradient transition-all ${
              ultReady ? 'opacity-100 animate-ult-glow scale-105' : 'opacity-40'
            }`}>
            ⚡ ULT
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
