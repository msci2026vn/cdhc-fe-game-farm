import { useState, useCallback, useMemo } from 'react';
import { useAllocateStats } from '../hooks/useAllocateStats';
import { useAutoAllocateStats } from '../hooks/useAutoAllocateStats';
import { STAT_CONFIG } from '../utils/stat-constants';
import { MilestonePopup } from './MilestonePopup';
import type { MilestoneNextInfo, MilestoneInfo, AllocateStatsResponse } from '../types/game-api.types';
import { playSound } from '../audio';

interface StatAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  freePoints: number;
  currentStats: { atk: number; hp: number; def: number; mana: number };
  effectiveStats: { atk: number; hp: number; def: number; mana: number };
  nextMilestones: MilestoneNextInfo[];
  autoPreset: string | null;
  autoEnabled: boolean;
}

type StatKey = 'atk' | 'hp' | 'def' | 'mana';

const STAT_META: { key: StatKey; emoji: string; label: string; color: string; bg: string; perPoint: number }[] = [
  { key: 'atk', emoji: '⚔️', label: 'ATK', color: '#e74c3c', bg: 'linear-gradient(135deg, #ffe0e0, #ffb3b3)', perPoint: STAT_CONFIG.PER_POINT.ATK },
  { key: 'hp', emoji: '❤️', label: 'HP', color: '#4eca6a', bg: 'linear-gradient(135deg, #d4f8dc, #a8e6a0)', perPoint: STAT_CONFIG.PER_POINT.HP },
  { key: 'def', emoji: '🛡️', label: 'DEF', color: '#3498db', bg: 'linear-gradient(135deg, #d4eeff, #a8d4f0)', perPoint: STAT_CONFIG.PER_POINT.DEF },
  { key: 'mana', emoji: '✨', label: 'Mana', color: '#9b59b6', bg: 'linear-gradient(135deg, #f0d4ff, #d4a8f0)', perPoint: STAT_CONFIG.PER_POINT.MANA },
];

const PRESETS: { key: 'attack' | 'defense' | 'balance'; emoji: string; label: string }[] = [
  { key: 'attack', emoji: '⚔️', label: 'Tấn công' },
  { key: 'defense', emoji: '🛡️', label: 'Phòng thủ' },
  { key: 'balance', emoji: '✨', label: 'Cân bằng' },
];

/**
 * Must match BE stat-config.ts PRESETS + calculateAutoAllocation logic.
 * attack: {atk:2, hp:1, def:0, mana:0} per 3 pts
 * defense: {atk:0, hp:1, def:1, mana:1} per 3 pts
 * balance: rotation of 4 rounds, each 3 pts
 */
function getPresetAllocation(preset: 'attack' | 'defense' | 'balance', points: number) {
  const result = { atk: 0, hp: 0, def: 0, mana: 0 };
  if (points <= 0) return result;

  if (preset === 'balance') {
    // Match BE BALANCE_ROTATION: 4 rounds cycling
    const rotation = [
      { atk: 1, hp: 1, def: 1, mana: 0 },
      { atk: 1, hp: 1, def: 0, mana: 1 },
      { atk: 1, hp: 0, def: 1, mana: 1 },
      { atk: 0, hp: 1, def: 1, mana: 1 },
    ];
    let remaining = points;
    let roundIdx = 0;
    while (remaining > 0) {
      const round = rotation[roundIdx % rotation.length]!;
      for (const key of ['atk', 'hp', 'def', 'mana'] as const) {
        if (remaining <= 0) break;
        const add = Math.min(round[key], remaining);
        result[key] += add;
        remaining -= add;
      }
      roundIdx++;
    }
    return result;
  }

  // attack & defense: fixed pattern per round
  const patterns: Record<string, { atk: number; hp: number; def: number; mana: number }> = {
    attack: { atk: 2, hp: 1, def: 0, mana: 0 },
    defense: { atk: 0, hp: 1, def: 1, mana: 1 },
  };
  const pattern = patterns[preset]!;
  let remaining = points;
  while (remaining > 0) {
    for (const key of ['atk', 'hp', 'def', 'mana'] as const) {
      if (remaining <= 0) break;
      const add = Math.min(pattern[key], remaining);
      result[key] += add;
      remaining -= add;
    }
  }
  return result;
}

