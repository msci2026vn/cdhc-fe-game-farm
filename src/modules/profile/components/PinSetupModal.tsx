import { useState, useEffect, useCallback } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useTranslation } from 'react-i18next';

interface PinSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function PinSetupModal({ open, onClose, onSubmit, isLoading, error }: PinSetupModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [value, setValue] = useState('');
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('enter');
      setPin('');
      setValue('');
      setMismatch(false);
    }
  }, [open]);

  const handleChange = useCallback((val: string) => {
    setValue(val);
    setMismatch(false);

    if (val.length === 6) {
      if (step === 'enter') {
        setPin(val);
        setStep('confirm');
        // Reset input for confirm step
        setTimeout(() => setValue(''), 50);
      } else {
        // Confirm step
        if (val === pin) {
          onSubmit(pin);
        } else {
          setMismatch(true);
          setTimeout(() => setValue(''), 300);
        }
      }
    }
  }, [step, pin, onSubmit]);

  const handleBack = useCallback(() => {
    setStep('enter');
    setValue('');
    setMismatch(false);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-green-600">
              {step === 'enter' ? 'lock' : 'lock_reset'}
            </span>
          </div>
        </div>
        <h3 className="text-lg font-heading font-bold text-center mb-1 text-farm-brown-dark">
          {step === 'enter' ? t('create_pin') : t('confirm_pin')}
        </h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          {step === 'enter'
            ? t('enter_pin_protect_desc')
            : t('re_enter_pin_desc')}
        </p>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-5">
          <div className={`h-1 w-10 rounded-full transition-colors ${step === 'enter' ? 'bg-green-500' : 'bg-gray-200'}`} />
          <div className={`h-1 w-10 rounded-full transition-colors ${step === 'confirm' ? 'bg-green-500' : 'bg-gray-200'}`} />
        </div>

        {/* PIN Input */}
        <div className="flex justify-center mb-4">
          <InputOTP
            key={step} // Force remount on step change for autoFocus
            maxLength={6}
            value={value}
            onChange={handleChange}
            disabled={isLoading}
            autoFocus
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="w-11 h-13 text-xl font-bold rounded-xl border-2 border-gray-200 focus-within:border-green-500 [&>div]:text-2xl"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Mismatch error */}
        {mismatch && (
          <p className="text-sm text-red-500 text-center mb-3">{t('pin_mismatch')}</p>
        )}

        {/* Server error */}
        {error && (
          <p className="text-sm text-red-500 text-center mb-3">{error}</p>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
            <p className="text-sm text-green-600">{t('setting_up')}</p>
          </div>
        )}

        {/* Back / Cancel */}
        <div className="flex gap-2 mt-4">
          {step === 'confirm' && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 text-blue-500 text-sm rounded-xl hover:bg-blue-50 transition-colors font-medium"
            >
              {t('re_enter')}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 text-gray-500 text-sm rounded-xl hover:bg-gray-50 transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
