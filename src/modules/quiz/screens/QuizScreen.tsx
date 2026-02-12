import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStart } from '@/shared/hooks/useQuizStart';
import { useQuizAnswer } from '@/shared/hooks/useQuizAnswer';
import { useLevel, useXp } from '@/shared/hooks/usePlayerProfile';
import { LEVEL_CONFIG } from '@/shared/stores/playerStore';
import type { QuizQuestionData } from '@/shared/types/game-api.types';

type Phase = 'idle' | 'playing' | 'answering' | 'revealed' | 'finished';

const TIMER_SECONDS = 15;

export default function QuizScreen() {
  const navigate = useNavigate();
  const level = useLevel();
  const xp = useXp();

  // Calculate relative XP for the progress bar (Linear 100 XP system)
  const xpInLevel = LEVEL_CONFIG.getXpInLevel(xp);
  const xpForLevelUp = LEVEL_CONFIG.getXpForLevel();
  const xpPct = Math.min(100, Math.round((xpInLevel / xpForLevelUp) * 100));

  const startQuiz = useQuizStart();
  const answerQuiz = useQuizAnswer();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionData[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalOgn, setTotalOgn] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [lastResult, setLastResult] = useState<{
    correct: boolean;
    correctAnswer: string;
    ognGain: number;
    xpGain: number;
  } | null>(null);

  const q = questions[idx];
  const total = questions.length;

  // Timer logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phase === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && phase === 'playing') {
      // Auto-submit or handle timeout if needed
      // handleSubmit(); // Could auto-submit
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  // Start quiz
  const handleStart = useCallback(() => {
    startQuiz.mutate(undefined, {
      onSuccess: (data) => {
        setSessionId(data.sessionId);
        setQuestions(data.questions);
        setIdx(0);
        setSelected(null);
        setTotalCorrect(0);
        setTotalOgn(0);
        setTotalXp(0);
        setLastResult(null);
        setTimeLeft(TIMER_SECONDS);
        setPhase('playing');
      },
    });
  }, [startQuiz]);

  // Submit answer
  const handleSubmit = useCallback(() => {
    if (!selected || !sessionId || phase !== 'playing') return;
    setPhase('answering');

    answerQuiz.mutate(
      { sessionId, questionIndex: idx, answer: selected },
      {
        onSuccess: (data) => {
          setLastResult({
            correct: data.correct,
            correctAnswer: data.correctAnswer,
            ognGain: data.ognGain,
            xpGain: data.xpGain,
          });
          setTotalCorrect(data.totalCorrect);
          if (data.quizComplete) {
            setTotalOgn(data.totalOgnGained || 0);
            setTotalXp(data.totalXpGained || 0);
            setPhase('finished');
          } else {
            setPhase('revealed');
          }
        },
        onError: () => {
          setPhase('playing');
        },
      }
    );
  }, [selected, sessionId, phase, idx, answerQuiz]);

  // Next question
  const handleNext = useCallback(() => {
    if (idx >= total - 1) {
      setPhase('finished');
      return;
    }
    setIdx(i => i + 1);
    setSelected(null);
    setLastResult(null);
    setTimeLeft(TIMER_SECONDS);
    setPhase('playing');
  }, [idx, total]);

  // Background Component
  const Background = () => (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none"
      style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #E0F7FA 40%, #A5D6A7 40%, #81C784 100%)' }}>
      <div className="absolute top-[5%] left-[10%] w-20 h-20 rounded-full shadow-[0_0_40px_#FFEB3B]"
        style={{ background: 'radial-gradient(circle, #FDB813 0%, #F57F17 100%)' }} />
      <div className="cloud w-32 h-12 top-16 right-10 absolute bg-white rounded-full opacity-80 shadow-sm" />
      <div className="cloud w-24 h-8 top-24 left-20 absolute bg-white rounded-full opacity-60 shadow-sm" />
      <div className="absolute bottom-[20%] left-[-20%] w-[140%] h-[50%] bg-[#66BB6A] rounded-t-[100%] z-[-2]" />
      <div className="absolute bottom-0 left-0 w-full h-[35%] bg-gradient-to-b from-[#4CAF50] to-[#2E7D32] rounded-t-[100%] z-[-1]" />
      <div className="absolute bottom-[20%] left-[5%] opacity-30 transform -rotate-12">
        <span className="material-icons-round text-green-800 text-6xl">grass</span>
      </div>
      <div className="absolute bottom-[25%] right-[15%] opacity-30 transform rotate-6">
        <span className="material-icons-round text-green-800 text-7xl">grass</span>
      </div>
    </div>
  );

  // Finished screen
  if (phase === 'finished') {
    return (
      <div className="min-h-screen max-w-[430px] mx-auto relative flex flex-col items-center justify-center px-8 overflow-hidden font-sans">
        <Background />
        <div className="animate-scale-in text-center relative z-10 w-full">
          <div className="text-7xl mb-4">{totalCorrect >= total * 0.8 ? '🏆' : totalCorrect >= total * 0.5 ? '⭐' : '📖'}</div>
          <h2 className="font-heading text-2xl font-black text-white drop-shadow-md mb-2">Hoàn thành!</h2>
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-wood border-4 border-white mb-6">
            <p className="text-lg font-bold mb-1 text-gray-800">
              Bạn trả lời đúng <span className="text-green-600 font-black">{totalCorrect}/{total}</span> câu
            </p>
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-center gap-2 bg-amber-50 py-2 px-4 rounded-xl border-2 border-amber-100">
                <span className="text-2xl">🪙</span>
                <span className="font-black text-xl text-amber-700">+{totalOgn} OGN</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-indigo-50 py-2 px-4 rounded-xl border-2 border-indigo-100">
                <span className="text-2xl">⭐</span>
                <span className="font-black text-xl text-indigo-700">+{totalXp} XP</span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/farm')}
            className="w-full py-4 rounded-2xl bg-[#77D373] border-b-4 border-[#2E7D32] text-white font-black text-lg shadow-btn-green active:border-b-0 active:translate-y-1 transition-all">
            VỀ NÔNG TRẠI
          </button>
          <button onClick={() => setPhase('idle')}
            className="w-full py-3 mt-4 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-700 font-bold active:scale-[0.97] transition-all border border-white/50">
            🔄 CHƠI LẠI
          </button>
        </div>
      </div>
    );
  }

  // Idle screen
  if (phase === 'idle') {
    return (
      <div className="min-h-screen max-w-[430px] mx-auto relative flex flex-col items-center justify-center px-8 overflow-hidden font-sans">
        <Background />
        <div className="animate-scale-in text-center relative z-10 w-full">
          <div className="text-7xl mb-4">📖</div>
          <h2 className="font-heading text-3xl font-black text-white drop-shadow-md mb-2 uppercase tracking-tight">Daily Quiz</h2>
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-wood border-4 border-white mb-8">
            <p className="text-gray-700 font-bold text-sm mb-4 leading-relaxed">
              Thử thách kiến thức về nông nghiệp hữu cơ để kiếm phần thưởng hấp dẫn!
            </p>
            <div className="flex items-center justify-center gap-2 bg-amber-100 py-3 rounded-xl border-2 border-amber-200">
              <span className="text-2xl">🪙</span>
              <span className="font-black text-lg text-amber-800">+2 OGN / CÂU ĐÚNG</span>
            </div>
          </div>
          <button
            onClick={handleStart}
            disabled={startQuiz.isPending}
            className="w-full py-4 rounded-2xl bg-[#77D373] border-b-4 border-[#2E7D32] text-white font-black text-xl shadow-btn-green active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
          >
            {startQuiz.isPending ? 'Đang tải...' : 'BẮT ĐẦU NGAY'}
          </button>
          <button onClick={() => navigate(-1)}
            className="w-full py-3 mt-4 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-600 font-bold active:scale-[0.97] transition-all border border-white/50">
            QUAY LẠI
          </button>
        </div>
      </div>
    );
  }

  // Option colors mapping
  const getOptColor = (letter: string) => {
    switch (letter) {
      case 'A': return { bg: 'bg-[#4FC3F7]', border: 'border-[#0288D1]', shadow: 'shadow-btn-blue' };
      case 'B': return { bg: 'bg-[#AED581]', border: 'border-[#558B2F]', shadow: 'shadow-btn-green' };
      case 'C': return { bg: 'bg-[#FFB74D]', border: 'border-[#E65100]', shadow: 'shadow-btn-yellow' };
      case 'D': return { bg: 'bg-[#EF5350]', border: 'border-[#C62828]', shadow: 'shadow-btn-red' };
      default: return { bg: 'bg-gray-400', border: 'border-gray-600', shadow: '' };
    }
  };

  return (
    <div className="min-h-screen max-w-[430px] mx-auto relative flex flex-col px-6 py-6 font-sans overflow-x-hidden">
      <Background />

      {/* Header */}
      <header className="flex items-center justify-between mb-8 relative z-20">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/60 transition-colors shadow-sm border border-white/50">
          <span className="material-icons-round text-2xl">arrow_back_ios_new</span>
        </button>
        <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-white/50">
          <span className="material-icons-round text-amber-500">emoji_events</span>
          <span className="font-black text-amber-800 text-sm italic">Daily Quiz</span>
        </div>
        <button onClick={() => setPhase('idle')}
          className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/60 transition-colors shadow-sm border border-white/50">
          <span className="material-icons-round text-2xl">close</span>
        </button>
      </header>

      {/* Progress & Timer */}
      <div className="flex justify-between items-end mb-6 px-2 relative z-20">
        <div className="flex flex-col gap-1.5 flex-1">
          <span className="text-[10px] font-black text-green-900 uppercase tracking-[0.1em] opacity-80">Question {idx + 1}/{total}</span>
          <div className="w-[85%] h-3.5 bg-white/50 rounded-full overflow-hidden border border-white/30 p-[2px]">
            <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.4)] transition-all duration-500"
              style={{ width: `${((idx + 1) / total) * 100}%` }} />
          </div>
        </div>

        {/* Circular Timer */}
        <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 bg-white/95 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center">
            <span className={`font-black text-lg ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-orange-600'}`}>
              {timeLeft}
            </span>
          </div>
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="transparent" r="46" stroke="#f1f5f9" strokeWidth="8" />
            <circle cx="50" cy="50" fill="transparent" r="46" stroke={timeLeft <= 5 ? '#ef4444' : '#FB8C00'}
              strokeWidth="8" strokeDasharray="289" strokeDashoffset={289 - (289 * timeLeft) / TIMER_SECONDS}
              strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
          </svg>
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">S</div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-[32px] border-4 border-white shadow-card p-6 mb-8 relative z-10">
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-blue-100 rounded-full border-4 border-white shadow-md flex items-center justify-center">
          <span className="material-icons-round text-blue-500 text-3xl">psychology</span>
        </div>
        <div className="mt-4 text-center">
          <h2 className="text-xl font-black text-gray-800 leading-tight mb-2 uppercase tracking-tight">
            {q?.question || 'Đang tải câu hỏi...'}
          </h2>
          <div className="mt-4 w-full h-24 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl flex items-center justify-center text-5xl">
            {q?.image || '📖'}
          </div>
        </div>
      </div>

      {/* Answer Grid */}
      <div className="grid grid-cols-1 gap-4 flex-grow content-start relative z-20">
        {q?.options.map((opt) => {
          const isSelected = selected === opt.letter;
          const isCorrect = phase === 'revealed' && opt.letter === lastResult?.correctAnswer;
          const isWrong = phase === 'revealed' && isSelected && !lastResult?.correct;
          const colors = getOptColor(opt.letter);

          let finalBtnStyle = `${colors.bg} ${colors.border} ${colors.shadow}`;
          if (isCorrect) finalBtnStyle = 'bg-green-500 border-green-700 shadow-[0_4px_0_0_#15803d]';
          if (isWrong) finalBtnStyle = 'bg-red-500 border-red-700 shadow-[0_4px_0_0_#b91c1c]';

          return (
            <button
              key={opt.letter}
              onClick={() => phase === 'playing' && setSelected(opt.letter)}
              disabled={phase !== 'playing'}
              className={`answer-btn group relative w-full p-4 rounded-2xl border-b-4 ${finalBtnStyle} transition-all active:border-b-0 active:translate-y-1 disabled:pointer-events-none`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-xl border border-white/30 shadow-inner">
                  {opt.letter}
                </div>
                <span className="text-white font-black text-left text-base leading-tight drop-shadow-sm uppercase tracking-tight truncate pr-4">
                  {opt.text}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                {isCorrect && <span className="material-icons-round text-white text-2xl">check_circle</span>}
                {isWrong && <span className="material-icons-round text-white text-2xl">cancel</span>}
                {phase === 'playing' && isSelected && <span className="material-icons-round text-white/60 text-2xl animate-pulse">radio_button_checked</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="mt-8 pb-6 relative z-20">
        {phase === 'playing' ? (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="w-full py-5 rounded-3xl bg-[#77D373] border-b-6 border-[#2E7D32] text-white font-black text-xl shadow-btn-green active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 disabled:grayscale uppercase"
          >
            XÁC NHẬN ĐÁP ÁN
          </button>
        ) : phase === 'revealed' ? (
          <button
            onClick={handleNext}
            className="w-full py-5 rounded-3xl bg-[#4FC3F7] border-b-6 border-[#0288D1] shadow-btn-blue text-white font-black text-xl active:border-b-0 active:translate-y-2 transition-all animate-bounce-in uppercase"
          >
            {idx >= total - 1 ? 'XEM KẾT QUẢ 🏆' : 'CÂU TIẾP THEO ➜'}
          </button>
        ) : (
          <div className="h-24" /> /* Reserved space */
        )}
      </div>

      {/* Animated Character */}
      <div className="absolute bottom-4 right-[-10px] pointer-events-none z-0">
        <div className="relative w-28 h-28 animate-[sway_3.5s_ease-in-out_infinite] origin-bottom scale-x-[-1]">
          <div className="absolute bottom-0 left-10 w-3 h-16 bg-green-700 rounded-full" />
          <div className="absolute top-4 left-6 w-12 h-14 bg-green-400 rounded-full border-2 border-green-700 flex items-center justify-center">
            <div className="flex gap-2.5 mt-2">
              <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-5deg) scaleX(-1); }
          50% { transform: rotate(5deg) scaleX(-1); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .shadow-wood { box-shadow: 0 8px 0 0 #5D4037, 0 15px 20px rgba(0,0,0,0.3); }
        .shadow-btn-blue { box-shadow: 0 5px 0 0 #1565C0, 0 10px 15px rgba(0,0,0,0.2); }
        .shadow-btn-green { box-shadow: 0 5px 0 0 #2E7D32, 0 10px 15px rgba(0,0,0,0.2); }
        .shadow-btn-yellow { box-shadow: 0 5px 0 0 #EF6C00, 0 10px 15px rgba(0,0,0,0.2); }
        .shadow-btn-red { box-shadow: 0 5px 0 0 #C62828, 0 10px 15px rgba(0,0,0,0.2); }
      `}</style>
    </div>
  );
}
