import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MyGardenData, DeliveryHistoryMonth } from '@/shared/types/game-api.types';
import DeliverySlotCard from './DeliverySlotCard';

function formatMonthYear(my: string) {
  const [year, month] = my.split('-');
  return `Tháng ${month}/${year}`;
}

function tierLabel(tier: string) {
  if (tier === 'premium') return 'VIP Premium';
  return 'VIP Standard';
}

interface MyGardenViewProps {
  garden: MyGardenData;
  history?: DeliveryHistoryMonth[];
  isLoadingHistory?: boolean;
}

export default function MyGardenView({ garden, history, isLoadingHistory }: MyGardenViewProps) {
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="bg-gradient-to-b from-green-50 via-[#fefae0] to-[#f4f1de] min-h-[100dvh] text-stone-800 font-body select-none">
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
            <h1 className="text-xl font-bold text-green-800 flex items-center gap-1.5">
              <span>🌿</span> Vườn Của Tôi
            </h1>
          </div>
        </div>

        {/* Month + VIP info bar */}
        <div className="px-4 mt-3 flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 bg-white/80 rounded-full text-xs font-semibold text-stone-600 border border-stone-200">
            {formatMonthYear(garden.monthYear)}
          </span>
          <span className="px-2.5 py-1 bg-amber-100 rounded-full text-xs font-bold text-amber-700 border border-amber-200">
            {tierLabel(garden.vipTier)}
          </span>
          <span className="px-2.5 py-1 bg-green-100 rounded-full text-xs font-bold text-green-700 border border-green-200">
            {garden.availableSlots}/{garden.totalSlots} sẵn sàng
          </span>
        </div>

        {/* Delivery slots grid */}
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          {garden.slots.map((slot, i) => (
            <DeliverySlotCard key={slot.id} slot={slot} index={i} />
          ))}
        </div>

        {/* Info text */}
        <div className="px-4 mt-4">
          <div className="bg-white/60 border border-green-200 rounded-xl p-3 flex items-start gap-2">
            <span className="text-lg leading-none mt-0.5">ℹ️</span>
            <p className="text-xs text-stone-600 leading-relaxed">
              Scan QR trên hộp rau để xác nhận đã nhận. Rau hữu cơ được giao từ nông trại CDHC mỗi tuần.
            </p>
          </div>
        </div>

        {/* History section */}
        <div className="px-4 mt-6 pb-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-center gap-2 py-2"
          >
            <div className="h-px flex-1 bg-stone-300/50" />
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">
              Lịch sử nhận rau
            </span>
            <span className="material-symbols-outlined text-stone-400 text-sm">
              {showHistory ? 'expand_less' : 'expand_more'}
            </span>
            <div className="h-px flex-1 bg-stone-300/50" />
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {isLoadingHistory ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                </div>
              ) : history && history.length > 0 ? (
                history.map((m) => (
                  <div
                    key={m.monthYear}
                    className="bg-white/60 border border-stone-200 rounded-lg px-3 py-2.5 flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-stone-700">
                      {formatMonthYear(m.monthYear)}
                    </span>
                    <span className="text-xs font-bold text-stone-500">
                      {m.deliveredSlots}/{m.totalSlots} đã nhận
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-stone-400 py-3">Chưa có lịch sử</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
