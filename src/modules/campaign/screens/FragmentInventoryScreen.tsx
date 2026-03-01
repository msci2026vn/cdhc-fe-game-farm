// ═══════════════════════════════════════════════════════════════
// FragmentInventoryScreen — Full inventory grid grouped by zone
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerFragments } from '@/shared/api/api-fragments';
import FragmentCard from '../components/FragmentCard';
import { TIER_CONFIG, ZONE_NAMES } from '../types/fragment.types';
import type { FragmentTier } from '../types/fragment.types';
import { playSound } from '@/shared/audio';

type FilterTab = 'all' | FragmentTier;

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tat ca' },
  { key: 'common', label: '\u2b1c Thuong' },
  { key: 'rare', label: '\ud83d\udfe6 Hiem' },
  { key: 'legendary', label: '\ud83d\udfea H.Thoai' },
];

export default function FragmentInventoryScreen() {
  const navigate = useNavigate();
  const { data: fragments, isLoading, isError } = usePlayerFragments();
  const [activeTier, setActiveTier] = useState<FilterTab>('all');

  const filtered = activeTier === 'all'
    ? fragments ?? []
    : (fragments ?? []).filter(f => f.tier === activeTier);

  // Group by zone
  const grouped = new Map<number, typeof filtered>();
  for (const frag of filtered) {
    const list = grouped.get(frag.zoneNumber) ?? [];
    list.push(frag);
    grouped.set(frag.zoneNumber, list);
  }

  // Sort by zone number
  const sortedZones = [...grouped.entries()].sort((a, b) => a[0] - b[0]);

  const totalCount = (fragments ?? []).reduce((sum, f) => sum + f.quantity, 0);

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center px-5 pt-safe pb-3 border-b border-white/5">
        <button
          onClick={() => { playSound('ui_click'); navigate(-1); }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <span className="text-white/70">&larr;</span>
        </button>
        <h1 className="font-heading text-lg font-bold text-white">Kho Manh</h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
          <span className="text-sm">{'\ud83e\udde9'}</span>
          <span className="font-heading text-sm font-bold text-purple-300">{totalCount}</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex-shrink-0 flex gap-1.5 px-5 py-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTier(tab.key); playSound('ui_tab'); }}
            className={`flex-1 py-2 rounded-full text-[11px] font-bold transition-all ${
              tab.key === activeTier
                ? 'bg-purple-600 text-white'
                : 'text-white/50'
            }`}
            style={
              tab.key !== activeTier
                ? { background: 'rgba(255,255,255,0.05)' }
                : { boxShadow: '0 4px 12px rgba(168,85,247,0.3)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-2 pb-28">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-60">
            <div className="w-10 h-10 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-3" />
            <p className="text-white/40 text-sm">Dang tai...</p>
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <span className="text-4xl mb-3">😿</span>
            <p className="text-white/50 font-medium">Khong tai duoc du lieu</p>
            <p className="text-white/30 text-sm mt-1">Vui long thu lai sau</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <span className="text-5xl mb-3">{'\ud83e\udde9'}</span>
            <p className="text-white/50 font-medium">Chua co manh nao</p>
            <p className="text-white/30 text-sm mt-1">Danh boss de nhan manh!</p>
            <button
              onClick={() => navigate('/campaign')}
              className="mt-4 px-5 py-2 bg-purple-600 text-white rounded-full text-sm font-bold active:scale-95 transition-transform"
            >
              Di danh boss
            </button>
          </div>
        )}

        {/* Zone groups */}
        {sortedZones.map(([zoneNum, frags]) => (
          <div key={zoneNum} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                Zone {zoneNum}: {ZONE_NAMES[zoneNum] ?? `Zone ${zoneNum}`}
              </span>
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {frags.map(frag => (
                <FragmentCard
                  key={frag.fragmentKey}
                  name={frag.name}
                  tier={frag.tier}
                  zoneNumber={frag.zoneNumber}
                  quantity={frag.quantity}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
