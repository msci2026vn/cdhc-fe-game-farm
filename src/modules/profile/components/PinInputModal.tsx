import { useState, useEffect, useCallback } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useTranslation } from 'react-i18next';

interface PinInputModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<void>;
  title?: string;
  description?: string;
  error?: string;
  attemptsRemaining?: number;
  blocked?: boolean;
  isLoading?: boolean;
}

export function PinInputModal({
  open, onClose, onSubmit,
  title = 'Nhập mã PIN',
  description = 'Nhập mã PIN 6 số để xác nhận',
  error, attemptsRemaining, blocked, isLoading,
}: PinInputModalProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  // Reset khi mo
  useEffect(() => {
    if (open) setValue('');
  }, [open]);

  // Reset khi co error (cho phep nhap lai)
  useEffect(() => {
    if (error) setValue('');
  }, [error]);

  const handleComplete = useCallback((pin: string) => {
    if (pin.length === 6 && !blocked && !isLoading) {
      onSubmit(pin);
    }
  }, [onSubmit, blocked, isLoading]);

  const handleChange = useCallback((val: string) => {
    setValue(val);
    if (val.length === 6) {
      handleComplete(val);
    }
  }, [handleComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-blue-600">lock</span>
          </div>
        </div>
        <h3 className="text-lg font-heading font-bold text-center mb-1 text-farm-brown-dark">{title === 'Nhập mã PIN' ? t('enter_pin') : title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6">{description === 'Nhập mã PIN 6 số để xác nhận' ? t('enter_pin_desc') : description}</p>

        {/* PIN Input: 6 o */}
        <div className="flex justify-center mb-4">
          <InputOTP
            maxLength={6}
            value={value}
            onChange={handleChange}
            disabled={blocked || isLoading}
            autoFocus
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="w-11 h-13 text-xl font-bold rounded-xl border-2 border-gray-200 focus-within:border-blue-500 [&>div]:text-2xl"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Error / Remaining */}
        {error && !blocked && (
          <p className="text-sm text-red-500 text-center mb-3">{error}</p>
        )}
        {attemptsRemaining !== undefined && attemptsRemaining < 5 && !blocked && (
          <p className="text-sm text-orange-500 text-center mb-3">
            {t('attempts_remaining', { count: attemptsRemaining })}
          </p>
        )}
        {blocked && (
          <div className="text-center mb-3 p-3 bg-red-50 rounded-xl border border-red-200">
            <span className="material-symbols-outlined text-red-500 text-xl mb-1">block</span>
            <p className="text-sm text-red-600 font-bold">{t('locked')}</p>
            <p className="text-xs text-red-500">{t('retry_after_1_hour')}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm text-blue-500">{t('confirming')}</p>
          </div>
        )}

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full py-3 text-gray-500 text-sm mt-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
