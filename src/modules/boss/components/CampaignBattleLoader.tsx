// ═══════════════════════════════════════════════════════════════
// CampaignBattleLoader — Loads campaign boss data → BossFightM3
// Bridges campaign zone → match-3 combat → results → back to map
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useZoneBosses } from '@/modules/campaign/hooks/useZoneBosses';
import { BOSS_DETAILS } from '@/modules/campaign/data/bossDetails';
import { ARCHETYPE_INFO } from '@/modules/campaign/data/archetypes';
import { ZONE_META } from '@/modules/campaign/data/zones';
import type { BossInfo } from '../data/bosses';
import type { ZoneBoss } from '@/modules/campaign/types/campaign.types';
import BossFightM3 from './BossFightM3';

interface Props {
  bossId: string;
}

/**
 * Transform a campaign ZoneBoss → BossInfo that useMatch3 understands.
 */
function transformCampaignBoss(boss: ZoneBoss, zoneNumber: number): BossInfo {
  // DB boss_number is per-zone (1-4), static data uses global (1-40)
  const globalBossNumber = (zoneNumber - 1) * 4 + boss.bossNumber;
  const detail = BOSS_DETAILS[globalBossNumber];
  const meta = ZONE_META[zoneNumber];
  const bossInZone = boss.bossNumber % 4 === 0 ? 4 : boss.bossNumber % 4;
  const emoji = meta?.bossEmoji[bossInZone] || boss.emoji || '👾';

  return {
    id: String(boss.id),
    name: boss.name,
    emoji,
    hp: boss.hp,
    attack: detail?.atk ?? boss.attack,
    reward: boss.reward,
    xpReward: boss.xpReward,
    description: '',
    difficulty: boss.difficulty,
    unlockLevel: boss.unlockLevel,
    archetype: boss.archetype,
    def: detail?.def ?? 0,
  };
}

export default function CampaignBattleLoader({ bossId }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const zoneName = searchParams.get('zoneName') || '';
  const zoneNumber = parseInt(searchParams.get('zoneNumber') || '1', 10);
  const [retryKey, setRetryKey] = useState(0);

  // Load zone bosses to find our target boss
  const { data, isLoading, error } = useZoneBosses(zoneNumber);
  const bosses = data?.bosses ?? [];
  const targetBoss = bosses.find(b => String(b.id) === bossId);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen max-w-[430px] mx-auto boss-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80 font-heading font-bold text-sm">Đang tải boss...</p>
        </div>
      </div>
    );
  }

  // Error or boss not found
  if (error || !targetBoss) {
    return (
      <div className="min-h-screen max-w-[430px] mx-auto boss-gradient flex items-center justify-center px-6">
        <div className="text-center">
          <span className="text-5xl mb-4 block">😵</span>
          <p className="text-red-300 font-heading font-bold mb-2">
            {error ? 'Lỗi tải boss' : 'Boss không tìm thấy'}
          </p>
          <p className="text-white/40 text-xs mb-4">
            {error ? String(error) : `Boss ID: ${bossId}`}
          </p>
          <button
            onClick={() => navigate(`/campaign/${zoneNumber}`)}
            className="btn-gold px-6 py-2 rounded-xl font-heading font-bold text-sm text-white"
          >
            Về Map
          </button>
        </div>
      </div>
    );
  }

  const bossInfo = transformCampaignBoss(targetBoss, zoneNumber);
  const globalBossNum = (zoneNumber - 1) * 4 + targetBoss.bossNumber;
  const detail = BOSS_DETAILS[globalBossNum];
  const archInfo = ARCHETYPE_INFO[targetBoss.archetype] || ARCHETYPE_INFO['none'];

  return (
    <BossFightM3
      key={retryKey}
      boss={bossInfo}
      onBack={() => navigate(`/campaign/${zoneNumber}`)}
      isCampaign={true}
      campaignBossId={bossId}
      zoneName={zoneName || undefined}
      archetype={targetBoss.archetype}
      archetypeIcon={archInfo.icon}
      archetypeTip={archInfo.tipVi}
      turnLimit={detail?.turnLimit ?? 0}
      healPerTurn={detail?.healPercent ?? 0}
      onRetry={() => setRetryKey(k => k + 1)}
    />
  );
}
