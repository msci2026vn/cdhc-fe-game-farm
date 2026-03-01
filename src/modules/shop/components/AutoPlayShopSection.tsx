// ═══════════════════════════════════════════════════════════════
// AutoPlayShopSection — VIP auto-play upgrade packages
// ═══════════════════════════════════════════════════════════════

import { useAutoPlayLevel } from '@/shared/hooks/useAutoPlayLevel';
import { getLearningSummary, resetWeights } from '@/shared/autoplay/auto-learner';
import { useState } from 'react';

interface Package {
  level: number;
  name: string;
  algorithm: string;
  features: string[];
  priceAvax: string;
  color: string;
  icon: string;
}

const PACKAGES: Package[] = [
  {
    level: 2, name: 'Basic', algorithm: 'Greedy',
    features: ['Weighted scoring', 'Situation awareness'],
    priceAvax: '0.015', color: '#3b82f6', icon: '🧠',
  },
  {
    level: 3, name: 'Advanced', algorithm: 'Cascade',
    features: ['Cascade simulation', 'Auto-dodge'],
    priceAvax: '0.016', color: '#eab308', icon: '⚡',
  },
  {
    level: 4, name: 'Pro', algorithm: 'MCTS 30',
    features: ['Monte Carlo search', 'Auto-ULT', '30% recharge'],
    priceAvax: '0.018', color: '#f97316', icon: '🎯',
  },
  {
    level: 5, name: 'Elite', algorithm: 'MCTS 80',
    features: ['80 simulations', 'All skills auto', 'Self-learning AI', '7 dodges'],
    priceAvax: '0.020', color: '#ef4444', icon: '🤖',
  },
];

export default function AutoPlayShopSection() {
  const { autoPlayLevel, setAutoPlayLevel, isPurchased, markPurchased } = useAutoPlayLevel();
  const [showLearning, setShowLearning] = useState(false);

  const handleBuy = (pkg: Package) => {
    // TODO: integrate with AVAX payment flow (like VIP purchase)
    // For now: mark as purchased in localStorage
    markPurchased(pkg.level);
    setAutoPlayLevel(pkg.level);
  };

  const learningSummary = showLearning ? getLearningSummary() : null;
  const learningEntries = learningSummary ? Object.entries(learningSummary) : [];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base font-bold text-farm-brown-dark flex items-center gap-1.5">
            🤖 Auto-Play AI
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Level: <span className="font-bold" style={{ color: PACKAGES[autoPlayLevel - 2]?.color ?? '#9ca3af' }}>
              Lv.{autoPlayLevel} {autoPlayLevel === 1 ? '(Free — Random)' : PACKAGES[autoPlayLevel - 2]?.name}
            </span>
          </p>
        </div>
        {autoPlayLevel >= 5 && (
          <button
            onClick={() => setShowLearning(!showLearning)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 active:scale-95 transition-transform"
          >
            {showLearning ? 'Hide' : 'AI Learning'}
          </button>
        )}
      </div>

      {/* Learning summary (Lv5 only) */}
      {showLearning && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700">Self-Learning Data</span>
            <button
              onClick={() => { resetWeights(); setShowLearning(false); }}
              className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-500 active:scale-95 transition-transform"
            >
              Reset
            </button>
          </div>
          {learningEntries.length === 0 && (
            <p className="text-[10px] text-gray-500">No data yet. Play with Auto Lv5 to start learning.</p>
          )}
          {learningEntries.map(([arch, data]) => (
            <div key={arch} className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-gray-700 capitalize">{arch.replace('_', ' ')}</span>
              <span className="text-gray-500">
                {data.wins}W/{data.losses}L
              </span>
              <span className="text-gray-600 font-mono">{data.insights}</span>
            </div>
          ))}
        </div>
      )}

      {/* Level selector (if multiple purchased) */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(lv => {
          const owned = isPurchased(lv);
          const isActive = autoPlayLevel === lv;
          return (
            <button
              key={lv}
              onClick={() => owned && setAutoPlayLevel(lv)}
              disabled={!owned}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                isActive
                  ? 'text-white'
                  : owned
                    ? 'bg-white text-gray-600 border border-gray-200 active:scale-95'
                    : 'bg-gray-100 text-gray-300'
              }`}
              style={isActive ? {
                background: PACKAGES[lv - 2]?.color ?? '#9ca3af',
                boxShadow: `0 2px 8px ${PACKAGES[lv - 2]?.color ?? '#9ca3af'}40`,
              } : undefined}
            >
              Lv{lv}
            </button>
          );
        })}
      </div>

      {/* Package cards */}
      <div className="grid grid-cols-2 gap-3">
        {PACKAGES.map(pkg => {
          const owned = isPurchased(pkg.level);
          return (
            <div
              key={pkg.level}
              className="bg-white rounded-xl p-3 relative overflow-hidden"
              style={{
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                borderWidth: 2,
                borderColor: owned ? `${pkg.color}60` : 'transparent',
              }}
            >
              {owned && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-bold text-white px-2 py-0.5 rounded-full"
                  style={{ background: pkg.color }}>
                  Owned
                </span>
              )}

              <div className="text-center mb-2">
                <span className="text-3xl block mb-1">{pkg.icon}</span>
                <span className="font-heading text-sm font-bold block" style={{ color: pkg.color }}>
                  Lv.{pkg.level} {pkg.name}
                </span>
                <span className="text-[10px] text-gray-500">{pkg.algorithm}</span>
              </div>

              <ul className="space-y-0.5 mb-3">
                {pkg.features.map((f, i) => (
                  <li key={i} className="text-[10px] text-gray-600 flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">+</span>
                    {f}
                  </li>
                ))}
              </ul>

              {owned ? (
                <button
                  onClick={() => setAutoPlayLevel(pkg.level)}
                  className={`w-full py-2 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                    autoPlayLevel === pkg.level
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  style={autoPlayLevel === pkg.level ? { background: pkg.color } : undefined}
                >
                  {autoPlayLevel === pkg.level ? 'Active' : 'Select'}
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(pkg)}
                  className="w-full py-2 rounded-lg text-[11px] font-bold text-white transition-all active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${pkg.color}cc, ${pkg.color})`,
                    boxShadow: `0 2px 8px ${pkg.color}40`,
                  }}
                >
                  {pkg.priceAvax} AVAX
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
