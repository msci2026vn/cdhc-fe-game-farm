import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { ClaimSlotResult, RecipientInfo } from '@/shared/types/game-api.types';
import { useClaimSlot } from '@/shared/hooks/useMyGarden';
import { useUIStore } from '@/shared/stores/uiStore';
import { useTranslation } from 'react-i18next';

interface OtpClaimModalProps {
  open: boolean;
  onClose: () => void;
  slotId: string | null;
  weekNumber: number;
  lastRecipientInfo?: RecipientInfo | null;
}

const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

function formatExpiry(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OtpClaimModal({ open, onClose, slotId, weekNumber, lastRecipientInfo }: OtpClaimModalProps) {
  const { t } = useTranslation();
  const claimMutation = useClaimSlot();

  const [step, setStep] = useState<'review' | 'form' | 'result'>(
    lastRecipientInfo ? 'review' : 'form',
  );
  const [result, setResult] = useState<ClaimSlotResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Review note — luôn editable
  const [reviewNote, setReviewNote] = useState(lastRecipientInfo?.note || '');

  // Form fields
  const [name, setName] = useState(lastRecipientInfo?.name || '');
  const [phone, setPhone] = useState(lastRecipientInfo?.phone || '');
  const [address, setAddress] = useState(lastRecipientInfo?.address || '');
  const [note, setNote] = useState(lastRecipientInfo?.note || '');

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  const resetForm = () => {
    const hasLast = !!lastRecipientInfo;
    setStep(hasLast ? 'review' : 'form');
    setResult(null);
    setReviewNote(lastRecipientInfo?.note || '');
    setName(lastRecipientInfo?.name || '');
    setPhone(lastRecipientInfo?.phone || '');
    setAddress(lastRecipientInfo?.address || '');
    setNote(lastRecipientInfo?.note || '');
    setErrors({});
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim() || name.trim().length < 2) e.name = t('rwa.otp_claim.name_error_empty');
    if (name.trim().length > 100) e.name = t('rwa.otp_claim.name_error_max');
    if (!PHONE_REGEX.test(phone.trim())) e.phone = t('rwa.otp_claim.phone_error');
    if (!address.trim() || address.trim().length < 10) e.address = t('rwa.otp_claim.address_error');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // "Xác nhận" từ review → data cũ + note MỚI
  const handleQuickSubmit = () => {
    if (!slotId || !lastRecipientInfo) return;

    claimMutation.mutate(
      {
        slotId,
        recipientName: lastRecipientInfo.name,
        recipientPhone: lastRecipientInfo.phone,
        recipientAddress: lastRecipientInfo.address,
        recipientNote: reviewNote.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setResult(data);
          setStep('result');
        },
      },
    );
  };

  // "Chỉnh sửa" → form pre-fill (giữ note đang gõ)
  const handleEdit = () => {
    setName(lastRecipientInfo?.name || '');
    setPhone(lastRecipientInfo?.phone || '');
    setAddress(lastRecipientInfo?.address || '');
    setNote(reviewNote); // giữ note đang gõ ở review
    setStep('form');
  };

  // Submit từ form
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
      useUIStore.getState().addToast(t('rwa.otp_claim.toast_copy_success'), 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      useUIStore.getState().addToast(t('rwa.otp_claim.toast_copy_error'), 'error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[380px] rounded-2xl bg-gradient-to-b from-green-50 to-white p-0 border-green-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center">
          <DialogTitle className="text-lg font-bold text-green-800 flex items-center justify-center gap-2">
            <span>📦</span> {step === 'result' ? t('rwa.otp_claim.title_result') : t('rwa.otp_claim.title_form', { weekNumber })}
          </DialogTitle>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* ═══ STEP: REVIEW (lần 2+) ═══ */}
          {step === 'review' && lastRecipientInfo && (
            <>
              {/* Read-only recipient info */}
              <div>
                <label className="text-sm font-semibold text-stone-700 mb-1.5 block">{t('rwa.otp_claim.review_info')}</label>
                <div className="bg-white/80 border border-stone-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-400">👤</span>
                    <span className="font-medium text-stone-700">{lastRecipientInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-400">📞</span>
                    <span className="text-stone-600">{lastRecipientInfo.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-stone-400 mt-0.5">📍</span>
                    <span className="text-stone-600">{lastRecipientInfo.address}</span>
                  </div>
                </div>
              </div>

              {/* Edit link */}
              <button
                type="button"
                onClick={handleEdit}
                className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1 -mt-1"
              >
                <span>✏️</span> {t('rwa.otp_claim.edit_info')}
              </button>

              {/* Note — LUÔN EDITABLE */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-600">{t('rwa.otp_claim.review_note')}</label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={t("rwa.otp_claim.review_note_placeholder")}
                  maxLength={200}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all resize-none"
                />
                <p className="text-[11px] text-stone-400">{t('rwa.otp_claim.review_note_hint')}</p>
              </div>

              {/* Quick submit */}
              <button
                onClick={handleQuickSubmit}
                disabled={claimMutation.isPending}
                className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {claimMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  t('rwa.otp_claim.quick_submit')
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

          {/* ═══ STEP: FORM ═══ */}
          {step === 'form' && (
            <>
              {/* Back to review link (nếu có lastRecipientInfo) */}
              {lastRecipientInfo && (
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="text-xs font-medium text-stone-500 hover:text-stone-700 flex items-center gap-1 -mt-1"
                >
                  {t('rwa.otp_claim.back')}
                </button>
              )}

              {/* Name */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">{t('rwa.otp_claim.name_label')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("rwa.otp_claim.name_placeholder")}
                  className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">{t('rwa.otp_claim.phone_label')}</label>
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
                <label className="text-sm font-semibold text-stone-700">{t('rwa.otp_claim.address_label')}</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("rwa.otp_claim.address_placeholder")}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all resize-none"
                />
                {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-600">{t('rwa.otp_claim.note_label')}</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("rwa.otp_claim.note_placeholder")}
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
                  t('rwa.otp_claim.quick_submit')
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

          {/* ═══ STEP: RESULT ═══ */}
          {step === 'result' && result && (
            <>
              {/* OTP display */}
              <div className="text-center space-y-2">
                <p className="text-sm text-stone-600 font-medium">{t('rwa.otp_claim.otp_display')}</p>
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
                  {t('rwa.otp_claim.expiry')}: {formatExpiry(result.expiresAt)}
                </p>
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-sm rounded-xl border border-green-200 transition-colors"
              >
                <span>{copied ? '✓' : '📋'}</span>
                {copied ? t('rwa.otp_claim.copied') : t('rwa.otp_claim.copy_btn')}
              </button>

              {/* Recipient info */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-stone-200" />
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('rwa.otp_claim.deliver_to')}</span>
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
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('rwa.otp_claim.source')}</span>
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
                  <span className="text-stone-600">{t('rwa.otp_claim.harvest')} {result.batchInfo.harvestDate}</span>
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
