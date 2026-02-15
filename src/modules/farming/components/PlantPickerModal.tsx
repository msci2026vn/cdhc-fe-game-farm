/**
 * PlantPickerModal — Chọn loại cây để trồng
 *
 * FARMVERSE Step 13
 *
 * Hiển thị list plant types từ hardcoded data
 * (Sau này có thể lấy từ API GET /shop/items)
 */
import { X } from 'lucide-react';

// Plant types data — match BE seed data
// TODO Step 21: Lấy từ API thay vì hardcode
import { PLANT_TYPES } from '../data/plants';

interface PlantPickerModalProps {
  onSelect: (plantTypeId: string) => void;
  onClose: () => void;
  isPlanting: boolean;
}

export default function PlantPickerModal({ onSelect, onClose, isPlanting }: PlantPickerModalProps) {
  console.log('[FARM-DEBUG] PlantPickerModal — RENDER, isPlanting:', isPlanting);

  const handleSelect = (plantTypeId: string) => {
    console.log('[FARM-DEBUG] PlantPickerModal — SELECTED:', plantTypeId);
    onSelect(plantTypeId);
  };

  const handleClose = () => {
    console.log('[FARM-DEBUG] PlantPickerModal — CLOSED');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-900 rounded-t-3xl p-5 pb-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">🌱 Chọn cây trồng</h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/10"
            disabled={isPlanting}
          >
            <X className="size-5 text-white/50" />
          </button>
        </div>

        {/* Plant list */}
        <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
          {PLANT_TYPES.map((plant) => (
            <button
              key={plant.id}
              onClick={() => handleSelect(plant.id)}
              disabled={isPlanting}
              className="flex flex-col items-center gap-2 p-3 rounded-xl
                         bg-white/5 hover:bg-white/10 border border-white/10
                         hover:border-emerald-500/30 transition-all
                         active:scale-95 disabled:opacity-50"
            >
              <span className="text-3xl">{plant.emoji}</span>
              <span className="text-sm font-medium text-white">{plant.name}</span>
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <span>💰 {plant.price} OGN</span>
              </div>
              <span className="text-[10px] text-white/40">⏱ {plant.growthTime}</span>
            </button>
          ))}
        </div>

        {/* Loading indicator */}
        {isPlanting && (
          <div className="absolute inset-0 bg-black/40 rounded-t-3xl flex items-center justify-center">
            <div className="text-white text-sm animate-pulse">🌱 Đang trồng...</div>
          </div>
        )}
      </div>
    </div>
  );
}
