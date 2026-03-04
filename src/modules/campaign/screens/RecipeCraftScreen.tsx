// ═══════════════════════════════════════════════════════════════
// RecipeCraftScreen — 3 tabs: Craft / Inventory / Buffs
// Route: /campaign/recipes
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeDefinitions, useRecipeInventory, useActiveFarmBuffs, useCraftRecipe, useSellRecipe, useUseRecipe } from '@/shared/api/api-recipes';
import { usePlayerFragments } from '@/shared/api/api-fragments';
import { useOgn } from '@/shared/hooks/usePlayerProfile';
import RecipeCard from '../components/RecipeCard';
import { TIER_CONFIG, ZONE_NAMES } from '../types/fragment.types';
import type { FragmentTier } from '../types/fragment.types';
import type { PlayerRecipe, ActiveFarmBuff } from '../types/recipe.types';
import { MAX_BUFF_SLOTS } from '../types/recipe.types';
import { playSound } from '@/shared/audio';
import { AnimatedNumber } from '@/shared/components/AnimatedNumber';
import { toast } from 'sonner';

type TabKey = 'craft' | 'inventory' | 'buffs';
type TierFilter = 'all' | FragmentTier;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'craft', label: 'Chế Tạo' },
  { key: 'inventory', label: 'Kho CT' },
  { key: 'buffs', label: 'Buff' },
];

const TIER_FILTERS: { key: TierFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'common', label: '\u2b1c' },
  { key: 'rare', label: '\ud83d\udfe6' },
  { key: 'legendary', label: '\ud83d\udfea' },
];

