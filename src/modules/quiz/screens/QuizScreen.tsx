import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomQuestions, QUIZ_SIZE } from '../data/questions';
import { useFarmStore } from '@/modules/farming/stores/farmStore';
import { usePlayerStore, xpForNextLevel, getLevelTitle } from '@/shared/stores/playerStore';

type Phase = 'answering' | 'revealed' | 'finished';

export default function QuizScreen() {
  const navigate = useNavigate();
  const addOgn = useFarmStore((s) => s.addOgn);
  const { level, xp } = usePlayerStore();
  const nextXp = xpForNextLevel(level);
  const xpPct = nextXp > 0 ? Math.min(100, Math.round((xp / nextXp) * 100)) : 100;
  const questions = useMemo(() => getRandomQuestions(QUIZ_SIZE), []);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('answering');
  const [score, setScore] = useState(0);
  const [slideDir, setSlideDir] = useState<'in' | 'out' | null>(null);

  const q = questions[idx];
  const total = questions.length;

  const handleSubmit = useCallback(() => {
    if (!selected || phase !== 'answering') return;
    const correct = selected === q.correct;
    if (correct) {
      setScore(s => s + 1);
      addOgn(1);
      usePlayerStore.getState().addXp(8);
    }
    setPhase('revealed');
  }, [selected, phase, q, addOgn]);

  const handleNext = useCallback(() => {
    if (idx >= total - 1) {
      setPhase('finished');
      return;
    }
    // Slide out then slide in
    setSlideDir('out');
    setTimeout(() => {
      setIdx(i => i + 1);
      setSelected(null);
      setPhase('answering');
      setSlideDir('in');
      setTimeout(() => setSlideDir(null), 350);
    }, 300);
  }, [idx, total]);

  // Finished screen
  if (phase === 'finished') {
    return (
      <div className="min-h-screen max-w-[430px] mx-auto relative quiz-gradient flex flex-col items-center justify-center px-8">
        <div className="animate-scale-in text-center">
          <div className="text-7xl mb-4">{score >= total * 0.8 ? '🏆' : score >= total * 0.5 ? '⭐' : '📖'}</div>
          <h2 className="font-heading text-2xl font-bold mb-2">Hoàn thành!</h2>
          <p className="text-lg font-semibold mb-1">
            Bạn trả lời đúng <span className="text-game-green-mid font-bold">{score}/{total}</span> câu
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 mb-8 px-5 py-3 rounded-xl"
            style={{ background: 'rgba(240,180,41,0.15)', border: '1px solid rgba(240,180,41,0.3)' }}>
            <span className="text-2xl">🪙</span>
            <span className="font-heading text-xl font-bold" style={{ color: '#d49a1a' }}>+{score} OGN</span>
          </div>
          <button onClick={() => navigate('/farm')}
            className="w-full py-4 rounded-lg btn-green text-white font-heading text-base font-bold active:scale-[0.97] transition-transform">
            Về Nông trại
          </button>
          <button onClick={() => { window.location.reload(); }}
            className="w-full py-3 mt-3 rounded-lg bg-white/80 font-heading text-sm font-bold active:scale-[0.97] transition-transform"
            style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            🔄 Chơi lại
          </button>
        </div>
      </div>
    );
  }

  const slideClass = slideDir === 'out' ? 'translate-x-[-110%] opacity-0' : slideDir === 'in' ? 'animate-fade-in' : '';

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative quiz-gradient flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-5 pt-safe pb-2">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl header-btn-glass">
          ←
        </button>
        <h2 className="font-heading text-lg font-bold flex items-center gap-2">📖 Nhà Nông Thông Thái</h2>
        <span className="text-[13px] font-bold text-game-green-mid">{idx + 1}/{total}</span>
      </div>

      {/* XP bar */}
      <div className="mx-5 mb-2 flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #00b894, #55efc4)' }}>
          ⭐ Lv.{level}
        </span>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg, #00b894, #55efc4)' }} />
        </div>
        <span className="text-[9px] font-bold text-muted-foreground">{xp}/{nextXp}</span>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 px-5 mb-5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
            i < idx ? 'bg-game-green-light w-12' :
            i === idx ? 'bg-game-gold-DEFAULT w-16' :
            'w-12'
          }`} style={i > idx ? { background: 'rgba(45,138,78,0.15)' } : {}} />
        ))}
      </div>

      {/* Question card - animated */}
      <div className={`transition-all duration-300 ease-out ${slideClass}`}>
        <div className="mx-5 bg-white rounded-xl p-5 relative overflow-hidden" style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}>
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #4eca6a, #f0b429)' }} />
          <p className="text-xs font-bold text-game-green-mid uppercase tracking-[1.5px] mb-2.5">Câu hỏi {idx + 1}</p>
          <p className="text-[17px] font-bold leading-relaxed">{q.question}</p>
          <div className="w-full h-[120px] rounded-lg mt-4 flex items-center justify-center text-6xl"
            style={{ background: 'linear-gradient(135deg, #d4f8dc, #fff8dc)' }}>
            {q.image}
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2.5 px-5 mt-4">
          {q.options.map((opt) => {
            const isSelected = selected === opt.letter;
            const isCorrect = phase === 'revealed' && opt.letter === q.correct;
            const isWrong = phase === 'revealed' && isSelected && opt.letter !== q.correct;

            let borderColor = '#e8e0d4';
            let bg = '#fff';
            let letterBg = '#f5efe6';
            let letterColor = 'hsl(var(--text-mid))';

            if (isCorrect) { borderColor = '#4eca6a'; bg = '#d4f8dc'; letterBg = '#4eca6a'; letterColor = '#fff'; }
            else if (isWrong) { borderColor = '#e74c3c'; bg = '#ffe8e6'; letterBg = '#e74c3c'; letterColor = '#fff'; }
            else if (isSelected) { borderColor = '#4eca6a'; bg = '#edfff2'; letterBg = '#4eca6a'; letterColor = '#fff'; }

            return (
              <button key={opt.letter} onClick={() => phase === 'answering' && setSelected(opt.letter)}
                className="flex items-center gap-3.5 p-4 rounded-lg transition-all duration-200 active:scale-[0.98]"
                style={{ background: bg, border: `2px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <span className="w-8 h-8 rounded-[10px] flex items-center justify-center font-heading text-sm font-bold flex-shrink-0 transition-colors duration-200"
                  style={{ background: letterBg, color: letterColor }}>{opt.letter}</span>
                <span className="text-sm font-semibold text-left">{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reward info */}
      <div className="flex items-center justify-center gap-2 mx-5 mt-3 p-2.5 rounded-lg"
        style={{ background: 'rgba(240,180,41,0.12)', border: '1px solid rgba(240,180,41,0.25)' }}>
        <span className="text-[13px] font-bold" style={{ color: '#d49a1a' }}>
          🪙 +1 OGN cho mỗi câu đúng (Đã nhận: {score} OGN)
        </span>
      </div>

      {/* Submit / Next button */}
      <div className="px-5 mt-auto pb-10 pt-4">
        {phase === 'answering' ? (
          <button onClick={handleSubmit} disabled={!selected}
            className="w-full py-4 rounded-lg btn-green text-white font-heading text-base font-bold tracking-wide active:scale-[0.97] transition-transform disabled:opacity-50">
            Xác nhận đáp án
          </button>
        ) : (
          <button onClick={handleNext}
            className="w-full py-4 rounded-lg btn-green text-white font-heading text-base font-bold tracking-wide active:scale-[0.97] transition-transform animate-fade-in">
            {idx >= total - 1 ? '🏆 Xem kết quả' : 'Câu tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  );
}
