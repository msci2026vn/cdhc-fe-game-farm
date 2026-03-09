import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import type { ZoneBoss, ZoneInfo } from '../types/campaign.types';
import { BOSS_DETAILS } from '../data/bossDetails';
import { ARCHETYPE_INFO } from '../data/archetypes';
import { ZONE_META } from '../data/zones';
import { BOSS_SKILLS, getSkillDescVi } from '../data/bossSkills';
import { getBossImageSrc } from '../data/bossSpritePaths';
import { useTranslation } from 'react-i18next';
import { playSound } from '@/shared/audio';

interface BossDetailSheetProps {
  boss: ZoneBoss | null;
  zone: ZoneInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFight: (bossId: string) => void;
}

/**
 * BossDetailSheet — Bottom drawer showing boss info before combat.
 * Uses static BOSS_DETAILS fallback + ARCHETYPE_INFO for counter tips.
 * Reuses existing CSS classes: stat-chip, glass-card, btn-comic-red.
 */
export default function BossDetailSheet({ boss, zone, open, onOpenChange, onFight }: BossDetailSheetProps) {
  if (!boss || !zone) return null;

  // DB boss_number is per-zone (1-4), static data uses global (1-40)
  const globalBossNumber = (zone.zoneNumber - 1) * 4 + boss.bossNumber;
  const detail = BOSS_DETAILS[globalBossNumber];
  const archetype = ARCHETYPE_INFO[boss.archetype] || ARCHETYPE_INFO['none'];
  const meta = ZONE_META[zone.zoneNumber];
  const { t } = useTranslation();
  const hasRecord = boss.isCleared && boss.bestStars > 0;
  const hasSpecial = detail?.specialVi && detail.specialVi !== 'campaign.boss.special.none';
  const skills = BOSS_SKILLS[globalBossNumber] ?? [];
  const hasSkills = skills.length > 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-[430px] mx-auto rounded-t-3xl border-0 bg-white">
        <div className="px-6 pb-8 pt-2 max-h-[85vh] overflow-y-auto">

          {/* ═══ BOSS VISUAL ═══ */}
          <div className="flex flex-col items-center gap-2 mb-6">
            {/* Visual */}
            <div className="drop-shadow-lg">
              <img src={getBossImageSrc(globalBossNumber)} alt={boss.name} className="w-28 h-28 object-contain inline-block" />
            </div>

            {/* Tier badge */}
            <div className={cn(
              'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white',
              boss.tier === 'boss' && 'bg-red-500',
              boss.tier === 'elite' && 'bg-blue-500',
              boss.tier === 'minion' && 'bg-gray-500',
            )}>
              {boss.tier === 'boss' && '👑 '}{boss.tier}
            </div>

            {/* Name */}
            <h2 className="font-heading text-2xl font-black text-gray-900">
              {boss.name}
            </h2>

            {/* Zone context */}
            <p className="text-sm text-gray-500">
              {meta?.icon} {t('campaign.ui.region')} {zone.zoneNumber}: {zone.name}
            </p>
          </div>

          {/* ═══ STATS GRID ═══ */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatChip icon="❤️" label="HP" value={formatNumber(boss.hp)} />
            <StatChip icon="⚔️" label="ATK" value={formatNumber(detail?.atk ?? boss.attack ?? 0)} />
            <StatChip icon="🛡️" label="DEF" value={formatNumber(detail?.def ?? 0)} />
            <StatChip icon="⏱️" label={t('campaign.ui.turns')} value={`${detail?.turnLimit ?? '?'}`} />
            <StatChip icon="🔄" label="Freq" value={`×${detail?.freq ?? 1}`} />
            <StatChip icon="💚" label={t('campaign.ui.heal')} value={detail?.healPercent ? `${detail.healPercent}%` : '—'} />
          </div>

          {/* ═══ ARCHETYPE TAG ═══ */}
          {boss.archetype && boss.archetype !== 'none' && (
            <div className={cn('rounded-xl p-3 mb-4 text-white', archetype.color)}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{archetype.icon}</span>
                <span className="font-heading font-bold text-sm">{archetype.label}</span>
              </div>
              <p className="text-xs opacity-90">{archetype.tipVi}</p>
            </div>
          )}

          {/* ═══ KỸ NĂNG ĐẶC BIỆT ═══ */}
          {hasSkills ? (
            <div className="glass-card rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-amber-500 text-lg">warning</span>
                <span className="font-heading font-bold text-sm text-gray-800">{t('campaign.ui.special_skill')}</span>
              </div>
              <div className="space-y-2">
                {skills.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-lg leading-none flex-shrink-0">{s.icon}</span>
                    <div>
                      <span className="font-bold text-gray-800">{s.label}</span>
                      <span className="text-gray-500 ml-1.5">{getSkillDescVi(s)}</span>
                      <span className="text-gray-400 ml-1.5 text-xs">({s.cooldown}s CD)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : hasSpecial && (
            <div className="glass-card rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-amber-500 text-lg">warning</span>
                <span className="font-heading font-bold text-sm text-gray-800">{t('campaign.ui.special_mechanic')}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{detail?.specialVi ? t(detail.specialVi) : ''}</p>
            </div>
          )}

          {/* ═══ GỢI Ý COUNTER ═══ */}
          {archetype.counterText && (
            <div className="glass-card rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-blue-500 text-lg">tips_and_updates</span>
                <span className="font-heading font-bold text-sm text-gray-800">{t('campaign.ui.build_suggestion')}</span>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-green-700 flex items-start gap-1.5">
                  <span className="flex-shrink-0">✅</span>
                  <span>{t('campaign.ui.good')} {archetype.counterIcon} {archetype.counterText}</span>
                </p>
                {archetype.worstText && (
                  <p className="text-sm text-red-600 flex items-start gap-1.5">
                    <span className="flex-shrink-0">⚠️</span>
                    <span>{t('campaign.ui.weak')} {archetype.worstIcon} {archetype.worstText}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ═══ KỶ LỤC ═══ */}
          {hasRecord && (
            <div className="glass-card rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="material-symbols-outlined text-yellow-500 text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  emoji_events
                </span>
                <span className="font-heading font-bold text-sm text-gray-800">{t('campaign.boss.your_record')}</span>
              </div>
              <div className="flex items-center justify-between">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(i => (
                    <span
                      key={i}
                      className={cn(
                        'material-symbols-outlined text-lg',
                        i <= boss.bestStars ? 'text-yellow-400' : 'text-gray-300'
                      )}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                {/* Stats */}
                <div className="flex items-center gap-3">
                  {boss.bestTurns != null && (
                    <span className="text-xs text-gray-600">{boss.bestTurns} {t('campaign.ui.turns').toLowerCase()}</span>
                  )}
                  {boss.bestHpPercent != null && (
                    <span className="text-xs text-gray-600">HP {boss.bestHpPercent}%</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{t('campaign.boss.cleared_times', { count: boss.clearCount })}</p>
            </div>
          )}

          {/* ═══ FIGHT BUTTON ═══ */}
          <button
            onClick={() => { playSound('boss_select'); onFight(boss.id); }}
            className="btn-comic-red w-full py-4 rounded-2xl text-white font-heading text-xl font-black uppercase tracking-wider flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-2xl">swords</span>
            {t('campaign.boss.fight')}
          </button>

          <p className="text-center text-xs text-gray-400 mt-2">
            {t('campaign.boss.recommended_lv')} {detail?.recommendedLevel ?? '?'}
          </p>

        </div>
      </DrawerContent>
    </Drawer>
  );
}

/** Stat chip — reuses stat-chip class from index.css */
function StatChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="stat-chip flex flex-col items-center gap-1 py-2.5 rounded-xl">
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</span>
      <span className="font-heading font-bold text-sm text-gray-800">{value}</span>
    </div>
  );
}

/** Format large numbers (e.g. 4500 → "4.5k") */
function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}
