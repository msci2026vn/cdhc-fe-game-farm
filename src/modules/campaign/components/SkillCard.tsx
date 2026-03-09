// ═══════════════════════════════════════════════════════════════
// SkillCard — Individual skill display card for upgrade screen
// Shows level, effects, upgrade cost, unlock condition
// ═══════════════════════════════════════════════════════════════

import type { PlayerSkill } from '../types/skill.types';
import { useTranslation } from 'react-i18next';

interface SkillCardProps {
  skill: PlayerSkill;
  playerOgn: number;
  playerFragments: number;
  onUpgrade: () => void;
  isUpgrading: boolean;
}

export default function SkillCard({
  skill, playerOgn, playerFragments, onUpgrade, isUpgrading,
}: SkillCardProps) {
  const { t } = useTranslation();
  const isLocked = !skill.isUnlocked;
  const isMaxLevel = skill.level >= 5;
  const cost = skill.upgradeCost;
  const canAfford = cost
    ? playerOgn >= cost.ogn && playerFragments >= cost.fragments
    : false;

  // Star tier display
  const starDisplay = Array.from({ length: 5 }, (_, i) =>
    i < skill.level ? '⭐' : '☆'
  ).join('');

  return (
    <div
      className={`rounded-2xl p-4 transition-all ${isLocked
          ? 'opacity-60'
          : ''
        }`}
      style={{
        background: isLocked
          ? 'rgba(255,255,255,0.03)'
          : 'rgba(255,255,255,0.06)',
        border: `1px solid ${isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      {/* Header: emoji + name + level */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{isLocked ? '🔒' : skill.emoji}</span>
          <div>
            <h3 className="font-heading font-bold text-sm text-white">
              {skill.name}
            </h3>
            <span className="text-[10px] text-white/50">
              {isLocked ? t('campaign.ui.locked') : starDisplay}
            </span>
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded-lg text-[11px] font-bold"
          style={{
            background: isLocked
              ? 'rgba(255,255,255,0.05)'
              : isMaxLevel
                ? 'rgba(253,203,110,0.2)'
                : 'rgba(108,92,231,0.2)',
            color: isLocked
              ? 'rgba(255,255,255,0.3)'
              : isMaxLevel
                ? '#fdcb6e'
                : '#a29bfe',
          }}
        >
          {isLocked ? t('campaign.ui.locked') : isMaxLevel ? 'MAX' : `Lv.${skill.level}`}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Locked state */}
      {isLocked && skill.unlockCondition && (
        <div className="text-center py-3">
          <p className="text-white/40 text-xs mb-1">{t('campaign.ui.unlock_condition')}</p>
          <p className="text-white/60 text-sm font-bold">{skill.unlockCondition}</p>
        </div>
      )}

      {/* Unlocked state — show effects */}
      {!isLocked && (
        <>
          {/* Description */}
          <p className="text-white/60 text-xs mb-2">{skill.description}</p>

          {/* Current effects */}
          <div className="space-y-1 mb-2">
            {skill.effects.map((e, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className="text-green-400">●</span>
                <span className="text-white/70">
                  {e.label}: <span className="text-white font-bold">{e.value}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Next level preview */}
          {!isMaxLevel && skill.nextLevelEffects && skill.nextLevelEffects.length > 0 && (
            <div
              className="rounded-lg px-3 py-2 mb-3"
              style={{ background: 'rgba(108,92,231,0.1)', border: '1px solid rgba(108,92,231,0.15)' }}
            >
              <p className="text-[10px] font-bold text-purple-300 mb-1">
                Lv.{skill.level + 1}:
              </p>
              {skill.nextLevelEffects.map((e, i) => (
                <p key={i} className="text-[11px] text-purple-200">
                  {e.label}: <span className="font-bold">{e.value}</span>
                </p>
              ))}
            </div>
          )}

          {/* Upgrade button */}
          {!isMaxLevel && cost && (
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-white/50">
                <span className={playerOgn >= cost.ogn ? 'text-yellow-400' : 'text-red-400'}>
                  {cost.ogn.toLocaleString()} OGN
                </span>
                {cost.fragments > 0 && (
                  <>
                    {' + '}
                    <span className={playerFragments >= cost.fragments ? 'text-purple-300' : 'text-red-400'}>
                      {cost.fragments} 🧩
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={onUpgrade}
                disabled={!canAfford || isUpgrading}
                className={`px-4 py-1.5 rounded-xl text-xs font-heading font-bold transition-all active:scale-95 ${canAfford && !isUpgrading
                    ? 'text-white'
                    : 'text-white/30 opacity-50'
                  }`}
                style={{
                  background: canAfford && !isUpgrading
                    ? 'linear-gradient(135deg, #6c5ce7, #a29bfe)'
                    : 'rgba(255,255,255,0.05)',
                  boxShadow: canAfford && !isUpgrading
                    ? '0 4px 12px rgba(108,92,231,0.3)'
                    : 'none',
                }}
              >
                {isUpgrading ? t('campaign.ui.upgrading') : t('campaign.ui.upgrade')}
              </button>
            </div>
          )}

          {/* Max level badge */}
          {isMaxLevel && (
            <div className="text-center py-1">
              <span className="text-xs font-bold text-yellow-400">
                {t('campaign.ui.max_level_skill')}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
