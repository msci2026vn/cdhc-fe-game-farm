// ═══════════════════════════════════════════════════════════════
// FragmentCard — Individual fragment with tier glow + quantity
// ═══════════════════════════════════════════════════════════════

import type { FragmentTier } from '../types/fragment.types';
import { TIER_CONFIG, ZONE_NAMES } from '../types/fragment.types';
import { useTranslation } from 'react-i18next';

interface FragmentCardProps {
  name: string;
  tier: FragmentTier;
  zoneNumber: number;
  quantity: number;
}

export default function FragmentCard({ name, tier, zoneNumber, quantity }: FragmentCardProps) {
  const { t } = useTranslation();
  const cfg = TIER_CONFIG[tier];
  const isEmpty = quantity === 0;

  return (
    <div
      className={`relative rounded-xl p-3 flex flex-col items-center gap-1 transition-all duration-200 ${isEmpty ? 'opacity-40 grayscale' : ''}`}
      style={{
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        boxShadow: isEmpty ? 'none' : cfg.glow,
      }}
    >
      {/* Quantity badge */}
      {quantity > 0 && (
        <span
          className="absolute top-1.5 right-1.5 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
          style={{ background: cfg.border }}
        >
          x{quantity}
        </span>
      )}

      {/* Tier emoji */}
      <span className="text-2xl">{cfg.emoji}</span>

      {/* Fragment name */}
      <span className="text-[11px] font-bold text-white text-center leading-tight">{name}</span>

      {/* Zone info */}
      <span className="text-[9px] font-medium" style={{ color: cfg.color }}>
        Zone {zoneNumber}
      </span>

      {/* Tier label */}
      <span
        className="text-[8px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: `${cfg.color}20`, color: cfg.color }}
      >
        {t(cfg.label)}
      </span>
    </div>
  );
}
