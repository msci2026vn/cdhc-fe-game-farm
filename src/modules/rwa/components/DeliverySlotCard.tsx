import { useState } from 'react';
import type { DeliverySlot, DeliverySlotStatus } from '@/shared/types/game-api.types';
import { useUIStore } from '@/shared/stores/uiStore';

const STATUS_CONFIG: Record<DeliverySlotStatus, {
  icon: string;
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconBg: string;
}> = {
  available: {
    icon: '🎁',
    label: 'San sang nhan rau',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    iconBg: 'bg-green-100',
  },
  claimed: {
    icon: '📦',
    label: 'Cho giao hang',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    iconBg: 'bg-amber-100',
  },
  shipped: {
    icon: '🚚',
    label: 'Dang giao hang',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    iconBg: 'bg-blue-100',
  },
  delivered: {
    icon: '✅',
    label: 'Da nhan',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-600',
    iconBg: 'bg-gray-100',
  },
  expired: {
    icon: '❌',
    label: 'Het han',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-100',
    textColor: 'text-red-400',
    iconBg: 'bg-red-100',
  },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

interface DeliverySlotCardProps {
  slot: DeliverySlot;
  index: number;
  onClaim?: (slotId: string) => void;
  onViewQr?: (slotId: string) => void;
  onViewBlockchain?: (slotId: string) => void;
  isClaiming?: boolean;
}

export default function DeliverySlotCard({
  slot, index, onClaim, onViewQr, onViewBlockchain, isClaiming,
}: DeliverySlotCardProps) {
  const config = STATUS_CONFIG[slot.status] ?? STATUS_CONFIG.available;
  const [otpCopied, setOtpCopied] = useState(false);

  const handleCopyOtp = async () => {
    if (!slot.otpCode) return;
    try {
      await navigator.clipboard.writeText(slot.otpCode);
      setOtpCopied(true);
      useUIStore.getState().addToast('Da copy ma OTP', 'success');
      setTimeout(() => setOtpCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const hasBlockchain = !!slot.blockchainTx;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-3 shadow-sm flex flex-col items-center gap-2 transition-all`}>
      {/* Icon + Week */}
      <div className={`${config.iconBg} w-10 h-10 rounded-full flex items-center justify-center`}>
        <span className="text-xl">{config.icon}</span>
      </div>
      <p className="text-sm font-bold text-stone-700">Tuan {index + 1}</p>
      <p className={`text-xs font-medium ${config.textColor} text-center`}>{config.label}</p>

      {/* === AVAILABLE: Claim button === */}
      {slot.status === 'available' && onClaim && (
        <button
          onClick={() => onClaim(slot.id)}
          disabled={isClaiming}
          className="w-full mt-1 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          {isClaiming ? (
            <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          ) : (
            <>🎁 Nhan hang</>
          )}
        </button>
      )}

      {/* === CLAIMED: OTP display === */}
      {slot.status === 'claimed' && slot.otpCode && (
        <div className="w-full space-y-1.5">
          <p className="text-[10px] text-amber-600 text-center font-medium">Ma nhan hang:</p>
          <div className="bg-white border border-amber-200 rounded-lg py-1.5 px-2">
            <p className="text-center text-lg font-mono font-bold text-amber-800 tracking-[0.3em]">
              {slot.otpCode}
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleCopyOtp}
              className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-semibold rounded-lg border border-amber-200 transition-colors"
            >
              {otpCopied ? '✓ Da copy' : '📋 Copy'}
            </button>
            {onViewQr && (
              <button
                onClick={() => onViewQr(slot.id)}
                className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-semibold rounded-lg border border-amber-200 transition-colors"
              >
                📱 QR
              </button>
            )}
          </div>
        </div>
      )}

      {/* CLAIMED but no OTP yet (fallback) */}
      {slot.status === 'claimed' && !slot.otpCode && onViewQr && (
        <button
          onClick={() => onViewQr(slot.id)}
          className="w-full mt-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-semibold rounded-lg border border-amber-200 transition-colors"
        >
          📱 Xem ma OTP
        </button>
      )}

      {/* === DELIVERED: Show date + blockchain status === */}
      {slot.status === 'delivered' && (
        <div className="w-full space-y-1.5">
          {slot.deliveredAt && (
            <p className="text-[10px] text-stone-500 text-center">
              ✅ {formatDate(slot.deliveredAt)}
            </p>
          )}

          {hasBlockchain ? (
            <div className="text-center">
              <p className="text-[10px] text-green-600 font-semibold">🔗 Blockchain: Verified ✅</p>
              {onViewBlockchain && (
                <button
                  onClick={() => onViewBlockchain(slot.id)}
                  className="w-full mt-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-semibold rounded-lg border border-blue-200 transition-colors"
                >
                  Xem Snowtrace →
                </button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[10px] text-amber-500 font-medium">⏳ Blockchain: Dang cho</p>
              {onViewBlockchain && (
                <button
                  onClick={() => onViewBlockchain(slot.id)}
                  className="w-full mt-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-500 text-[10px] font-semibold rounded-lg border border-stone-200 transition-colors"
                >
                  📱 Xem nguon goc
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* === SHIPPED: date === */}
      {slot.status === 'shipped' && slot.claimedAt && (
        <p className="text-[10px] text-blue-400">{formatDate(slot.claimedAt)}</p>
      )}

      {/* === EXPIRED: just the greyed state (already shown above) === */}
    </div>
  );
}
