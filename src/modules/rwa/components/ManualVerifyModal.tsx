import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useManualVerify } from '@/shared/hooks/useMyGarden';
import { useTranslation } from 'react-i18next';

interface ManualVerifyModalProps {
  open: boolean;
  onClose: () => void;
  slotId: string | null;
}

export default function ManualVerifyModal({ open, onClose, slotId }: ManualVerifyModalProps) {
  const { t } = useTranslation();
  const verifyMutation = useManualVerify();

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpValue = otp.join('');

  const resetState = () => {
    setOtp(['', '', '', '', '', '']);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleOtpChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp(prev => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const digits = pasted.split('');
      setOtp(prev => {
        const next = [...prev];
        digits.forEach((d, i) => { next[i] = d; });
        return next;
      });
      const focusIdx = Math.min(digits.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  }, []);

  const handleVerify = () => {
    if (!slotId) return;
    if (otpValue.length !== 6) {
      setError(t('rwa.manual_verify.error_length'));
      return;
    }

    setError(null);
    verifyMutation.mutate(
      { slotId, otpCode: otpValue },
      {
        onSuccess: () => {
          setSuccess(true);
          // User clicks "Đóng" to close — no auto-close to avoid race condition
        },
        onError: (err: Error) => {
          setError(err.message || t('rwa.manual_verify.error_confirm'));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[380px] rounded-2xl bg-gradient-to-b from-amber-50 to-white p-0 border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center">
          <DialogTitle className="text-lg font-bold text-amber-800 flex items-center justify-center gap-2">
            <span>✏️</span> {t('rwa.manual_verify.title')}
          </DialogTitle>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {success ? (
            /* Success state */
            <div className="text-center py-6 space-y-3">
              <span className="text-4xl">✅</span>
              <p className="text-base font-bold text-green-700">{t('rwa.manual_verify.success')}</p>
              <p className="text-sm text-green-600">+50 XP</p>
              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-xl transition-colors mt-2"
              >
                Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <p className="text-sm text-stone-600 text-center">
                Nhập mã 6 số trên phiếu giao hàng:
              </p>

              {/* OTP Input */}
              <div className="flex items-center justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-mono font-bold text-amber-800 bg-white border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-lg">❌</span>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Verify button */}
              <button
                onClick={handleVerify}
                disabled={verifyMutation.isPending || otpValue.length !== 6}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {verifyMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  `✅ ${t('rwa.manual_verify.confirm')}`
                )}
              </button>

              {/* Cancel */}
              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium text-sm rounded-xl border border-stone-200 transition-colors"
              >
                Hủy
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