export default function RecipeCraftScreen() {
  const navigate = useNavigate();
  const ogn = useOgn();

  // Data hooks
  const { data: definitions, isLoading: loadingDefs } = useRecipeDefinitions();
  const { data: inventory, isLoading: loadingInv } = useRecipeInventory();
  const { data: buffs, isLoading: loadingBuffs } = useActiveFarmBuffs();
  const { data: fragments } = usePlayerFragments();

  // Mutations
  const craftMutation = useCraftRecipe();
  const sellMutation = useSellRecipe();
  const useMutation = useUseRecipe();

  // UI state
  const [activeTab, setActiveTab] = useState<TabKey>('craft');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [zoneFilter, setZoneFilter] = useState<number>(0); // 0 = all
  const [craftingKey, setCraftingKey] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'craft' | 'sell' | 'use'; key: string; name: string } | null>(null);

  // ─── Craft flow ────────────────────────────────────────────
  const handleCraft = useCallback((recipeKey: string) => {
    const def = definitions?.find(d => d.recipeKey === recipeKey);
    if (def) setConfirmAction({ type: 'craft', key: recipeKey, name: def.name });
  }, [definitions]);

  const handleSell = useCallback((recipeKey: string, name: string) => {
    setConfirmAction({ type: 'sell', key: recipeKey, name });
  }, []);

  const handleUse = useCallback((recipeKey: string, name: string) => {
    const activeCount = buffs?.length ?? 0;
    if (activeCount >= MAX_BUFF_SLOTS) {
      playSound('damage_dealt');
      return;
    }
    setConfirmAction({ type: 'use', key: recipeKey, name });
  }, [buffs]);

  const executeConfirm = async () => {
    if (!confirmAction) return;
    const { type, key } = confirmAction;
    setConfirmAction(null);

    try {
      if (type === 'craft') {
        setCraftingKey(key);
        await craftMutation.mutateAsync(key);
        playSound('level_up');
      } else if (type === 'sell') {
        await sellMutation.mutateAsync(key);
        playSound('coin_collect');
      } else if (type === 'use') {
        await useMutation.mutateAsync(key);
        playSound('level_up');
      }
    } catch {
      playSound('damage_dealt');
      toast.error('Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setCraftingKey(null);
    }
  };

  // ─── Filter definitions ────────────────────────────────────
  const filteredDefs = (definitions ?? []).filter(d => {
    if (tierFilter !== 'all' && d.tier !== tierFilter) return false;
    if (zoneFilter > 0 && d.zoneNumber !== zoneFilter) return false;
    return true;
  });

  const activeBuffCount = buffs?.length ?? 0;

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-safe pb-2">
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => { playSound('ui_click'); navigate(-1); }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            &larr;
          </button>
          <h1 className="font-heading font-bold text-lg text-white">Cong Thuc</h1>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(253,203,110,0.15)', border: '1px solid rgba(253,203,110,0.2)' }}>
            <span className="text-sm">💰</span>
            <span className="text-xs font-bold text-yellow-300">
              <AnimatedNumber value={ogn} />
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1.5 mt-3">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); playSound('ui_tab'); }}
              className={`flex-1 py-2 rounded-full text-[12px] font-bold transition-all relative ${
                tab.key === activeTab
                  ? 'bg-amber-600 text-white'
                  : 'text-white/50'
              }`}
              style={tab.key !== activeTab ? { background: 'rgba(255,255,255,0.05)' } : { boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}
            >
              {tab.label}
              {tab.key === 'buffs' && activeBuffCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {activeBuffCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-2 pb-28 scrollbar-hide">
        {activeTab === 'craft' && (
          <CraftTab
            definitions={filteredDefs}
            fragments={fragments ?? []}
            isLoading={loadingDefs}
            tierFilter={tierFilter}
            zoneFilter={zoneFilter}
            onTierFilter={setTierFilter}
            onZoneFilter={setZoneFilter}
            onCraft={handleCraft}
            craftingKey={craftingKey}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            recipes={inventory ?? []}
            definitions={definitions ?? []}
            isLoading={loadingInv}
            onSell={handleSell}
            onUse={handleUse}
            activeBuffCount={activeBuffCount}
          />
        )}

        {activeTab === 'buffs' && (
          <BuffsTab
            buffs={buffs ?? []}
            isLoading={loadingBuffs}
          />
        )}
      </div>

      {/* Confirm modal */}
      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          onConfirm={executeConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 1: Craft — Browse & craft recipes
// ═══════════════════════════════════════════════════════════════

function CraftTab({
  definitions, fragments, isLoading, tierFilter, zoneFilter,
  onTierFilter, onZoneFilter, onCraft, craftingKey,
}: {
  definitions: import('../types/recipe.types').RecipeDefinition[];
  fragments: import('../types/fragment.types').PlayerFragment[];
  isLoading: boolean;
  tierFilter: TierFilter;
  zoneFilter: number;
  onTierFilter: (f: TierFilter) => void;
  onZoneFilter: (z: number) => void;
  onCraft: (key: string) => void;
  craftingKey: string | null;
}) {
  return (
    <>
      {/* Tier filter */}
      <div className="flex gap-1.5 mb-2">
        {TIER_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => onTierFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              f.key === tierFilter ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Zone filter */}
      <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => onZoneFilter(0)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all shrink-0 ${
            zoneFilter === 0 ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/40'
          }`}
        >
          All
        </button>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(z => (
          <button
            key={z}
            onClick={() => onZoneFilter(z)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all shrink-0 ${
              zoneFilter === z ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/40'
            }`}
          >
            Z{z}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : definitions.length === 0 ? (
        <EmptyState emoji="📜" text="Không có công thức" sub="Thử đổi tier hoặc zone" />
      ) : (
        <div className="space-y-3">
          {definitions.map(d => (
            <RecipeCard
              key={d.recipeKey}
              recipe={d}
              playerFragments={fragments}
              onCraft={onCraft}
              isCrafting={craftingKey === d.recipeKey}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 2: Inventory — Crafted recipes, sell/use
// ═══════════════════════════════════════════════════════════════

function InventoryTab({
  recipes, definitions, isLoading, onSell, onUse, activeBuffCount,
}: {
  recipes: PlayerRecipe[];
  definitions: import('../types/recipe.types').RecipeDefinition[];
  isLoading: boolean;
  onSell: (key: string, name: string) => void;
  onUse: (key: string, name: string) => void;
  activeBuffCount: number;
}) {
  if (isLoading) return <LoadingSpinner />;
  if (recipes.length === 0) return <EmptyState emoji="📦" text="Kho trống" sub="Chế tạo công thức để sử dụng!" />;

  return (
    <div className="space-y-2">
      {recipes.map(r => {
        const cfg = TIER_CONFIG[r.tier];
        const def = definitions.find(d => d.recipeKey === r.recipeKey);
        const sellPrice = def?.sellPrice ?? 0;
        const buffFull = activeBuffCount >= MAX_BUFF_SLOTS;

        return (
          <div
            key={r.recipeKey}
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <span className="text-2xl">{cfg.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate">{r.name}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${cfg.color}20`, color: cfg.color }}>
                  x{r.quantity}
                </span>
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">
                Zone {r.zoneNumber} · {ZONE_NAMES[r.zoneNumber] ?? ''}
                {def && (
                  <span className="ml-2 text-yellow-400/60">{sellPrice} OGN</span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => onUse(r.recipeKey, r.name)}
                disabled={buffFull}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                  buffFull
                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                    : 'bg-green-600 text-white'
                }`}
              >
                Dùng
              </button>
              <button
                onClick={() => onSell(r.recipeKey, r.name)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-yellow-600/80 text-white transition-all active:scale-95"
              >
                Bán
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 3: Buffs — Active farm buffs with countdown
// ═══════════════════════════════════════════════════════════════

function BuffsTab({ buffs, isLoading }: { buffs: ActiveFarmBuff[]; isLoading: boolean }) {
  const [, setTick] = useState(0);

  // Countdown ticker every second
  useEffect(() => {
    if (buffs.length === 0) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [buffs.length]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      {/* Slots indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-[11px] text-white/40">Slots:</span>
        {Array.from({ length: MAX_BUFF_SLOTS }, (_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
              i < buffs.length ? '' : 'opacity-20'
            }`}
            style={{
              background: i < buffs.length ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
              border: `2px solid ${i < buffs.length ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {i < buffs.length ? '✅' : '⬜'}
          </div>
        ))}
        <span className="text-[11px] text-white/40">{buffs.length}/{MAX_BUFF_SLOTS}</span>
      </div>

      {buffs.length === 0 ? (
        <EmptyState emoji="✨" text="Chưa có buff" sub="Dùng công thức đã chế tạo để nhận buff!" />
      ) : (
        <div className="space-y-2">
          {buffs.map(buff => {
            const cfg = TIER_CONFIG[buff.tier];
            const remaining = Math.max(0, new Date(buff.expiresAt).getTime() - Date.now());
            const hours = Math.floor(remaining / 3_600_000);
            const mins = Math.floor((remaining % 3_600_000) / 60_000);
            const secs = Math.floor((remaining % 60_000) / 1_000);
            const expired = remaining <= 0;

            return (
              <div
                key={buff.id}
                className={`rounded-xl p-3.5 transition-all ${expired ? 'opacity-40' : ''}`}
                style={{
                  background: cfg.bg,
                  border: `2px solid ${cfg.border}`,
                  boxShadow: expired ? 'none' : cfg.glow,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cfg.emoji}</span>
                    <span className="text-sm font-bold text-white">{buff.name}</span>
                  </div>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${cfg.color}20`, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] mb-2">
                  {buff.yieldBonus > 0 && (
                    <span className="text-green-400">+{Math.round(buff.yieldBonus * 100)}% yield</span>
                  )}
                  {buff.timeReduction > 0 && (
                    <span className="text-blue-400">-{Math.round(buff.timeReduction * 100)}% time</span>
                  )}
                </div>

                {/* Countdown */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (remaining / (buff.remainingMs || remaining || 1)) * 100)}%`,
                        background: expired ? '#ef4444' : cfg.color,
                      }}
                    />
                  </div>
                  <span className={`text-xs font-mono font-bold ${expired ? 'text-red-400' : 'text-white/70'}`}>
                    {expired ? 'Hết hạn' : `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Confirm Modal
// ═══════════════════════════════════════════════════════════════

function ConfirmModal({
  action,
  onConfirm,
  onCancel,
}: {
  action: { type: 'craft' | 'sell' | 'use'; key: string; name: string };
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const labels = {
    craft: { title: 'Xác nhận Chế Tạo', desc: `Chế tạo "${action.name}"?`, btn: 'Chế Tạo', color: 'bg-amber-600' },
    sell: { title: 'Xác nhận Bán', desc: `Bán "${action.name}"?`, btn: 'Bán', color: 'bg-yellow-600' },
    use: { title: 'Xác nhận Sử Dụng', desc: `Dùng "${action.name}" làm buff nông trại?`, btn: 'Dùng', color: 'bg-green-600' },
  };

  const cfg = labels[action.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-gray-900 border border-white/10 rounded-2xl p-5 w-full max-w-xs"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-white mb-2">{cfg.title}</h3>
        <p className="text-sm text-white/60 mb-5">{cfg.desc}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/60 bg-white/5 active:scale-95 transition-transform"
          >
            Huy
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white ${cfg.color} active:scale-95 transition-transform`}
          >
            {cfg.btn}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Shared helpers
// ═══════════════════════════════════════════════════════════════

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ emoji, text, sub }: { emoji: string; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-3">{emoji}</span>
      <p className="text-white/50 font-medium">{text}</p>
      <p className="text-white/30 text-sm mt-1">{sub}</p>
    </div>
  );
}
