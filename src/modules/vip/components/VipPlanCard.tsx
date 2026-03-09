import type { VipPlan } from '@/shared/types/game-api.types';

interface VipPlanCardProps {
  plan: VipPlan;
  onSelect: (planId: string) => void;
  isLoading?: boolean;
  isCurrentPlan?: boolean;
}

export function VipPlanCard({ plan, onSelect, isLoading, isCurrentPlan }: VipPlanCardProps) {
  const isStandard = plan.tier === 'standard';

  const tierStyles = isStandard
    ? {
        border: 'border-green-200',
        bg: 'bg-green-50',
        accent: 'text-green-700',
        badge: 'bg-green-100 text-green-700 border-green-200',
        btn: 'bg-green-600 hover:bg-green-700 active:bg-green-800',
        check: 'text-green-600',
        emoji: '🌿',
      }
    : {
        border: 'border-amber-200',
        bg: 'bg-amber-50',
        accent: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        btn: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
        check: 'text-amber-600',
        emoji: '🌳',
      };

  return (
    <div className={`rounded-2xl border-2 ${tierStyles.border} ${tierStyles.bg} p-5 relative ${isCurrentPlan ? 'opacity-60' : ''}`}>
      {/* Tier badge */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className={`font-heading font-bold text-lg ${tierStyles.accent}`}>
            {tierStyles.emoji} {plan.name}
          </h3>
          <p className="text-xs text-gray-500 capitalize">{plan.tier}</p>
        </div>
        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${tierStyles.badge}`}>
          x{plan.ognMultiplier} OGN
        </span>
      </div>

      {/* Price */}
      <div className="mb-4">
        <span className={`text-2xl font-heading font-black ${tierStyles.accent}`}>
          {plan.priceAvax} AVAX
        </span>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-5">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className={`${tierStyles.check} font-bold mt-0.5`}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={() => onSelect(plan.id)}
        disabled={isLoading || isCurrentPlan}
        className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${tierStyles.btn}`}
      >
        {isCurrentPlan ? 'Đang sử dụng' : isLoading ? 'Đang xử lý...' : '🛒 Mua ngay'}
      </button>

      <p className="text-center text-xs text-gray-400 mt-2">
        {plan.durationDays} ngày
      </p>
    </div>
  );
}
