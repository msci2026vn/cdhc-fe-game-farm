// ═══════════════════════════════════════════════════════════════
// AutoPlayShopSection — VIP auto-play upgrade packages
// ═══════════════════════════════════════════════════════════════

import { useAutoPlayLevel } from '@/shared/hooks/useAutoPlayLevel';
import { getLearningSummary, resetWeights } from '@/shared/autoplay/auto-learner';
import { useState } from 'react';
import { toast } from 'sonner';

interface Package {
  level: number;
  name: string;
  nameVi: string;
  algorithm: string;
  features: string[];
  priceAvax: string;
  color: string;
  gradient: string;
  icon: string;
}

const PACKAGES: Package[] = [
  {
    level: 2, name: 'Basic', nameVi: 'Th\u00f4ng minh', algorithm: 'Greedy',
    features: ['Weighted scoring', 'Situation awareness'],
    priceAvax: '0.015', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    icon: '\u{1F9E0}',
  },
  {
    level: 3, name: 'Advanced', nameVi: 'N\u00e2ng cao', algorithm: 'Cascade',
    features: ['Cascade simulation', 'Auto-dodge', 'Auto Ot Hiem/Rom Boc'],
    priceAvax: '0.016', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    icon: '\u26A1',
  },
  {
    level: 4, name: 'Pro', nameVi: 'Chuy\u00ean gia', algorithm: 'MCTS 30',
    features: ['Monte Carlo search', 'Auto-ULT timing', '30 simulations'],
    priceAvax: '0.018', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    icon: '\u{1F3AF}',
  },
  {
    level: 5, name: 'Elite', nameVi: 'T\u1ED1i th\u01B0\u1EE3ng', algorithm: 'MCTS 80',
    features: ['80 simulations', 'All skills auto', 'Self-learning AI', '7 dodges'],
    priceAvax: '0.020', color: '#ec4899', gradient: 'linear-gradient(135deg, #ef4444, #ec4899, #8b5cf6)',
    icon: '\u{1F9E0}\u2728',
  },
];

const LEVEL_NAMES: Record<number, { name: string; nameVi: string; icon: string; color: string }> = {
  1: { name: 'Free', nameVi: 'C\u01A1 b\u1EA3n', icon: '\u{1F916}', color: '#9ca3af' },
  2: { name: 'Basic', nameVi: 'Th\u00f4ng minh', icon: '\u{1F9E0}', color: '#3b82f6' },
  3: { name: 'Advanced', nameVi: 'N\u00e2ng cao', icon: '\u26A1', color: '#8b5cf6' },
  4: { name: 'Pro', nameVi: 'Chuy\u00ean gia', icon: '\u{1F3AF}', color: '#f59e0b' },
  5: { name: 'Elite', nameVi: 'T\u1ED1i th\u01B0\u1EE3ng', icon: '\u{1F9E0}\u2728', color: '#ec4899' },
};

export default function AutoPlayShopSection() {
  const { autoPlayLevel, setAutoPlayLevel, isPurchased, markPurchased } = useAutoPlayLevel();
  const [showLearning, setShowLearning] = useState(false);

  const handleSelectLevel = (level: number) => {
    if (level === autoPlayLevel) return;
    setAutoPlayLevel(level);
    const info = LEVEL_NAMES[level];
    toast.success(`\u2705 \u0110\u00e3 ch\u1ECDn Auto AI Lv.${level} \u2014 ${info.nameVi} ${info.icon}`, {
      duration: 2500,
      style: {
        background: '#1a1a2e',
        color: 'white',
        border: `2px solid ${info.color}`,
      },
    });
  };

  const handleBuy = (pkg: Package) => {
    // TODO: integrate with AVAX payment flow (like VIP purchase)
    // For now: mark as purchased in localStorage
    markPurchased(pkg.level);
    handleSelectLevel(pkg.level);
  };

  const learningSummary = showLearning ? getLearningSummary() : null;
  const learningEntries = learningSummary ? Object.entries(learningSummary) : [];

  const currentInfo = LEVEL_NAMES[autoPlayLevel] ?? LEVEL_NAMES[1];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base font-bold text-farm-brown-dark flex items-center gap-1.5">
            {currentInfo.icon} Auto-Play AI
          </h2>
          <p className="text-[12px] font-bold mt-0.5" style={{ color: currentInfo.color }}>
            \u0110ang d\u00f9ng: Lv.{autoPlayLevel} {currentInfo.name} {currentInfo.icon}
          </p>
        </div>
        {autoPlayLevel >= 5 && (
          <button
            onClick={() => setShowLearning(!showLearning)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 active:scale-95 transition-transform"
          >
            {showLearning ? 'Hide' : '\u{1F4DA} AI Learning'}
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

      {/* Level quick-selector */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(lv => {
          const owned = isPurchased(lv);
          const isActive = autoPlayLevel === lv;
          const info = LEVEL_NAMES[lv];
          return (
            <button
              key={lv}
              onClick={() => owned && handleSelectLevel(lv)}
              disabled={!owned}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                isActive
                  ? 'text-white ring-2 ring-offset-1'
                  : owned
                    ? 'bg-white text-gray-600 border border-gray-200 active:scale-95'
                    : 'bg-gray-100 text-gray-300'
              }`}
              style={isActive ? {
                background: info.color,
                boxShadow: `0 2px 8px ${info.color}40`,
                ringColor: info.color,
              } : undefined}
            >
              {isActive && '\u2705 '}Lv{lv}
            </button>
          );
        })}
      </div>

      {/* Package cards */}
      <div className="grid grid-cols-2 gap-3">
        {PACKAGES.map(pkg => {
          const owned = isPurchased(pkg.level);
          const isActive = autoPlayLevel === pkg.level;
          return (
            <div
              key={pkg.level}
              className="rounded-xl p-3 relative overflow-hidden transition-all"
              style={{
                background: isActive ? `${pkg.color}08` : 'white',
                boxShadow: isActive
                  ? `0 0 0 2px ${pkg.color}, 0 4px 15px ${pkg.color}30`
                  : '0 4px 15px rgba(0,0,0,0.08)',
                borderWidth: 2,
                borderColor: isActive ? pkg.color : owned ? `${pkg.color}40` : 'transparent',
              }}
            >
              {/* Active checkmark badge */}
              {isActive && (
                <span className="absolute top-1.5 right-1.5 text-lg leading-none"
                  style={{ filter: `drop-shadow(0 0 4px ${pkg.color})` }}>
                  \u2705
                </span>
              )}

              {/* Owned badge (non-active) */}
              {owned && !isActive && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-bold text-white px-2 py-0.5 rounded-full"
                  style={{ background: `${pkg.color}80` }}>
                  Owned
                </span>
              )}

              <div className="text-center mb-2">
                <span className="text-3xl block mb-1">{pkg.icon}</span>
                <span className="font-heading text-sm font-bold block" style={{ color: pkg.color }}>
                  Lv.{pkg.level} {pkg.name}
                </span>
                <span className="text-[10px] text-gray-500">{pkg.algorithm} \u2014 {pkg.nameVi}</span>
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
                  onClick={() => handleSelectLevel(pkg.level)}
                  className={`w-full py-2 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                    isActive
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={isActive ? { background: pkg.gradient } : undefined}
                >
                  {isActive ? '\u2705 \u0110ang d\u00f9ng' : 'Ch\u1ECDn'}
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(pkg)}
                  className="w-full py-2 rounded-lg text-[11px] font-bold text-white transition-all active:scale-95"
                  style={{
                    background: pkg.gradient,
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
