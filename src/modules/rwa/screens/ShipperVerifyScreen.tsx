import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVerifyOtp } from '@/shared/hooks/useMyGarden';
import type { VerifyOtpResult } from '@/shared/types/game-api.types';

export default function ShipperVerifyScreen() {
  const navigate = useNavigate();
  const verifyMutation = useVerifyOtp();

  const [slotId, setSlotId] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [result, setResult] = useState<VerifyOtpResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpValue = otp.join('');

  const handleOtpChange = useCallback((index: number, value: string) => {
    // Only accept digits
    const digit = value.replace(/\D/g, '').slice(-1);

    setOtp(prev => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    // Auto-focus next input
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
      // Focus last filled input or the next empty one
      const focusIdx = Math.min(digits.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  }, []);

  const handleVerify = () => {
    if (!slotId.trim()) {
      setError('Vui long nhap Slot ID');
      return;
    }
    if (otpValue.length !== 6) {
      setError('Vui long nhap du 6 so OTP');
      return;
    }

    setError(null);
    setResult(null);

    verifyMutation.mutate(
      { slotId: slotId.trim(), otpCode: otpValue },
      {
        onSuccess: (data) => {
          setResult(data);
          setError(null);
          // Reset form for next verify
          setOtp(['', '', '', '', '', '']);
          setSlotId('');
        },
        onError: (err: Error) => {
          setError(err.message || 'Xac nhan that bai');
          setResult(null);
        },
      },
    );
  };

  const handleReset = () => {
    setSlotId('');
    setOtp(['', '', '', '', '', '']);
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-gradient-to-b from-blue-50 via-white to-blue-50/30 min-h-[100dvh] text-stone-800 font-body select-none">
      <div className="max-w-[430px] mx-auto min-h-[100dvh] relative">

        {/* Header */}
        <div className="relative z-10 px-4 pt-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/80 border border-stone-200 flex items-center justify-center shadow-sm"
          >
            <span className="material-symbols-outlined text-stone-600 text-lg">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-blue-800 flex items-center gap-1.5">
              <span>🚚</span> Xac nhan giao hang
            </h1>
          </div>
        </div>

        <div className="px-4 mt-6 space-y-5">

          {/* Slot ID input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">Slot ID:</label>
            <input
              type="text"
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              placeholder="Nhap hoac paste Slot ID..."
              className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
            />
          </div>

          {/* OTP input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">Ma OTP:</label>
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
                  className="w-12 h-14 text-center text-2xl font-mono font-bold text-blue-800 bg-white border-2 border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                />
              ))}
            </div>
          </div>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={verifyMutation.isPending}
            className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {verifyMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <>✅ Xac nhan</>
            )}
          </button>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <span className="text-lg">❌</span>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Success result */}
          {result?.success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <p className="text-base font-bold text-green-700">Giao hang thanh cong!</p>
              </div>
              <div className="text-sm text-green-600 space-y-1">
                <p>🔗 Blockchain: {result.blockchainStatus === 'pending' ? 'Dang cho ghi' : result.blockchainStatus}</p>
                {result.deliveryHash && (
                  <p className="font-mono text-xs text-green-500 break-all">
                    Hash: {result.deliveryHash}
                  </p>
                )}
              </div>
              <button
                onClick={handleReset}
                className="w-full mt-2 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-sm rounded-xl border border-green-200 transition-colors"
              >
                Xac nhan slot tiep
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white/60 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <span className="text-lg leading-none mt-0.5">ℹ️</span>
            <p className="text-xs text-stone-500 leading-relaxed">
              Nhap Slot ID va ma OTP 6 so ma khach hang cung cap. Bam "Xac nhan" de hoan tat giao hang.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