export function StatAllocationModal({
  isOpen,
  onClose,
  freePoints,
  currentStats,
  effectiveStats,
  nextMilestones,
  autoPreset: initialAutoPreset,
  autoEnabled: initialAutoEnabled,
}: StatAllocationModalProps) {
  const [pending, setPending] = useState({ atk: 0, hp: 0, def: 0, mana: 0 });
  const [selectedPreset, setSelectedPreset] = useState<'attack' | 'defense' | 'balance' | null>(null);
  const [milestonePopup, setMilestonePopup] = useState<MilestoneInfo | null>(null);
  const [errorModal, setErrorModal] = useState<{ message: string; code: string } | null>(null);

  const allocateStats = useAllocateStats();
  const autoAllocateStats = useAutoAllocateStats();

  const totalPending = pending.atk + pending.hp + pending.def + pending.mana;
  const remaining = freePoints - totalPending;

  const handleIncrement = useCallback((key: StatKey) => {
    if (remaining <= 0) return;
    playSound('ui_click');
    setPending((p) => ({ ...p, [key]: p[key] + 1 }));
    setSelectedPreset(null);
  }, [remaining]);

  const handleDecrement = useCallback((key: StatKey) => {
    if (pending[key] <= 0) return;
    playSound('ui_click');
    setPending((p) => ({ ...p, [key]: p[key] - 1 }));
    setSelectedPreset(null);
  }, [pending]);

  const handlePreset = useCallback((preset: 'attack' | 'defense' | 'balance') => {
    playSound('ui_tab');
    const alloc = getPresetAllocation(preset, freePoints);
    setPending(alloc);
    setSelectedPreset(preset);
  }, [freePoints]);

  const previewEffective = useMemo(() => ({
    atk: effectiveStats.atk + pending.atk * STAT_CONFIG.PER_POINT.ATK,
    hp: effectiveStats.hp + pending.hp * STAT_CONFIG.PER_POINT.HP,
    def: effectiveStats.def + pending.def * STAT_CONFIG.PER_POINT.DEF,
    mana: effectiveStats.mana + pending.mana * STAT_CONFIG.PER_POINT.MANA,
  }), [effectiveStats, pending]);

  const handleSubmit = useCallback(() => {
    if (totalPending === 0) return;
    playSound('shop_confirm');

    const onSuccess = (data: AllocateStatsResponse) => {
      if (data.newMilestones?.length > 0) {
        setMilestonePopup(data.newMilestones[0]);
      } else {
        onClose();
      }
      setPending({ atk: 0, hp: 0, def: 0, mana: 0 });
      setSelectedPreset(null);
    };

    const onError = (err: any) => {
      setErrorModal({
        message: err.message || 'Không thể phân bổ chỉ số',
        code: err.code || 'UNKNOWN'
      });
    };

    if (selectedPreset) {
      autoAllocateStats.mutate(selectedPreset, { onSuccess, onError });
    } else {
      allocateStats.mutate(pending, { onSuccess, onError });
    }
  }, [totalPending, selectedPreset, pending, allocateStats, autoAllocateStats, onClose]);

  if (!isOpen) return null;

  const isPending = allocateStats.isPending || autoAllocateStats.isPending;

  return (
    <>
      <div className="fixed inset-0 popup-overlay z-50 flex items-center justify-center px-4 animate-fade-in" onClick={onClose}>
        <div
          className="bg-farm-paper w-full max-w-sm rounded-2xl border-4 border-[#8c6239] shadow-2xl overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 4 Corner nails */}
          <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#5d4037] border border-[#a1887f] shadow-inner"></div>
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#5d4037] border border-[#a1887f] shadow-inner"></div>
          <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#5d4037] border border-[#a1887f] shadow-inner"></div>
          <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#5d4037] border border-[#a1887f] shadow-inner"></div>

          {/* Header */}
          <div className="bg-[#8c6239] p-4 text-center border-b-4 border-[#5d4037] relative">
            <h2 className="font-display font-bold text-xl text-[#fefae0] text-outline tracking-wider">Phân bổ chỉ số</h2>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-[#fefae0] px-4 py-1 rounded-full border-2 border-[#8c6239] shadow-sm z-10 w-max">
              <span className="text-sm font-bold text-farm-brown-dark whitespace-nowrap">🎯 Còn lại: <span className="text-farm-carrot">{remaining}</span> điểm</span>
            </div>
          </div>

          <div className="p-6 pt-8 space-y-4">
            {/* Stat rows */}
            {STAT_META.map((stat) => {
              const current = effectiveStats[stat.key];
              const preview = previewEffective[stat.key];
              const changed = pending[stat.key] > 0;
              const milestone = nextMilestones.find((m) => m.stat === stat.key);

              const maxVal = stat.key === 'hp' ? 5000 : stat.key === 'atk' ? 2000 : stat.key === 'mana' ? 1500 : 1000;
              const progressPct = Math.min(100, (preview / maxVal) * 100);

              let iconBg = "bg-red-100";
              if (stat.key === "hp") iconBg = "bg-green-100";
              else if (stat.key === "def") iconBg = "bg-blue-100";
              else if (stat.key === "mana") iconBg = "bg-purple-100";

              return (
                <div key={stat.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between bg-white/50 p-2 rounded-xl border border-[#d4c5a3]">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center text-lg shadow-sm`}>{stat.emoji}</div>
                      <span className="font-bold text-farm-brown-dark">{stat.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDecrement(stat.key)}
                        disabled={pending[stat.key] <= 0 || isPending}
                        className="stats-btn stats-btn-minus material-symbols-outlined text-lg disabled:opacity-50"
                      >
                        remove
                      </button>
                      <span className="font-display font-bold text-lg w-8 text-center text-farm-brown-dark">
                        {changed ? preview : current}
                      </span>
                      <button
                        onClick={() => handleIncrement(stat.key)}
                        disabled={remaining <= 0 || isPending}
                        className="stats-btn stats-btn-plus material-symbols-outlined text-lg disabled:opacity-50"
                      >
                        add
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden mx-1">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, background: stat.color }} />
                  </div>

                  {/* Milestone hint */}
                  {milestone ? (
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold ml-2">
                      <span className="material-symbols-outlined text-sm text-yellow-500">lightbulb</span>
                      Còn {milestone.remaining} → <span className="text-farm-brown">{milestone.name}</span>
                    </div>
                  ) : (
                    <div className="h-2"></div>
                  )}
                </div>
              );
            })}

            {/* Presets */}
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px bg-[#d4c5a3] flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nhanh</span>
                <div className="h-px bg-[#d4c5a3] flex-1"></div>
              </div>
              <div className="flex justify-between gap-2">
                {PRESETS.map((p) => {
                  let icon = "⚔️";
                  if (p.key === "defense") icon = "🛡️";
                  else if (p.key === "balance") icon = "✨";

                  return (
                    <button
                      key={p.key}
                      onClick={() => handlePreset(p.key)}
                      disabled={isPending}
                      className={`flex-1 py-1.5 border border-[#d4c5a3] rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1 ${selectedPreset === p.key
                          ? 'bg-farm-green-light text-white border-farm-green-dark'
                          : 'bg-[#fefae0] text-farm-brown-dark hover:bg-white'
                        }`}
                    >
                      <span>{icon}</span> {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 mt-4 pt-2">
              <button
                onClick={onClose}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl font-bold font-display text-farm-brown-dark bg-[#e5e7eb] border-b-4 border-[#9ca3af] active:border-b-2 active:translate-y-[2px] transition-all"
              >
                Đóng
              </button>
              <button
                onClick={handleSubmit}
                disabled={totalPending === 0 || isPending}
                className="flex-1 py-3 rounded-xl font-bold font-display text-[#fefae0] bg-farm-green-light border-b-4 border-farm-green-dark active:border-b-2 active:translate-y-[2px] transition-all shadow-lg disabled:opacity-50"
              >
                {isPending ? '...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone celebration popup */}
      {milestonePopup && (
        <MilestonePopup
          milestone={milestonePopup}
          isOpen={true}
          onClose={() => {
            setMilestonePopup(null);
            onClose();
          }}
        />
      )}

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 animate-fade-in" onClick={() => setErrorModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-[320px] w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="font-heading text-lg font-bold mb-2">Lỗi phân bổ</h3>
              <p className="text-sm text-gray-600 mb-6">
                {errorModal.code === 'INSUFFICIENT_OGN'
                  ? 'Bạn không có đủ OGN để thực hiện thao tác này.'
                  : errorModal.message}
              </p>
              <button
                onClick={() => setErrorModal(null)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-gray-500 to-gray-600 active:scale-95 shadow-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
