// ═══════════════════════════════════════════════════════════════
// DeathOverlay — Full-screen defeat overlay + animation
// ═══════════════════════════════════════════════════════════════

interface Props {
  spriteSrc: string | null;
  bossName: string;
  bossEmoji: string;
  onSkip: () => void;
}
import { useTranslation } from 'react-i18next';

export default function DeathOverlay({ spriteSrc, bossName, bossEmoji, onSkip }: Props) {
  const { t } = useTranslation();
  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto relative boss-gradient flex flex-col items-center justify-center overflow-hidden">
      {/* Red vignette */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(139,0,0,0.5) 100%)' }} />
      <div className="absolute inset-0 bg-black/60 animate-fade-in" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="mb-4 animate-bounce drop-shadow-lg">
          {spriteSrc ? (
            <img key={spriteSrc} src={spriteSrc} alt={bossName} className="w-24 h-24 object-contain" draggable={false} />
          ) : (
            <span className="text-7xl">💀</span>
          )}
        </div>
        <h1 className="text-3xl font-heading font-bold text-red-400 mb-2">
          {t('campaign.ui.defeated')}
        </h1>
        <p className="text-gray-400 mb-8 text-sm">
          {t('campaign.ui.defeated_by', { name: `${bossEmoji} ${bossName}` })}
        </p>
        <button
          onClick={onSkip}
          className="px-8 py-3 bg-gray-700 text-white rounded-xl text-lg font-heading font-bold hover:bg-gray-600 transition active:scale-95"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
        >
          {t('campaign.ui.view_results')}
        </button>
      </div>
    </div>
  );
}
