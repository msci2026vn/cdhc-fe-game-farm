import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { ClaimSlotResult } from '@/shared/types/game-api.types';
import { useClaimSlot } from '@/shared/hooks/useMyGarden';
import { useUIStore } from '@/shared/stores/uiStore';

interface OtpClaimModalProps {
  open: boolean;
  onClose: () => void;
  slotId: string | null;
  weekNumber: number;
}

const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

function formatExpiry(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OtpClaimModal({ open, onClose, slotId, weekNumber }: OtpClaimModalProps) {
  const claimMutation = useClaimSlot();

  const [step, setStep] = useState<'form' | 'result'>('form');
  const [result, setResult] = useState<ClaimSlotResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  const resetForm = () => {
    setStep('form');
    setResult(null);
    setName('');
    setPhone('');
    setAddress('');
    setNote('');
    setErrors({});
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Vui lòng nhập họ tên (ít nhất 2 ký tự)';
    if (name.trim().length > 100) e.name = 'Họ tên tối đa 100 ký tự';
    if (!PHONE_REGEX.test(phone.trim())) e.phone = 'Số điện thoại không hợp lệ';
    if (!address.trim() || address.trim().length < 10) e.address = 'Vui lòng nhập địa chỉ đầy đủ (ít nhất 10 ký tự)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!slotId || !validate()) return;

    claimMutation.mutate(
      {
        slotId,
        recipientName: name.trim(),
        recipientPhone: phone.trim(),
        recipientAddress: address.trim(),
        recipientNote: note.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setResult(data);
          setStep('result');
        },
      },
    );
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.otpCode);
      setCopied(true);
      useUIStore.getState().addToast('Đã copy mã OTP', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      useUIStore.getState().addToast('Không thể copy', 'error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[380px] rounded-2xl bg-gradient-to-b from-green-50 to-white p-0 border-green-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center">
          <DialogTitle className="text-lg font-bold text-green-800 flex items-center justify-center gap-2">
            <span>📦</span> {step === 'form' ? `Nhận quà Tuần ${weekNumber}` : 'Đã đăng ký nhận quà!'}
          </DialogTitle>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* ═══ STEP 1: FORM ═══ */}
          {step === 'form' && (
            <>
              {/* Name */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Họ tên người nhận *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Số điện thoại *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all"
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Địa chỉ giao hàng *</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="456 Đường ABC, Quận 1, TP.HCM"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all resize-none"
                />
                {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-600">Ghi chú (tùy chọn)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tầng 3, cổng trái..."
                  className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={claimMutation.isPending}
                className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {claimMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  'Xác nhận nhận quà'
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

          {/* ═══ STEP 2: RESULT ═══ */}
          {step === 'result' && result && (
            <>
              {/* OTP display */}
              <div className="text-center space-y-2">
                <p className="text-sm text-stone-600 font-medium">Mã nhận hàng của bạn:</p>
                <div className="bg-white border-2 border-green-300 rounded-xl py-4 px-3 shadow-inner">
                  <div className="flex items-center justify-center gap-2">
                    {result.otpCode.split('').map((digit, i) => (
                      <span
                        key={i}
                        className="text-3xl font-mono font-bold text-green-800 bg-green-50 w-11 h-14 flex items-center justify-center rounded-lg border border-green-200"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-stone-400">
                  Hết hạn: {formatExpiry(result.expiresAt)}
                </p>
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-sm rounded-xl border border-green-200 transition-colors"
              >
                <span>{copied ? '✓' : '📋'}</span>
                {copied ? 'Đã copy!' : 'Copy mã'}
              </button>

              {/* Recipient info */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-stone-200" />
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Giao đến</span>
                <div className="h-px flex-1 bg-stone-200" />
              </div>

              <div className="bg-white/80 border border-stone-200 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span>👤</span>
                  <span className="font-medium text-stone-700">{result.recipientInfo.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>📍</span>
                  <span className="text-stone-600">{result.recipientInfo.address}</span>
                </div>
              </div>

              {/* Batch info separator */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-stone-200" />
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Nguồn gốc</span>
                <div className="h-px flex-1 bg-stone-200" />
              </div>

              {/* Batch info */}
              <div className="bg-white/80 border border-stone-200 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span>🌿</span>
                  <span className="font-medium text-stone-700">{result.batchInfo.product}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>🏡</span>
                  <span className="text-stone-600">{result.batchInfo.farm}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>📅</span>
                  <span className="text-stone-600">Thu hoạch: {result.batchInfo.harvestDate}</span>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium text-sm rounded-xl border border-stone-200 transition-colors"
              >
                Đóng
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
