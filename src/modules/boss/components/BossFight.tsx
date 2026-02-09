import { BossInfo, DIFFICULTY_STYLES } from '../data/bosses';
import { useBossFight } from '../hooks/useBossFight';
import { useFarmStore } from '@/modules/farming/stores/farmStore';

interface Props {
  boss: BossInfo;
  onBack: () => void;
}

export default function BossFight({ boss, onBack }: Props) {
  const addOgn = useFarmStore(s => s.addOgn);
  const {
    phase, bossHp, playerHp, playerMaxHp, timer, currentQ, lastResult,
    popups, combo, totalDmg, qIdx, totalQuestions,
    startFight, handleAnswer, nextQuestion, bossMaxHp,
  } = useBossFight(boss);

  const bossHpPct = Math.round((bossHp / bossMaxHp) * 100);
  const playerHpPct = Math.round((playerHp / playerMaxHp) * 100);
  const style = DIFFICULTY_STYLES[boss.difficulty];

  // Victory / Defeat
  if (phase === 'victory' || phase === 'defeat') {
    const won = phase === 'victory';
    if (won) addOgn(boss.reward);
    return (
      <div className="min-h-screen max-w-[430px] mx-auto boss-gradient flex flex-col items-center justify-center px-8">
        <div className="animate-scale-in text-center">
          <div className="text-7xl mb-4">{won ? '🏆' : '💀'}</div>
          <h2 className="font-heading text-2xl font-bold text-white mb-2">
            {won ? 'Chiến thắng!' : 'Thất bại!'}
          </h2>
          <p className="text-white/70 text-sm mb-2">
            {won ? `Đã tiêu diệt ${boss.name}!` : `${boss.name} đã đánh bại bạn!`}
          </p>
          <div className="flex items-center justify-center gap-4 mb-6 text-sm font-bold">
            <span style={{ color: '#ff6b6b' }}>⚔️ {totalDmg} DMG</span>
            {won && <span style={{ color: '#fdcb6e' }}>🪙 +{boss.reward} OGN</span>}
          </div>
          <button onClick={onBack}
            className="w-full py-4 rounded-lg btn-green text-white font-heading text-base font-bold active:scale-[0.97] transition-transform">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  // Ready screen
  if (phase === 'ready') {
    return (
      <div className="min-h-screen max-w-[430px] mx-auto boss-gradient flex flex-col items-center justify-center px-8">
        <div className="animate-scale-in text-center">
          <div className="text-[100px] mb-4" style={{ filter: 'drop-shadow(0 0 30px rgba(231,76,60,0.4))' }}>
            {boss.emoji}
          </div>
          <h2 className="font-heading text-2xl font-bold text-white mb-1">{boss.name}</h2>
          <span className="inline-block text-[11px] px-3 py-1 rounded-full font-bold mb-3"
            style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
            {style.label}
          </span>
          <p className="text-white/50 text-sm mb-2">{boss.description}</p>
          <div className="flex items-center justify-center gap-4 mb-6 text-xs font-bold">
            <span style={{ color: '#ff6b6b' }}>❤️ {boss.hp.toLocaleString()} HP</span>
            <span style={{ color: '#fdcb6e' }}>⚔️ ATK {boss.attack}</span>
          </div>
          <p className="text-white/40 text-xs mb-6">Trả lời câu hỏi hữu cơ trong 3 giây để tấn công!</p>
          <button onClick={startFight}
            className="w-full py-4 rounded-lg text-white font-heading text-base font-bold active:scale-[0.97] transition-transform"
            style={{ background: 'linear-gradient(135deg, #e74c3c, #ff6b6b)', boxShadow: '0 6px 20px rgba(231,76,60,0.4)' }}>
            ⚔️ BẮT ĐẦU CHIẾN ĐẤU
          </button>
          <button onClick={onBack} className="mt-3 text-white/50 text-sm font-bold">← Quay lại</button>
        </div>
      </div>
    );
  }

  // Fight (question / result phases)
  return (
    <div className="min-h-screen max-w-[430px] mx-auto boss-gradient flex flex-col">
      {/* Top: Boss area */}
      <div className="px-5 pt-safe pb-2 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-2 z-10">
          <button onClick={onBack} className="text-white/50 text-sm font-bold">← Thoát</button>
          <span className="font-heading text-sm font-semibold text-white/70">
            Câu {qIdx + 1}/{totalQuestions}
          </span>
        </div>

        {/* Boss name + HP */}
        <div className="z-10 mb-2">
          <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2 mb-1.5">
            <span className="text-xl">{boss.emoji}</span> {boss.name}
          </h2>
          <div className="w-full h-5 rounded-xl overflow-hidden relative"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-xl relative boss-hp-glow transition-all duration-500"
              style={{ width: `${bossHpPct}%`, background: 'linear-gradient(90deg, #e74c3c, #ff6b6b)' }}>
              <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)' }} />
            </div>
            <span className="absolute inset-0 flex items-center justify-center font-heading text-[11px] font-bold text-white text-shadow-sm">
              {bossHp.toLocaleString()} / {bossMaxHp.toLocaleString()} HP
            </span>
          </div>
        </div>

        {/* Boss sprite + popups */}
        <div className="flex items-center justify-center relative z-10 py-4">
          <span className={`text-[80px] animate-boss-idle ${bossHp <= 0 ? 'opacity-30 grayscale' : ''}`}
            style={{ filter: 'drop-shadow(0 0 25px rgba(231,76,60,0.4))' }}>
            {boss.emoji}
          </span>
          {popups.map(p => (
            <span key={p.id}
              className="absolute font-heading text-2xl font-bold animate-damage-float text-shadow-sm pointer-events-none"
              style={{ color: p.color, left: `${p.x}%`, top: `${p.y}%` }}>
              {p.text}
            </span>
          ))}
          {combo >= 2 && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-scale-in pointer-events-none">
              <div className="px-4 py-1 rounded-full font-heading font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #e74c3c, #fd79a8)', boxShadow: '0 0 15px rgba(231,76,60,0.5)' }}>
                🔥 COMBO x{combo}
              </div>
            </div>
          )}
        </div>

        {/* Player HP */}
        <div className="z-10">
          <div className="flex justify-between text-[10px] font-bold mb-1" style={{ color: '#55efc4' }}>
            <span>❤️ HP của bạn</span><span>{playerHp}/{playerMaxHp}</span>
          </div>
          <div className="h-2.5 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-md transition-all duration-500" style={{
              width: `${playerHpPct}%`,
              background: playerHpPct > 30 ? 'linear-gradient(90deg, #00b894, #55efc4)' : 'linear-gradient(90deg, #e74c3c, #ff6b6b)',
              boxShadow: '0 0 8px rgba(85,239,196,0.3)',
            }} />
          </div>
        </div>
      </div>

      {/* Bottom: Question area */}
      <div className="flex-1 rounded-t-2xl px-5 pt-5 pb-8 flex flex-col mt-2"
        style={{ background: 'rgba(0,0,0,0.3)' }}>
        
        {/* Timer */}
        {phase === 'question' && (
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-heading text-2xl font-bold border-4 transition-colors ${
              timer <= 1 ? 'border-red-500 text-red-400 animate-pulse' : 'border-white/30 text-white'
            }`}>
              {timer}
            </div>
          </div>
        )}

        {/* Question card */}
        {currentQ && (
          <div className="rounded-xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: style.text }}>
              Đúng hay Sai?
            </p>
            <p className="text-white font-heading text-base font-bold leading-relaxed">
              {currentQ.question}
            </p>
          </div>
        )}

        {/* Result feedback */}
        {phase === 'result' && lastResult && (
          <div className={`rounded-xl p-4 mb-4 animate-scale-in ${lastResult.correct ? '' : ''}`}
            style={{
              background: lastResult.correct ? 'rgba(85,239,196,0.15)' : 'rgba(231,76,60,0.15)',
              border: `1px solid ${lastResult.correct ? 'rgba(85,239,196,0.4)' : 'rgba(231,76,60,0.4)'}`,
            }}>
            <p className="font-heading text-sm font-bold mb-1" style={{ color: lastResult.correct ? '#55efc4' : '#ff6b6b' }}>
              {lastResult.correct ? '✅ Chính xác!' : '❌ Sai rồi! Boss tấn công!'}
            </p>
            <p className="text-white/60 text-xs">{lastResult.explanation}</p>
          </div>
        )}

        {/* Answer buttons */}
        <div className="mt-auto">
          {phase === 'question' ? (
            <div className="flex gap-3">
              <button onClick={() => handleAnswer(true)}
                className="flex-1 py-4 rounded-xl font-heading text-base font-bold active:scale-[0.95] transition-transform"
                style={{ background: 'linear-gradient(135deg, #00b894, #55efc4)', color: '#fff', boxShadow: '0 4px 15px rgba(85,239,196,0.3)' }}>
                ✅ ĐÚNG
              </button>
              <button onClick={() => handleAnswer(false)}
                className="flex-1 py-4 rounded-xl font-heading text-base font-bold active:scale-[0.95] transition-transform"
                style={{ background: 'linear-gradient(135deg, #e74c3c, #ff6b6b)', color: '#fff', boxShadow: '0 4px 15px rgba(231,76,60,0.3)' }}>
                ❌ SAI
              </button>
            </div>
          ) : phase === 'result' ? (
            <button onClick={nextQuestion}
              className="w-full py-4 rounded-xl btn-green text-white font-heading text-base font-bold active:scale-[0.97] transition-transform animate-fade-in">
              Câu tiếp theo →
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
