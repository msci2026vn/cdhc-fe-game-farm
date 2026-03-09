import type { DeliverySlot, DeliverySlotStatus } from '@/shared/types/game-api.types';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG: Record<DeliverySlotStatus, {
  icon: string;
  labelKey: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconBg: string;
}> = {
  available: {
    icon: '🎁',
    labelKey: 'rwa.delivery_slot.status_available',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    iconBg: 'bg-green-100',
  },
  claimed: {
    icon: '📦',
    labelKey: 'rwa.delivery_slot.status_claimed',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    iconBg: 'bg-amber-100',
  },
  shipped: {
    icon: '🚚',
    labelKey: 'rwa.delivery_slot.status_shipped',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    iconBg: 'bg-blue-100',
  },
  delivered: {
    icon: '✅',
    labelKey: 'rwa.delivery_slot.status_delivered',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-600',
    iconBg: 'bg-gray-100',
  },
  expired: {
    icon: '❌',
    labelKey: 'rwa.delivery_slot.status_expired',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-100',
    textColor: 'text-red-400',
    iconBg: 'bg-red-100',
  },
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

interface DeliverySlotCardProps {
  slot: DeliverySlot;
  index: number;
  onClaim?: (slotId: string) => void;
  onScan?: (slotId: string) => void;
  onManualVerify?: (slotId: string) => void;
  onViewBlockchain?: (slotId: string) => void;
  onViewDetail?: (slot: DeliverySlot) => void;
  isClaiming?: boolean;
}

export default function DeliverySlotCard({
  slot, index, onClaim, onScan, onManualVerify, onViewBlockchain, onViewDetail, isClaiming,
}: DeliverySlotCardProps) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[slot.status] ?? STATUS_CONFIG.available;
  const hasBlockchain = !!slot.blockchainTx;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-3 shadow-sm flex flex-col items-center gap-2 transition-all`}>
      {/* Icon + Week */}
      <div className={`${config.iconBg} w-10 h-10 rounded-full flex items-center justify-center`}>
        <span className="text-xl">{config.icon}</span>
      </div>
      <p className="text-sm font-bold text-stone-700">{t('rwa.delivery_slot.box_index', { index: index + 1 })}</p>
      <p className={`text-xs font-medium ${config.textColor} text-center`}>{t(config.labelKey)}</p>

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
            <>🎁 {t('rwa.delivery_slot.claim_btn')}</>
          )}
        </button>
      )}

      {/* === CLAIMED: Recipient info + Scan/Manual buttons === */}
      {slot.status === 'claimed' && (
        <div className="w-full space-y-1.5">
          {/* Recipient name + address */}
          {slot.recipientName && (
            <div className="space-y-0.5">
              <p className="text-[10px] text-amber-700 flex items-center gap-1 truncate">
                <span>👤</span> {slot.recipientName}
              </p>
              {slot.recipientAddress && (
                <p className="text-[10px] text-stone-500 truncate">
                  📍 {slot.recipientAddress}
                </p>
              )}
            </div>
          )}

          {/* OTP code (compact) */}
          {slot.otpCode && (
            <p className="text-center text-xs font-mono font-bold text-amber-800 bg-white border border-amber-200 rounded-lg py-1">
              {t('rwa.delivery_slot.code')}: {slot.otpCode}
            </p>
          )}

          {/* Scan button */}
          {onScan && (
            <button
              onClick={() => onScan(slot.id)}
              className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              📷 {t('rwa.delivery_slot.scan_btn')}
            </button>
          )}

          {/* Manual verify button */}
          {onManualVerify && (
            <button
              onClick={() => onManualVerify(slot.id)}
              className="w-full py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-semibold rounded-lg border border-amber-200 transition-colors flex items-center justify-center gap-1"
            >
              ✏️ {t('rwa.delivery_slot.manual_btn')}
            </button>
          )}
        </div>
      )}

      {/* === DELIVERED: Show date + recipient + blockchain status === */}
      {slot.status === 'delivered' && (
        <div className="w-full space-y-1.5">
          {/* Delivery time */}
          <p className="text-[10px] text-stone-500 text-center">
            {formatDate(slot.deliveredAt) ?? t('rwa.delivery_detail.status_received')}
          </p>

          {/* Recipient name */}
          {slot.recipientName && (
            <p className="text-[10px] text-stone-600 flex items-center gap-1 truncate">
              <span>👤</span> {slot.recipientName}
            </p>
          )}

          {/* Recipient address (truncate 1 line) */}
          {slot.recipientAddress && (
            <p className="text-[10px] text-stone-400 truncate">
              📍 {slot.recipientAddress}
            </p>
          )}

          {/* Blockchain status */}
          {hasBlockchain ? (
            <p className="text-[10px] text-green-600 font-semibold text-center">🔗 {t('rwa.delivery_slot.on_chain')} ✅</p>
          ) : (
            <p className="text-[10px] text-amber-500 font-medium text-center">⏳ {t('rwa.delivery_slot.pending_chain')}</p>
          )}

          {/* View detail button */}
          {onViewDetail && (
            <button
              onClick={() => onViewDetail(slot)}
              className="w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold rounded-lg border border-stone-200 transition-colors flex items-center justify-center gap-1"
            >
              📋 {t('rwa.delivery_slot.view_detail')}
            </button>
          )}
        </div>
      )}

      {/* === SHIPPED: date === */}
      {slot.status === 'shipped' && slot.claimedAt && (
        <p className="text-[10px] text-blue-400">{formatDate(slot.claimedAt)}</p>
      )}
    </div>
  );
}
