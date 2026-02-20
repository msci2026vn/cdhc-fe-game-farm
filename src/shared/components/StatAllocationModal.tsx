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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in" onClick={onClose}>
        <div
          className="bg-white rounded-2xl max-w-[380px] w-full mx-4 shadow-2xl max-h-[85dvh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 pb-2 text-center flex-shrink-0">
            <h3 className="font-heading text-lg font-bold">Phân bổ chỉ số</h3>
            <div className="inline-flex items-center gap-1.5 mt-1 bg-amber-50 px-3 py-1 rounded-full">
              <span className="text-sm">🎯</span>
              <span className="text-sm font-bold text-amber-700">
                Còn lại: <span className="text-amber-500">{remaining}</span> điểm
              </span>
            </div>
          </div>

          {/* Stats list — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
            <div className="space-y-2.5">
              {STAT_META.map((stat) => {
                const current = effectiveStats[stat.key];
                const preview = previewEffective[stat.key];
                const changed = pending[stat.key] > 0;
                const milestone = nextMilestones.find((m) => m.stat === stat.key);
                // Progress bar — normalize to a rough max for visual
                const maxVal = stat.key === 'hp' ? 5000 : stat.key === 'atk' ? 2000 : stat.key === 'mana' ? 1500 : 1000;
                const progressPct = Math.min(100, (preview / maxVal) * 100);

                return (
                  <div key={stat.key} className="bg-gray-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: stat.bg }}>
                        {stat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold">{stat.label}</span>
                        <span className="text-[10px] text-gray-500 ml-1.5">
                          {current}
                          {changed && (
                            <span className="text-green-600 font-bold"> → {preview} (+{pending[stat.key] * stat.perPoint})</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDecrement(stat.key)}
                          disabled={pending[stat.key] <= 0 || isPending}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-sm font-bold flex items-center justify-center active:scale-90 disabled:opacity-30 disabled:active:scale-100"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-amber-600">{pending[stat.key]}</span>
                        <button
                          onClick={() => handleIncrement(stat.key)}
                          disabled={remaining <= 0 || isPending}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-sm font-bold flex items-center justify-center active:scale-90 disabled:opacity-30 disabled:active:scale-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, background: stat.color }} />
                    </div>
                    {/* Milestone hint */}
                    {milestone && (
                      <p className="text-[9px] text-gray-400 mt-0.5">
                        💡 Còn {milestone.remaining} → {milestone.name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Presets */}
            <div className="mt-3">
              <p className="text-[10px] font-bold text-gray-400 text-center mb-1.5">── Nhanh ──</p>
              <div className="flex gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handlePreset(p.key)}
                    disabled={isPending}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${selectedPreset === p.key
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer — fixed */}
          <div className="p-4 pt-2 flex-shrink-0 border-t border-gray-100">
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 active:bg-gray-200"
              >
                Đóng
              </button>
              <button
                onClick={handleSubmit}
                disabled={totalPending === 0 || isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-amber-500 active:scale-95 shadow-lg disabled:opacity-50"
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
