interface Props {
  battleState: 'idle' | 'fighting' | 'ended';
  onAttack: () => void;
}

import { useTranslation } from 'react-i18next';

export function AttackButton({ battleState, onAttack }: Props) {
  const { t } = useTranslation();
  if (battleState === 'fighting') {
    return (
      <button className="w-full py-4 bg-gray-500 text-gray-200 text-xl font-bold rounded-xl" style={{ minHeight: 56 }} disabled>
        {t('world_boss.attack.attacking', 'ĐANG ĐÁNH...')}
      </button>
    );
  }

  return (
    <button
      className="w-full py-4 bg-red-600 active:bg-red-700 text-white text-xl font-bold rounded-xl"
      style={{ minHeight: 56 }}
      onClick={onAttack}
    >
      {t('world_boss.attack.enter', 'Tấn Công')}
    </button>
  );
}
