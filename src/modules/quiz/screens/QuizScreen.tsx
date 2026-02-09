import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QUIZ_QUESTION = {
  num: 3,
  total: 5,
  question: 'Phương pháp nào sau đây KHÔNG thuộc nông nghiệp hữu cơ?',
  image: '🌾',
  options: [
    { letter: 'A', text: 'Sử dụng phân hữu cơ' },
    { letter: 'B', text: 'Phun thuốc trừ sâu hóa học' },
    { letter: 'C', text: 'Luân canh cây trồng' },
    { letter: 'D', text: 'Nuôi thiên địch' },
  ],
  correct: 'B',
};

export default function QuizScreen() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative quiz-gradient flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-5 pt-[50px] pb-4">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl header-btn-glass">
          ←
        </button>
        <h2 className="font-heading text-lg font-bold flex items-center gap-2">📖 Nhà Nông Thông Thái</h2>
        <span className="text-[13px] font-bold text-game-green-mid">{QUIZ_QUESTION.num}/{QUIZ_QUESTION.total}</span>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 px-5 mb-5">
        {Array.from({ length: QUIZ_QUESTION.total }).map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${
            i < QUIZ_QUESTION.num - 1 ? 'bg-game-green-light w-12' :
            i === QUIZ_QUESTION.num - 1 ? 'bg-game-gold-DEFAULT w-16' :
            'w-12'
          }`} style={i >= QUIZ_QUESTION.num ? { background: 'rgba(45,138,78,0.15)' } : {}} />
        ))}
      </div>

      {/* Question card */}
      <div className="mx-5 bg-white rounded-xl p-5 relative overflow-hidden" style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}>
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #4eca6a, #f0b429)' }} />
        <p className="text-xs font-bold text-game-green-mid uppercase tracking-[1.5px] mb-2.5">Câu hỏi {QUIZ_QUESTION.num}</p>
        <p className="text-[17px] font-bold leading-relaxed">{QUIZ_QUESTION.question}</p>
        <div className="w-full h-[140px] rounded-lg mt-4 flex items-center justify-center text-6xl"
          style={{ background: 'linear-gradient(135deg, #d4f8dc, #fff8dc)' }}>
          {QUIZ_QUESTION.image}
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5 px-5 mt-4">
        {QUIZ_QUESTION.options.map((opt) => {
          const isSelected = selected === opt.letter;
          const isCorrect = submitted && opt.letter === QUIZ_QUESTION.correct;
          const isWrong = submitted && isSelected && opt.letter !== QUIZ_QUESTION.correct;

          let borderColor = '#e8e0d4';
          let bg = '#fff';
          let letterBg = '#f5efe6';
          let letterColor = 'hsl(var(--text-mid))';

          if (isCorrect) { borderColor = '#4eca6a'; bg = '#d4f8dc'; letterBg = '#4eca6a'; letterColor = '#fff'; }
          else if (isWrong) { borderColor = '#e74c3c'; bg = '#ffe8e6'; letterBg = '#e74c3c'; letterColor = '#fff'; }
          else if (isSelected) { borderColor = '#4eca6a'; bg = '#edfff2'; letterBg = '#4eca6a'; letterColor = '#fff'; }

          return (
            <button key={opt.letter} onClick={() => !submitted && setSelected(opt.letter)}
              className="flex items-center gap-3.5 p-4 rounded-lg transition-all active:scale-[0.98]"
              style={{ background: bg, border: `2px solid ${borderColor}`, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
              <span className="w-8 h-8 rounded-[10px] flex items-center justify-center font-heading text-sm font-bold flex-shrink-0"
                style={{ background: letterBg, color: letterColor }}>{opt.letter}</span>
              <span className="text-sm font-semibold text-left">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Reward info */}
      <div className="flex items-center justify-center gap-2 mx-5 mt-3 p-2.5 rounded-lg"
        style={{ background: 'rgba(240,180,41,0.12)', border: '1px solid rgba(240,180,41,0.25)' }}>
        <span className="text-[13px] font-bold" style={{ color: '#d49a1a' }}>🪙 +1 OGN cho mỗi câu đúng (Đã nhận: 2 OGN)</span>
      </div>

      {/* Submit button */}
      <div className="px-5 mt-auto pb-10 pt-4">
        <button onClick={handleSubmit} disabled={!selected || submitted}
          className="w-full py-4 rounded-lg btn-green text-white font-heading text-base font-bold tracking-wide active:scale-[0.97] transition-transform disabled:opacity-50">
          {submitted ? (selected === QUIZ_QUESTION.correct ? '✅ Chính xác!' : '❌ Sai rồi!') : 'Xác nhận đáp án'}
        </button>
      </div>
    </div>
  );
}
