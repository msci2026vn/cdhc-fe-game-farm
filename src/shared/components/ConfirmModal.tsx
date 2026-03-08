import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'red' | 'yellow' | 'green';
  icon?: string;
  isLoading?: boolean;
}

const COLOR_MAP = {
  red: 'bg-red-600 hover:bg-red-500',
  yellow: 'bg-yellow-600 hover:bg-yellow-500',
  green: 'bg-green-600 hover:bg-green-500',
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ',
  confirmColor = 'red',
  icon,
  isLoading = false,
}: ConfirmModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-xs space-y-4 shadow-2xl animate-[fadeScaleIn_0.15s_ease-out]"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'fadeScaleIn 0.15s ease-out' }}
      >
        {icon && (
          <div className="text-4xl text-center">{icon}</div>
        )}
        <h3 className="text-white font-bold text-base text-center">{title}</h3>
        <p className="text-gray-400 text-sm text-center leading-relaxed">{message}</p>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {cancelText === 'Huỷ' ? t('cancel') : cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${COLOR_MAP[confirmColor]}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('processing')}
              </span>
            ) : (confirmText === 'Xác nhận' ? t('confirm') : confirmText)}
          </button>
        </div>
      </div>
    </div>
  );
}
