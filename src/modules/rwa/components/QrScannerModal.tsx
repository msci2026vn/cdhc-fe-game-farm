import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';
import { useScanClaim } from '@/shared/hooks/useMyGarden';
import { useTranslation } from 'react-i18next';

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  slotId: string | null;
}

type Phase = 'scanning' | 'success' | 'error';

export default function QrScannerModal({ open, onClose, slotId }: QrScannerModalProps) {
  const { t } = useTranslation();
  const scanClaim = useScanClaim();
  const [phase, setPhase] = useState<Phase>('scanning');
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (!open || !slotId) return;

    setPhase('scanning');
    setError('');
    processedRef.current = false;

    // Small delay to ensure DOM element is mounted
    const timeout = setTimeout(() => {
      const elementId = 'qr-reader-element';
      const el = document.getElementById(elementId);
      if (!el) return;

      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (processedRef.current) return;
          processedRef.current = true;
          handleScanResult(decodedText, scanner);
        },
        () => { /* ignore scan errors */ },
      ).catch(() => {
        setPhase('error');
        setError(t('rwa.qr_scanner.error_camera'));
      });
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => { });
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slotId]);

  const handleScanResult = async (decodedText: string, scanner: Html5Qrcode) => {
    // Stop scanner immediately
    try { await scanner.stop(); } catch { /* ignore */ }

    let qr: { t?: string; s?: string; c?: string; k?: string };
    try {
      qr = JSON.parse(decodedText);
    } catch {
      setPhase('error');
      setError(t('rwa.qr_scanner.error_invalid_qr'));
      return;
    }

    if (qr.t !== 'fv_d') {
      setPhase('error');
      setError(t('rwa.qr_scanner.error_not_farmverse'));
      return;
    }

    if (qr.s !== slotId) {
      setPhase('error');
      setError(t('rwa.qr_scanner.error_mismatch'));
      return;
    }

    if (!qr.c || !qr.k) {
      setPhase('error');
      setError(t('rwa.qr_scanner.error_missing_data'));
      return;
    }

    scanClaim.mutate(
      { slotId: qr.s, otpCode: qr.c, secretToken: qr.k },
      {
        onSuccess: () => {
          setPhase('success');
          // User clicks "Đóng" to close — no auto-close to avoid race condition
        },
        onError: (err: Error) => {
          setPhase('error');
          setError(err.message || t('rwa.qr_scanner.error_confirm'));
        },
      },
    );
  };

  const handleClose = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* already stopped */ }
      scannerRef.current = null;
    }
    setPhase('scanning');
    setError('');
    processedRef.current = false;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[380px] rounded-2xl bg-gradient-to-b from-amber-50 to-white p-0 border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center">
          <DialogTitle className="text-lg font-bold text-amber-800 flex items-center justify-center gap-2">
            <span>📷</span> {t('rwa.qr_scanner.title')}
          </DialogTitle>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Camera / Scanner */}
          {phase === 'scanning' && (
            <div className="space-y-3">
              <div
                id="qr-reader-element"
                className="w-full aspect-square rounded-xl overflow-hidden bg-black/5 border border-stone-200"
              />
              <p className="text-xs text-stone-500 text-center">
                {t('rwa.qr_scanner.instruction')}
              </p>
              {scanClaim.isPending && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                  <span className="text-sm text-amber-700 font-medium">{t('rwa.qr_scanner.confirming')}</span>
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {phase === 'success' && (
            <div className="text-center py-6 space-y-3">
              <span className="text-4xl">✅</span>
              <p className="text-base font-bold text-green-700">{t('rwa.qr_scanner.success')}</p>
              <p className="text-sm text-green-600">+50 XP</p>
              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-xl transition-colors mt-2"
              >
                {t('rwa.qr_scanner.close')}
              </button>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-2">
                <span className="text-3xl">❌</span>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
              <button
                onClick={() => {
                  processedRef.current = false;
                  setPhase('scanning');
                  setError('');
                }}
                className="w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-700 font-semibold text-sm rounded-xl border border-amber-200 transition-colors"
              >
                {t('rwa.qr_scanner.retry')}
              </button>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium text-sm rounded-xl border border-stone-200 transition-colors"
          >
            {t('rwa.qr_scanner.close')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
