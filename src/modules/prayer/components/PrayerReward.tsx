import { useEffect, useState } from 'react';

interface PrayerRewardProps {
  ognReward: number;
  xpReward: number;
  multiplier: number;
  milestone?: number;
  onDone: () => void;
}

export function PrayerReward({ ognReward, xpReward, multiplier, milestone, onDone }: PrayerRewardProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, milestone ? 3500 : 2500);
    return () => clearTimeout(timer);
  }, [onDone, milestone]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none
      transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="animate-bounce-in text-center">
        {/* Prayer emoji float up */}
        <div className="text-5xl mb-3 animate-float-up">🙏</div>

        {/* Rewards */}
        <div className="bg-white/15 backdrop-blur-md rounded-2xl px-8 py-5 space-y-2 border border-white/20">
          {ognReward > 0 && (
            <div className="font-heading text-2xl text-amber-400 font-bold">
              +{ognReward} OGN
            </div>
          )}
          {xpReward > 0 && (
            <div className="font-heading text-xl text-blue-400 font-bold">
              +{xpReward} XP
            </div>
          )}
          {multiplier > 1 && (
            <div className="text-sm text-yellow-300">
              ✨ x{multiplier} Custom bonus!
            </div>
          )}
          {milestone && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="text-lg font-heading text-purple-300 font-bold animate-prayer-glow rounded-lg px-3 py-1">
                🏅 Milestone!
              </div>
              <div className="text-xs text-white/50 mt-1">
                Lời cầu nguyện thứ {milestone.toLocaleString()}!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
