import { useState } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useTranslation } from 'react-i18next';

interface ChangePinModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (oldPin: string, newPin: string) => Promise<void>;
    isLoading?: boolean;
    error?: string;
}

export function ChangePinModal({ open, onClose, onSubmit, isLoading, error }: ChangePinModalProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<'old' | 'new' | 'confirm'>('old');
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [value, setValue] = useState('');
    const [mismatch, setMismatch] = useState(false);

    // Reset when opened
    if (open && value === '' && step !== 'old' && !isLoading && !error && !mismatch && oldPin === '') {
        // already reset via useEffect equivalent below, but we can do it safely here conditionally
    }

    // Handle value change based on step
    const handleChange = (val: string) => {
        setValue(val);
        setMismatch(false);

        if (val.length === 6) {
            if (step === 'old') {
                setOldPin(val);
                setStep('new');
                setTimeout(() => setValue(''), 50);
            } else if (step === 'new') {
                setNewPin(val);
                setStep('confirm');
                setTimeout(() => setValue(''), 50);
            } else if (step === 'confirm') {
                if (val === newPin) {
                    onSubmit(oldPin, newPin);
                } else {
                    setMismatch(true);
                    setTimeout(() => setValue(''), 300);
                }
            }
        }
    };

    const handleBack = () => {
        if (step === 'new') {
            setStep('old');
            setValue('');
        } else if (step === 'confirm') {
            setStep('new');
            setValue('');
            setMismatch(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-blue-600">
                            lock_reset
                        </span>
                    </div>
                </div>
                <h3 className="text-lg font-heading font-bold text-center mb-1 text-farm-brown-dark">
                    {t('change_pin')}
                </h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                    {step === 'old' && t('enter_current_pin')}
                    {step === 'new' && t('enter_new_pin')}
                    {step === 'confirm' && t('confirm_new_pin')}
                </p>

                {/* Step indicator */}
                <div className="flex justify-center gap-2 mb-5">
                    <div className={`h-1 w-8 rounded-full transition-colors ${step === 'old' ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    <div className={`h-1 w-8 rounded-full transition-colors ${step === 'new' ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    <div className={`h-1 w-8 rounded-full transition-colors ${step === 'confirm' ? 'bg-blue-500' : 'bg-gray-200'}`} />
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
                                    className="w-11 h-13 text-xl font-bold rounded-xl border-2 border-gray-200 focus-within:border-blue-500 [&>div]:text-2xl"
                                />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                {/* Mismatch / Error */}
                {mismatch && <p className="text-sm text-red-500 text-center mb-3">{t('new_pin_mismatch')}</p>}
                {error && <p className="text-sm text-red-500 text-center mb-3">{error}</p>}

                {isLoading && (
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-sm text-blue-600">{t('updating')}</p>
                    </div>
                )}

                <div className="flex gap-2 mt-4">
                    {step !== 'old' && (
                        <button
                            onClick={handleBack}
                            className="flex-1 py-3 text-blue-500 text-sm rounded-xl hover:bg-blue-50 transition-colors font-medium"
                        >
                            {t('back')}
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
