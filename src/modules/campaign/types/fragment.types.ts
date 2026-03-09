// ═══════════════════════════════════════════════════════════════
// Fragment types — player fragment inventory + drop results
// ═══════════════════════════════════════════════════════════════

export type FragmentTier = 'common' | 'rare' | 'legendary';

export interface PlayerFragment {
  fragmentId: number;
  fragmentKey: string;   // e.g. 'phan_vi_sinh_common'
  name: string;          // e.g. 'Phân Vi Sinh'
  tier: FragmentTier;
  zoneNumber: number;
  quantity: number;
}

export interface DropResult {
  dropped: boolean;
  fragment?: {
    fragmentKey: string;
    name: string;
    tier: FragmentTier;
    zoneNumber: number;
  };
  pityCounter: number;
  guaranteedIn: number;  // pity_threshold - pityCounter
}

export const TIER_CONFIG: Record<FragmentTier, {
  label: string;
  color: string;
  bg: string;
  border: string;
  emoji: string;
  glow: string;
}> = {
  common: { label: 'campaign.tier.common', color: '#9ca3af', bg: '#1f2937', border: '#4b5563', emoji: '⬜', glow: 'none' },
  rare: { label: 'campaign.tier.rare', color: '#3b82f6', bg: '#1e3a5f', border: '#2563eb', emoji: '🟦', glow: '0 0 12px rgba(59,130,246,0.5)' },
  legendary: { label: 'campaign.tier.legendary', color: '#a855f7', bg: '#3b1f5e', border: '#7c3aed', emoji: '🟪', glow: '0 0 16px rgba(168,85,247,0.6)' },
};

export const ZONE_NAMES: Record<number, string> = {
  1: 'campaign.zone.1',
  2: 'campaign.zone.2',
  3: 'campaign.zone.3',
  4: 'campaign.zone.4',
  5: 'campaign.zone.5',
  6: 'campaign.zone.6',
  7: 'campaign.zone.7',
  8: 'campaign.zone.8',
  9: 'campaign.zone.9',
  10: 'campaign.zone.10',
};
