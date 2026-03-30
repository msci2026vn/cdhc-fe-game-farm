/**
 * PlantPickerModal — Chọn loại cây để trồng
 *
 * FARMVERSE Step 13
 *
 * Hiển thị list plant types từ hardcoded data
 * (Sau này có thể lấy từ API GET /shop/items)
 */
import { X } from 'lucide-react';
import { playSound } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

// Plant types data — match BE seed data
// TODO Step 21: Lấy từ API thay vì hardcode
import { PLANT_TYPES } from '../data/plants';

// ...
import { useShopItems } from '@/shared/hooks/useShopItems';

interface PlantPickerModalProps {
  onSelect: (plantTypeId: string) => void;
  onClose: () => void;
  isPlanting: boolean;
}

export default function PlantPickerModal({ onSelect, onClose, isPlanting }: PlantPickerModalProps) {
  const { t } = useTranslation();
  const { data: shopData } = useShopItems();
  const shopItems = shopData?.items || [];

  // Create price map from shop items (category = 'seed')
  const priceMap = new Map<string, number>();
  shopItems.forEach((item) => {
    if (item.category === 'seed') {
      priceMap.set(item.id, item.price);
    }
  });

  console.log('[FARM-DEBUG] PlantPickerModal — RENDER, isPlanting:', isPlanting);

  const handleSelect = (plantTypeId: string) => {
    console.log('[FARM-DEBUG] PlantPickerModal — SELECTED:', plantTypeId);
    playSound('ui_click');
    onSelect(plantTypeId);
  };

  const handleClose = () => {
    console.log('[FARM-DEBUG] PlantPickerModal — CLOSED');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="farm-picker-modal animate-fade-in scale-up">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-4">
          <h3 className="text-lg font-bold text-white translate-y-3">{t('farming.seed_modal.title')}</h3>
          <button
            onClick={handleClose}
            className="absolute right-0 p-1 rounded-full hover:bg-white/10"
            disabled={isPlanting}
          >
            <X className="size-5 text-white/50" />
          </button>
        </div>

        {/* Plant list */}
        <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
          {PLANT_TYPES.map((plant) => {
            // Use dynamic price from shop if available, otherwise fallback to hardcoded
            const dynamicPrice = priceMap.get(plant.id);
            const displayPrice = dynamicPrice !== undefined ? dynamicPrice : plant.price;

            return (
              <button
                key={plant.id}
                onClick={() => handleSelect(plant.id)}
                disabled={isPlanting}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl
                          bg-white/5 hover:bg-white/10 border border-white/10
                          hover:border-emerald-500/30 transition-all
                          active:scale-95 disabled:opacity-50"
              >
                <img src={plant.icon} alt={plant.name} className="w-12 h-12 object-contain" />
                <span className="text-xs font-bold text-white mb-1">{plant.name}</span>
                
                {/* Info Pills */}
                <div className="flex flex-col gap-1 w-full items-center">
                  {/* Price Pill */}
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/40 border border-white/5 justify-center">
                    <img src="/assets/farm/icon_org.png" alt="OGN" className="w-3 h-3 object-contain" />
                    <span className="text-[9px] font-bold text-[#FFD54F] whitespace-nowrap">{displayPrice} OGN</span>
                  </div>
                  
                  {/* Time Pill */}
                  <div className="flex items-center gap-1 px-1 py-0.5 rounded-full bg-black/25 border border-white/5 justify-center">
                    <img src="/assets/farm/icon_time.png" alt="Time" className="w-3 h-3 object-contain" />
                    <span className="text-[8px] font-medium text-white/50 whitespace-nowrap">{plant.growthTime}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
// ...

        {/* Loading indicator */}
        {isPlanting && (
          <div className="absolute inset-0 bg-black/40 rounded-t-3xl flex items-center justify-center">
            <div className="text-white text-sm animate-pulse">🌱 {t('farming.seed_modal.planting', 'Đang trồng...')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
