/**
 * BuildAura — Visual aura effect based on player's dominant stat build.
 *
 * 5 aura types:
 *  - flame (ATK dominant): red/orange glow
 *  - nature (HP dominant): green glow
 *  - frost (DEF dominant): blue glow
 *  - arcane (Mana dominant): purple glow
 *  - balance (no dominant): gold glow
 *
 * Usage: wrap any element with <BuildAura stats={effectiveStats}>...</BuildAura>
 */

interface BuildAuraProps {
  stats: { atk: number; hp: number; def: number; mana: number };
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

type AuraType = 'flame' | 'nature' | 'frost' | 'arcane' | 'balance';

interface AuraConfig {
  gradient: string;
  shadow: string;
  particles: string[];
  label: string;
}

const AURA_CONFIGS: Record<AuraType, AuraConfig> = {
  flame: {
    gradient: 'radial-gradient(circle, rgba(231,76,60,0.3) 0%, rgba(231,76,60,0) 70%)',
    shadow: '0 0 20px rgba(231,76,60,0.5)',
    particles: ['🔥', '⚔️'],
    label: 'Lua',
  },
  nature: {
    gradient: 'radial-gradient(circle, rgba(85,239,196,0.3) 0%, rgba(85,239,196,0) 70%)',
    shadow: '0 0 20px rgba(85,239,196,0.5)',
    particles: ['💚', '🌿'],
    label: 'Thien nhien',
  },
  frost: {
    gradient: 'radial-gradient(circle, rgba(116,185,255,0.3) 0%, rgba(116,185,255,0) 70%)',
    shadow: '0 0 20px rgba(116,185,255,0.5)',
    particles: ['🛡️', '❄️'],
    label: 'Bang gia',
  },
  arcane: {
    gradient: 'radial-gradient(circle, rgba(162,155,254,0.3) 0%, rgba(162,155,254,0) 70%)',
    shadow: '0 0 20px rgba(162,155,254,0.5)',
    particles: ['✨', '💜'],
    label: 'Huyen bi',
  },
  balance: {
    gradient: 'radial-gradient(circle, rgba(253,203,110,0.3) 0%, rgba(253,203,110,0) 70%)',
    shadow: '0 0 20px rgba(253,203,110,0.5)',
    particles: ['⭐', '✨'],
    label: 'Can bang',
  },
};

// Normalize stats to compare ratios
function getDominantAura(stats: { atk: number; hp: number; def: number; mana: number }): AuraType {
  // Normalize by base values to make comparison fair (HP is naturally much higher)
  const normalized = {
    atk: stats.atk / 100,
    hp: stats.hp / 500,
    def: stats.def / 50,
    mana: stats.mana / 100,
  };

  const max = Math.max(normalized.atk, normalized.hp, normalized.def, normalized.mana);
  const min = Math.min(normalized.atk, normalized.hp, normalized.def, normalized.mana);

  // If the spread is small (< 30%), it's balanced
  if (max > 0 && (max - min) / max < 0.3) return 'balance';

  if (normalized.atk === max) return 'flame';
  if (normalized.hp === max) return 'nature';
  if (normalized.def === max) return 'frost';
  return 'arcane';
}

const SIZE_MAP = { sm: 'w-12 h-12', md: 'w-16 h-16', lg: 'w-20 h-20' };

export function BuildAura({ stats, children, size = 'md', className = '' }: BuildAuraProps) {
  const auraType = getDominantAura(stats);
  const config = AURA_CONFIGS[auraType];

  return (
    <div className={`relative inline-flex items-center justify-center ${SIZE_MAP[size]} ${className}`}>
      {/* Aura glow background */}
      <div
        className="absolute inset-[-8px] rounded-full animate-pulse"
        style={{ background: config.gradient, boxShadow: config.shadow }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export { getDominantAura, AURA_CONFIGS };
export type { AuraType };
