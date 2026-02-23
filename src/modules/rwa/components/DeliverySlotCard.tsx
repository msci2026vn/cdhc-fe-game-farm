import type { DeliverySlot, DeliverySlotStatus } from '@/shared/types/game-api.types';

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
    label: 'Sẵn sàng nhận rau',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    iconBg: 'bg-green-100',
  },
  claimed: {
    icon: '📦',
    label: 'Đã đặt, chờ giao',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    iconBg: 'bg-amber-100',
  },
  shipped: {
    icon: '🚚',
    label: 'Đang giao hàng',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    iconBg: 'bg-blue-100',
  },
  delivered: {
    icon: '✅',
    label: 'Đã nhận',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-500',
    iconBg: 'bg-gray-100',
  },
  expired: {
    icon: '❌',
    label: 'Hết hạn',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-100',
    textColor: 'text-red-400',
    iconBg: 'bg-red-100',
  },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

interface DeliverySlotCardProps {
  slot: DeliverySlot;
  index: number;
}

export default function DeliverySlotCard({ slot, index }: DeliverySlotCardProps) {
  const config = STATUS_CONFIG[slot.status] ?? STATUS_CONFIG.available;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 shadow-sm flex flex-col items-center gap-2 transition-all`}>
      <div className={`${config.iconBg} w-12 h-12 rounded-full flex items-center justify-center`}>
        <span className="text-2xl">{config.icon}</span>
      </div>
      <p className="text-sm font-bold text-stone-700">Tuần {index + 1}</p>
      <p className={`text-xs font-medium ${config.textColor} text-center`}>{config.label}</p>
      {slot.deliveredAt && (
        <p className="text-[10px] text-gray-400">{formatDate(slot.deliveredAt)}</p>
      )}
      {slot.claimedAt && !slot.deliveredAt && (
        <p className="text-[10px] text-amber-400">{formatDate(slot.claimedAt)}</p>
      )}
    </div>
  );
}
