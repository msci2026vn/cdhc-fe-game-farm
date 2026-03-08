import { STAT_CONFIG } from '../utils/stat-constants';
import { playSound } from '../audio';
import { useTranslation } from 'react-i18next';

type StatKey = 'atk' | 'hp' | 'def' | 'mana';

interface StatHelpModalProps {
  stat: StatKey;
  isOpen: boolean;
  onClose: () => void;
}

const STAT_HELP_DATA: Record<StatKey, {
  icon: string;
  color: string;
  bg: string;
  milestones: { threshold: number }[];
}> = {
  atk: {
    icon: '⚔️',
    color: '#e74c3c',
    bg: 'linear-gradient(135deg, #ffe0e0, #ffb3b3)',
    milestones: [
      { threshold: 300 },
      { threshold: 800 },
      { threshold: 2000 },
    ],
  },
  hp: {
    icon: '❤️',
    color: '#4eca6a',
    bg: 'linear-gradient(135deg, #d4f8dc, #a8e6a0)',
    milestones: [
      { threshold: 1500 },
      { threshold: 5000 },
      { threshold: 15000 },
    ],
  },
  def: {
    icon: '🛡️',
    color: '#3498db',
    bg: 'linear-gradient(135deg, #d4eeff, #a8d4f0)',
    milestones: [
      { threshold: 200 },
      { threshold: 600 },
      { threshold: 1500 },
    ],
  },
  mana: {
    icon: '✨',
    color: '#9b59b6',
    bg: 'linear-gradient(135deg, #f0d4ff, #d4a8f0)',
    milestones: [
      { threshold: 250 },
      { threshold: 800 },
      { threshold: 3000 },
    ],
  },
};

export function StatHelpModal({ stat, isOpen, onClose }: StatHelpModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const data = STAT_HELP_DATA[stat];

  const handleClose = () => { playSound('ui_modal_close'); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-fade-in" onClick={handleClose}>
      <div
        className="bg-white rounded-t-2xl max-w-[430px] w-full shadow-2xl max-h-[80dvh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: data.bg }}
            >
              {data.icon}
            </div>
            <h3 className="font-heading text-base font-bold">{t(`stat_name_${stat}`)}</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-bold active:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4" style={{ scrollbarWidth: 'none' }}>
          {/* Description */}
          <p className="text-xs text-gray-600 mb-3">{t(`stat_desc_${stat}`)}</p>

          {/* Per point */}
          <div className="bg-gray-50 rounded-xl p-2.5 mb-3">
            <p className="text-xs font-bold">
              📊 {t('per_1_point')} <span style={{ color: data.color }}>{t(`stat_per_point_${stat}`)}</span>
            </p>
          </div>

          {/* Effects */}
          <div className="mb-3">
            <p className="text-[10px] font-bold text-gray-400 mb-1.5">{data.icon} {t('in_battle_effects')}</p>
            <div className="space-y-1">
              {[0, 1, 2, 3].map((i) => {
                const effectKey = `stat_effect_${stat}_${i}`;
                const effectText = t(effectKey);
                if (effectText === effectKey) return null; // Skip if not found
                return (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-[10px] text-gray-300 mt-0.5">•</span>
                    <p className="text-[11px] text-gray-600">{effectText}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestones */}
          <div className="mb-3">
            <p className="text-[10px] font-bold text-gray-400 mb-1.5">🔥 {t('milestone_rewards')}</p>
            <div className="space-y-1">
              {data.milestones.map((m, i) => (
                <div key={m.threshold} className="flex items-center gap-2 bg-amber-50 rounded-lg p-2">
                  <span
                    className="text-xs font-black min-w-[40px] text-right"
                    style={{ color: data.color }}
                  >
                    {m.threshold.toLocaleString('vi-VN')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold">{t(`stat_milestone_name_${stat}_${i}`)}</p>
                    <p className="text-[10px] text-gray-500">{t(`stat_milestone_desc_${stat}_${i}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="bg-blue-50 rounded-xl p-2.5">
            <p className="text-[11px] text-blue-600 italic">💡 {t(`stat_tip_${stat}`)}</p>
          </div>
        </div>

        {/* Footer button */}
        <div className="p-4 pt-2 flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white active:scale-95 transition-all shadow-lg"
            style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}cc)` }}
          >
            {t('got_it')}
          </button>
        </div>
      </div>
    </div>
  );
}
