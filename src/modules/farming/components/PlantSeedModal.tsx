import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlantType } from '../types/farm.types';
import { PLANT_TYPES } from '../stores/farmStore';
import { formatGrowthTime } from '@/shared/utils/format';
import { playSound } from '@/shared/audio';

interface PlantSeedModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (plantType: PlantType) => void;
}

export default function PlantSeedModal({ open, onClose, onSelect }: PlantSeedModalProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => { playSound('ui_modal_close'); onClose(); }} />

      {/* Modal */}
      <div className="relative bg-card rounded-t-3xl w-full max-w-[430px] p-5 pb-8 animate-slide-up shadow-xl">
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
        <h3 className="font-heading font-bold text-lg text-center mb-4">🌱 {t('farming.seed_modal.title')}</h3>

        <div className="grid grid-cols-2 gap-3">
          {PLANT_TYPES.map((pt) => (
            <button
              key={pt.id}
              onClick={() => { playSound('ui_click'); setSelected(pt.id); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95 ${selected === pt.id
                  ? 'border-primary bg-primary-pale shadow-md'
                  : 'border-border bg-card hover:bg-muted'
                }`}
            >
              <span className="text-3xl">{pt.emoji}</span>
              <span className="font-heading font-semibold text-sm">{pt.name}</span>
              <span className="text-[10px] text-muted-foreground">
                ⏱️ {formatGrowthTime(pt.growthDurationMs)}
              </span>
              <span className="text-xs font-bold text-secondary-foreground">
                🪙 {pt.rewardOGN} OGN
              </span>
            </button>
          ))}
        </div>

        <button
          disabled={!selected}
          onClick={() => {
            const pt = PLANT_TYPES.find((p) => p.id === selected);
            if (pt) { playSound('plant_seed'); onSelect(pt); }
          }}
          className={`w-full mt-4 py-3.5 rounded-2xl font-heading font-bold text-base transition-all ${selected
              ? 'bg-primary text-primary-foreground active:scale-95 shadow-lg green-glow'
              : 'bg-muted text-muted-foreground'
            }`}
        >
          {selected ? t('farming.seed_modal.plant_now') : t('farming.seed_modal.select_one')}
        </button>
      </div>
    </div>
  );
}
