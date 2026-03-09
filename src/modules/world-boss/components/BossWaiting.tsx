interface BossWaitingProps {
  onShowHistory?: () => void;
}

import { useTranslation } from 'react-i18next';

export function BossWaiting({ onShowHistory }: BossWaitingProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-6 text-center">
      <div className="text-6xl">🌾</div>
      <h2 className="text-xl font-bold text-white">{t('world_boss.info.waiting_title', 'Cánh đồng yên bình')}</h2>
      <p className="text-gray-400 text-sm leading-relaxed max-w-xs" dangerouslySetInnerHTML={{ __html: t('world_boss.info.waiting_desc', 'Chưa có boss nào xuất hiện.<br />Boss sẽ xuất hiện khi sensor IoT phát hiện bất thường trong nông trại...') }} />
      <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-400 max-w-xs">
        <p>🔄 {t('world_boss.info.check_interval', 'Kiểm tra mỗi 3 giây')}</p>
        <p className="mt-1 text-xs text-gray-500">{t('world_boss.info.auto_update', 'Trang tự động cập nhật khi boss xuất hiện')}</p>
      </div>
      {onShowHistory && (
        <button
          onClick={onShowHistory}
          className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2"
        >
          📜 {t('world_boss.info.view_history', 'Xem lịch sử boss')}
        </button>
      )}
    </div>
  );
}
