// ═══════════════════════════════════════════════════════════════
// RecipeCard — Recipe definition card with ingredients check
// ═══════════════════════════════════════════════════════════════

import { TIER_CONFIG, ZONE_NAMES } from '../types/fragment.types';
import type { RecipeDefinition } from '../types/recipe.types';
import type { PlayerFragment } from '../types/fragment.types';
import { useTranslation } from 'react-i18next';

interface RecipeCardProps {
  recipe: RecipeDefinition;
  playerFragments: PlayerFragment[];
  onCraft: (recipeKey: string) => void;
  isCrafting: boolean;
}

export default function RecipeCard({ recipe, playerFragments, onCraft, isCrafting }: RecipeCardProps) {
  const { t } = useTranslation();
  const cfg = TIER_CONFIG[recipe.tier];

  // Check each ingredient against player's fragment inventory
  const ingredientChecks = recipe.ingredients.map(ing => {
    const owned = playerFragments.find(f => f.fragmentKey === ing.fragmentKey)?.quantity ?? 0;
    return { ...ing, owned, enough: owned >= ing.amount };
  });

  const canCraft = ingredientChecks.every(i => i.enough);

  return (
    <div
      className="rounded-xl p-3.5 transition-all duration-200"
      style={{
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        boxShadow: canCraft ? cfg.glow : 'none',
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{cfg.emoji}</span>
          <span className="text-sm font-bold text-white truncate">{recipe.name}</span>
        </div>
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: `${cfg.color}20`, color: cfg.color }}
        >
          {t(cfg.label)}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-2.5 text-[11px]">
        {recipe.yieldBonus > 0 && (
          <span className="text-green-400">
            +{Math.round(recipe.yieldBonus * 100)}% {t('campaign.recipes.yield', { defaultValue: 'yield' })}
          </span>
        )}
        {recipe.timeReduction > 0 && (
          <span className="text-blue-400">
            -{Math.round(recipe.timeReduction * 100)}% {t('campaign.recipes.time', { defaultValue: 'time' })}
          </span>
        )}
        <span className="text-white/40">
          {recipe.duration}h
        </span>
        <span className="text-yellow-400/60 ml-auto text-[10px]">
          {recipe.sellPrice} OGN
        </span>
      </div>

      {/* Zone info */}
      <div className="text-[10px] text-white/40 mb-2">
        Zone {recipe.zoneNumber}: {ZONE_NAMES[recipe.zoneNumber] ? t(ZONE_NAMES[recipe.zoneNumber]) : `Zone ${recipe.zoneNumber}`}
      </div>

      {/* Ingredients */}
      <div className="space-y-1 mb-3">
        {ingredientChecks.map((ing, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className={ing.enough ? 'text-green-400' : 'text-red-400'}>
              {ing.enough ? '✅' : '❌'}
            </span>
            <span className="text-white/70 truncate flex-1">
              {ing.name} {ing.isSameZone ? '' : t('campaign.ui.different_zone')}
            </span>
            <span className={`font-mono font-bold ${ing.enough ? 'text-green-400' : 'text-red-400'}`}>
              {ing.owned}/{ing.amount}
            </span>
          </div>
        ))}
      </div>

      {/* Craft button */}
      <button
        onClick={() => canCraft && onCraft(recipe.recipeKey)}
        disabled={!canCraft || isCrafting}
        className={`w-full py-2 rounded-lg text-sm font-bold transition-all active:scale-95 ${canCraft
          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
          : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
      >
        {isCrafting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t('campaign.ui.crafting', { defaultValue: 'Crafting...' })}
          </span>
        ) : (
          t('campaign.ui.craft')
        )}
      </button>
    </div>
  );
}
