import { useState, useCallback } from 'react';

interface Props {
  enabled: boolean;
}

const EMOJIS = ['😈', '🔥', '💀', '😂', '👑', '😰'];
const RATE_LIMIT_MS = 10_000;

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
}

let emojiIdCounter = 0;

export function EmojiReaction({ enabled }: Props) {
  const [floats, setFloats] = useState<FloatingEmoji[]>([]);
  const [lastSent, setLastSent] = useState(0);

  const canSend = Date.now() - lastSent > RATE_LIMIT_MS;

  const sendEmoji = useCallback((emoji: string) => {
    if (!canSend) return;

    const id = ++emojiIdCounter;
    const x = 20 + Math.random() * 60;

    setFloats(prev => [...prev, { id, emoji, x }]);
    setLastSent(Date.now());

    // Auto-remove after 2s
    setTimeout(() => {
      setFloats(prev => prev.filter(f => f.id !== id));
    }, 2000);
  }, [canSend]);

  if (!enabled) return null;

  return (
    <>
      <style>{`
        @keyframes emoji-float {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-250px) scale(1.3); opacity: 0; }
        }
      `}</style>

      {/* Floating emojis */}
      <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
        {floats.map(f => (
          <div
            key={f.id}
            className="absolute bottom-32 text-3xl"
            style={{
              left: `${f.x}%`,
              animation: 'emoji-float 2s ease-out forwards',
            }}
          >
            {f.emoji}
          </div>
        ))}
      </div>

      {/* Emoji bar */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 bg-gray-900/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-700/50">
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => sendEmoji(emoji)}
            disabled={!canSend}
            className={`text-xl p-1 rounded-full transition-transform active:scale-125 ${
              canSend ? 'hover:bg-gray-700/50' : 'opacity-30 cursor-not-allowed'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
