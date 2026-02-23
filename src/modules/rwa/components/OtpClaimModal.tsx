import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { ClaimSlotResult } from '@/shared/types/game-api.types';
import { useUIStore } from '@/shared/stores/uiStore';

interface OtpClaimModalProps {
  open: boolean;
  onClose: () => void;
  weekNumber: number;
  data: ClaimSlotResult | null;
}

function formatExpiry(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OtpClaimModal({ open, onClose, weekNumber, data }: OtpClaimModalProps) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.otpCode);
      setCopied(true);
      useUIStore.getState().addToast('Da copy ma OTP', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      useUIStore.getState().addToast('Khong the copy', 'error');
    }
  };

  const otpDigits = data.otpCode.split('');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[380px] rounded-2xl bg-gradient-to-b from-green-50 to-white p-0 border-green-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center">
          <DialogTitle className="text-lg font-bold text-green-800 flex items-center justify-center gap-2">
            <span>📦</span> Nhan hang Tuan {weekNumber}
          </DialogTitle>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* OTP display */}
          <div className="text-center space-y-2">
            <p className="text-sm text-stone-600 font-medium">Ma nhan hang cua ban:</p>
            <div className="bg-white border-2 border-green-300 rounded-xl py-4 px-3 shadow-inner">
              <div className="flex items-center justify-center gap-2">
                {otpDigits.map((digit, i) => (
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
              Het han: {formatExpiry(data.expiresAt)}
            </p>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-sm rounded-xl border border-green-200 transition-colors"
          >
            <span>{copied ? '✓' : '📋'}</span>
            {copied ? 'Da copy!' : 'Copy ma'}
          </button>

          {/* Instructions */}
          <p className="text-xs text-stone-500 text-center leading-relaxed">
            Doc ma nay cho shipper khi nhan rau. Het han sau 48h.
          </p>

          {/* Batch info separator */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Nguon goc</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          {/* Batch info */}
          <div className="bg-white/80 border border-stone-200 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <span>🌿</span>
              <span className="font-medium text-stone-700">{data.batchInfo.productName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>🏡</span>
              <span className="text-stone-600">{data.batchInfo.farmName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>📅</span>
              <span className="text-stone-600">Thu hoach: {data.batchInfo.harvestDate}</span>
            </div>
          </div>

          {/* QR code */}
          {data.qrDataUrl && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={data.qrDataUrl}
                alt="QR Code"
                className="w-32 h-32 rounded-lg border border-stone-200"
              />
              <p className="text-[10px] text-stone-400">Scan QR de xem nguon goc</p>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium text-sm rounded-xl border border-stone-200 transition-colors"
          >
            Dong
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
