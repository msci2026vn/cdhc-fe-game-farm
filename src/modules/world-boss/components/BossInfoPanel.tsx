import { BottomDrawer } from './BottomDrawer';
import type { WorldBossInfo } from '../types/world-boss.types';

const ELEMENT_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  fire:   { icon: '🔥', label: 'Lửa',      color: 'text-orange-400' },
  ice:    { icon: '❄️', label: 'Băng',      color: 'text-blue-300' },
  water:  { icon: '💧', label: 'Nước',      color: 'text-blue-500' },
  wind:   { icon: '🌀', label: 'Gió',       color: 'text-green-300' },
  poison: { icon: '☠️', label: 'Độc',       color: 'text-purple-400' },
  chaos:  { icon: '💥', label: 'Hỗn Loạn', color: 'text-red-400' },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  normal:       { label: 'Bình thường', color: 'bg-gray-600' },
  hard:         { label: 'Khó',         color: 'bg-yellow-600' },
  extreme:      { label: 'Cực khó',     color: 'bg-orange-600' },
  catastrophic: { label: 'Thảm họa',   color: 'bg-red-700' },
};

const SKILL_ICONS: Record<string, string> = {
  single_hit:    '⚔️',
  aoe_blast:     '💥',
  dot_poison:    '🧪',
  multi_strike:  '⚡',
  def_break:     '🛡️',
  atk_down:      '⬇️',
  stun:          '💫',
  enrage:        '😡',
  heal:          '💚',
  shield:        '🛡️',
  drain:         '🩸',
  summon_minion: '👾',
};

interface BossInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  boss: WorldBossInfo;
}

export function BossInfoPanel({ isOpen, onClose, boss }: BossInfoPanelProps) {
  const element = ELEMENT_CONFIG[boss.element] ?? ELEMENT_CONFIG.chaos;
  const weaknessEl = ELEMENT_CONFIG[boss.weakness] ?? null;
  const difficulty = DIFFICULTY_CONFIG[boss.difficulty] ?? DIFFICULTY_CONFIG.normal;

  return (
    <BottomDrawer isOpen={isOpen} onClose={onClose} title="ℹ️ Thông tin Boss">
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
          ['Nguyên tố', <span className={element.color}>{element.icon} {element.label}</span>],
          ['Yếu với', weaknessEl
            ? <span className={weaknessEl.color}>{weaknessEl.icon} {weaknessEl.label}</span>
            : <span className="text-gray-400">{boss.weakness}</span>
          ],
          ['HP tối đa', boss.stats.max_hp.toLocaleString()],
          ['Tấn công', boss.stats.atk.toLocaleString()],
          ['Phòng thủ', boss.stats.def.toLocaleString()],
          ['Tỉ lệ chí mạng', `${(boss.stats.crit_rate * 100).toFixed(0)}%`],
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
          <p className="text-sm font-bold text-gray-300 mb-2">⚔️ Kỹ năng</p>
          <div className="flex flex-col gap-2">
            {boss.skills.map((skill, i) => {
              const icon = skill.mechanicId ? (SKILL_ICONS[skill.mechanicId] ?? '✨') : '✨';
              return (
                <div key={i} className="bg-gray-800 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{icon}</span>
                    <span className="text-sm font-bold text-white">{skill.name}</span>
                    {skill.mechanicId && (
                      <span className="text-xs text-gray-500 font-mono">[{skill.mechanicId}]</span>
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
