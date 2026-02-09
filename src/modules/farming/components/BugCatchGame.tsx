import { useState, useEffect, useCallback, useRef } from 'react';
import { useFarmStore } from '@/modules/farming/stores/farmStore';
import { useUIStore } from '@/shared/stores/uiStore';

interface Bug {
  id: number;
  emoji: string;
  x: number;
  y: number;
  caught: boolean;
}

const BUG_EMOJIS = ['🐛', '🐜', '🪲', '🦗', '🐞', '🪳'];
const GAME_DURATION = 15;
const SPAWN_INTERVAL = 1200;
const BUG_LIFETIME = 2800;
const OGN_PER_BUG = 2;

interface BugCatchGameProps {
  open: boolean;
  onClose: () => void;
}

export default function BugCatchGame({ open, onClose }: BugCatchGameProps) {
  const addOgn = useFarmStore((s) => s.addOgn);
  const showFlyUp = useUIStore((s) => s.showFlyUp);
  const addToast = useUIStore((s) => s.addToast);

  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [timer, setTimer] = useState(GAME_DURATION);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [caught, setCaught] = useState(0);
  const [missed, setMissed] = useState(0);
  const bugId = useRef(0);

  // Reset on open
  useEffect(() => {
    if (open) {
      setPhase('ready');
      setTimer(GAME_DURATION);
      setBugs([]);
      setCaught(0);
      setMissed(0);
      bugId.current = 0;
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timer <= 0) {
      setPhase('done');
      return;
    }
    const t = setTimeout(() => setTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timer]);

  // Spawn bugs
  useEffect(() => {
    if (phase !== 'playing') return;
    const spawn = () => {
      const id = bugId.current++;
      const bug: Bug = {
        id,
        emoji: BUG_EMOJIS[Math.floor(Math.random() * BUG_EMOJIS.length)],
        x: 10 + Math.random() * 75,
        y: 10 + Math.random() * 70,
        caught: false,
      };
      setBugs(prev => [...prev, bug]);
      // Auto-remove after lifetime (missed)
      setTimeout(() => {
        setBugs(prev => {
          const b = prev.find(bb => bb.id === id);
          if (b && !b.caught) {
            setMissed(m => m + 1);
            return prev.filter(bb => bb.id !== id);
          }
          return prev;
        });
      }, BUG_LIFETIME);
    };
    spawn(); // spawn first immediately
    const interval = setInterval(spawn, SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, [phase]);

  // Award OGN on done
  useEffect(() => {
    if (phase === 'done' && caught > 0) {
      const reward = caught * OGN_PER_BUG;
      addOgn(reward);
    }
  }, [phase, caught, addOgn]);

  const handleCatch = useCallback((id: number) => {
    setBugs(prev => prev.map(b => b.id === id ? { ...b, caught: true } : b));
    setCaught(c => c + 1);
    // Remove after catch animation
    setTimeout(() => setBugs(prev => prev.filter(b => b.id !== id)), 300);
  }, []);

  const handleStart = () => setPhase('playing');

  const handleDone = () => {
    if (caught > 0) {
      const reward = caught * OGN_PER_BUG;
      showFlyUp(`+${reward} OGN 🪙`);
      addToast(`Bắt được ${caught} con sâu! +${reward} OGN 🎉`, 'success');
    } else {
      addToast('Không bắt được con nào, thử lại nhé! 😅', 'info');
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={phase === 'done' ? handleDone : undefined} />

      {/* Game area */}
      <div className="relative w-[90%] max-w-[380px] rounded-2xl overflow-hidden animate-scale-in"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

        {/* Header */}
        <div className="px-5 py-3 flex justify-between items-center"
          style={{ background: 'linear-gradient(135deg, #2d8a4e, #4eca6a)' }}>
          <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
            🐛 Bắt Sâu
          </h3>
          {phase === 'playing' && (
            <div className="flex items-center gap-3">
              <span className="font-heading text-sm font-bold text-white/80">
                🎯 {caught}
              </span>
              <span className={`font-heading text-lg font-bold text-white px-3 py-0.5 rounded-full ${timer <= 5 ? 'animate-pulse bg-red-500/30' : 'bg-white/20'}`}>
                ⏱ {timer}s
              </span>
            </div>
          )}
          {phase === 'ready' && (
            <button onClick={onClose} className="text-white/70 text-xl font-bold">✕</button>
          )}
        </div>

        {/* Game field */}
        <div className="relative bg-gradient-to-b from-green-50 to-amber-50"
          style={{ height: 360 }}>

          {/* Decorative grass */}
          <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30"
            style={{ background: 'linear-gradient(0deg, #4eca6a, transparent)' }} />

          {/* Plant in center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl opacity-20 pointer-events-none">
            🌿
          </div>

          {phase === 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
              <div className="text-6xl animate-bounce">🐛</div>
              <p className="font-heading text-lg font-bold text-center">
                Sâu đang phá cây!
              </p>
              <p className="text-sm text-center text-muted-foreground">
                Bắt càng nhiều sâu càng tốt trong {GAME_DURATION} giây.
                <br />Mỗi con = <span className="font-bold text-game-gold-dark">+{OGN_PER_BUG} OGN</span>
              </p>
              <button onClick={handleStart}
                className="px-8 py-3 rounded-xl btn-green text-white font-heading text-base font-bold active:scale-95 transition-transform mt-2">
                🎮 Bắt đầu!
              </button>
            </div>
          )}

          {phase === 'playing' && bugs.map(bug => (
            <button key={bug.id}
              onClick={() => !bug.caught && handleCatch(bug.id)}
              className={`absolute transition-all duration-200 ${bug.caught ? 'scale-150 opacity-0' : 'animate-bug-wiggle'}`}
              style={{
                left: `${bug.x}%`,
                top: `${bug.y}%`,
                fontSize: 36,
                transform: bug.caught ? 'scale(1.5)' : undefined,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}>
              {bug.caught ? '💥' : bug.emoji}
            </button>
          ))}

          {phase === 'done' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 animate-fade-in">
              <div className="text-6xl">{caught >= 8 ? '🏆' : caught >= 4 ? '⭐' : '😅'}</div>
              <p className="font-heading text-2xl font-bold">
                {caught >= 8 ? 'Tuyệt vời!' : caught >= 4 ? 'Giỏi lắm!' : 'Cố thêm nhé!'}
              </p>
              <div className="flex gap-6 mt-1">
                <div className="text-center">
                  <p className="font-heading text-3xl font-bold text-game-green-mid">{caught}</p>
                  <p className="text-xs font-bold text-muted-foreground">Đã bắt</p>
                </div>
                <div className="text-center">
                  <p className="font-heading text-3xl font-bold text-destructive">{missed}</p>
                  <p className="text-xs font-bold text-muted-foreground">Trốn thoát</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl"
                style={{ background: 'rgba(240,180,41,0.15)', border: '1px solid rgba(240,180,41,0.3)' }}>
                <span className="text-xl">🪙</span>
                <span className="font-heading text-lg font-bold" style={{ color: '#d49a1a' }}>
                  +{caught * OGN_PER_BUG} OGN
                </span>
              </div>
              <button onClick={handleDone}
                className="px-8 py-3 rounded-xl btn-green text-white font-heading text-base font-bold active:scale-95 transition-transform mt-2">
                Nhận thưởng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
