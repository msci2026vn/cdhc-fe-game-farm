import { BottomDrawer } from './BottomDrawer';
import type { WorldBossInfo } from '../types/world-boss.types';
import { useTranslation } from 'react-i18next';

const getElementConfig = (element: string, t: any) => {
  const configs: Record<string, { icon: string; label: string; color: string }> = {
    fire: { icon: '🔥', label: t('world_boss.marquee.fire', 'Lửa'), color: 'text-orange-400' },
    ice: { icon: '❄️', label: t('world_boss.marquee.ice', 'Băng'), color: 'text-blue-300' },
    water: { icon: '💧', label: t('world_boss.marquee.water', 'Nước'), color: 'text-blue-500' },
    wind: { icon: '🌀', label: t('world_boss.marquee.wind', 'Gió'), color: 'text-green-300' },
    poison: { icon: '☠️', label: t('world_boss.marquee.poison', 'Độc'), color: 'text-purple-400' },
    chaos: { icon: '💥', label: t('world_boss.marquee.chaos', 'Hỗn Loạn'), color: 'text-red-400' },
  };
  return configs[element] || configs.chaos;
};

const getDifficultyConfig = (diff: string, t: any) => {
  const configs: Record<string, { label: string; color: string }> = {
    normal: { label: t('world_boss.info.diff_normal', 'Bình thường'), color: 'bg-gray-600' },
    hard: { label: t('world_boss.info.diff_hard', 'Khó'), color: 'bg-yellow-600' },
    extreme: { label: t('world_boss.info.diff_extreme', 'Cực khó'), color: 'bg-orange-600' },
    catastrophic: { label: t('world_boss.info.diff_catastrophic', 'Thảm họa'), color: 'bg-red-700' },
  };
  return configs[diff] || configs.normal;
};

const SKILL_ICONS: Record<string, string> = {
  single_hit: '⚔️',
  aoe_blast: '💥',
  dot_poison: '🧪',
  multi_strike: '⚡',
  def_break: '🛡️',
  atk_down: '⬇️',
  stun: '💫',
  enrage: '😡',
  heal: '💚',
  shield: '🛡️',
  drain: '🩸',
  summon_minion: '👾',
};

interface BossInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  boss: WorldBossInfo;
}

export function BossInfoPanel({ isOpen, onClose, boss }: BossInfoPanelProps) {
  const { t } = useTranslation();
  const element = getElementConfig(boss.element, t);
  const weaknessEl = boss.weakness ? getElementConfig(boss.weakness, t) : null;
  const difficulty = getDifficultyConfig(boss.difficulty, t);

  return (
    <BottomDrawer isOpen={isOpen} onClose={onClose} title={`ℹ️ ${t('world_boss.info.boss_info', 'Thông tin Boss')}`}>
      {/* Boss name + difficulty */}
      <div className="flex items-center gap-2 mb-4">
        <p className="text-base font-bold text-white flex-1">{boss.bossName}</p>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${difficulty.color}`}>
          {difficulty.label}
        </span>
      </div>

      {/* Stats table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden mb-4">
        {[
          [t('world_boss.info.element', 'Nguyên tố'), <span className={element.color}>{element.icon} {element.label}</span>],
          [t('world_boss.info.weakness', 'Yếu với'), weaknessEl
            ? <span className={weaknessEl.color}>{weaknessEl.icon} {weaknessEl.label}</span>
            : <span className="text-gray-400">{boss.weakness}</span>
          ],
          [t('world_boss.info.max_hp', 'HP tối đa'), boss.stats.max_hp.toLocaleString()],
          [t('world_boss.info.atk', 'Tấn công'), boss.stats.atk.toLocaleString()],
          [t('world_boss.info.def', 'Phòng thủ'), boss.stats.def.toLocaleString()],
          [t('world_boss.info.crit_rate', 'Tỉ lệ chí mạng'), `${(boss.stats.crit_rate * 100).toFixed(0)}%`],
        ].map(([label, value], i) => (
          <div
            key={i}
            className={`flex justify-between items-center px-3 py-2 text-sm ${i % 2 === 0 ? '' : 'bg-gray-750'}`}
          >
            <span className="text-gray-400">{label as string}</span>
            <span className="text-white font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Skills */}
      {boss.skills.length > 0 && (
        <>
          <p className="text-sm font-bold text-gray-300 mb-2">⚔️ {t('world_boss.info.skills', 'Kỹ năng')}</p>
          <div className="flex flex-col gap-2">
            {boss.skills.map((skill, i) => {
              const mechanicId = (skill as any).mechanicId || skill.type;
              const icon = mechanicId ? (SKILL_ICONS[mechanicId] ?? '✨') : '✨';
              return (
                <div key={i} className="bg-gray-800 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{icon}</span>
                    <span className="text-sm font-bold text-white">{skill.name}</span>
                    {mechanicId && (
                      <span className="text-xs text-gray-500 font-mono">[{mechanicId}]</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{skill.description}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </BottomDrawer>
  );
}
