// ═══════════════════════════════════════════════════════════════
// CampaignBattleScreen — Route wrapper for campaign boss combat
// Route: /campaign/battle/:bossId?zoneNumber=N
// Loads boss data → transforms → renders BossFightCampaign
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useZoneBosses } from '../hooks/useZoneBosses';
import { BOSS_DETAILS } from '../data/bossDetails';
import { ARCHETYPE_INFO } from '../data/archetypes';
import { ZONE_META } from '../data/zones';
import { DE_VUONG_PHASES } from '../data/deVuongPhases';
import { BOSS_SKILLS } from '../data/bossSkills';
import type { ZoneBoss } from '../types/campaign.types';
import type { CampaignBossData } from '../hooks/useMatch3Campaign';
import BossFightCampaign from '../components/BossFightCampaign';

/**
 * Transform a campaign ZoneBoss + static detail → CampaignBossData
 */
function transformCampaignBoss(boss: ZoneBoss, zoneNumber: number): CampaignBossData {
  const detail = BOSS_DETAILS[boss.bossNumber];
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
    archetype: boss.archetype || 'none',
    def: detail?.def ?? 0,
    freq: detail?.freq ?? 1,
    healPercent: detail?.healPercent ?? 0,
    turnLimit: detail?.turnLimit ?? 0,
    // Inject 4-phase data for De Vuong (boss #40)
    phases: boss.bossNumber === 40 ? DE_VUONG_PHASES : undefined,
    // Inject special skills from static data
    skills: BOSS_SKILLS[boss.bossNumber] ?? [],
  };
}

export default function CampaignBattleScreen() {
  const navigate = useNavigate();
  const { bossId } = useParams<{ bossId: string }>();
  const [searchParams] = useSearchParams();
  const zoneNumber = parseInt(searchParams.get('zoneNumber') || '1', 10);
  const zoneName = searchParams.get('zoneName') || '';
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

  // Error or not found
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
  const archInfo = ARCHETYPE_INFO[targetBoss.archetype] || ARCHETYPE_INFO['none'];

  return (
    <BossFightCampaign
      key={retryKey}
      boss={bossInfo}
      onBack={() => navigate(`/campaign/${zoneNumber}`)}
      campaignBossId={bossId!}
      zoneName={zoneName || undefined}
      archetype={targetBoss.archetype}
      archetypeIcon={archInfo.icon}
      archetypeTip={archInfo.tipVi}
      onRetry={() => setRetryKey(k => k + 1)}
    />
  );
}
