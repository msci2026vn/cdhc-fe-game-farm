import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function LockedGardenView() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-b from-gray-100 via-stone-50 to-stone-100 h-[100dvh] overflow-y-auto overflow-x-hidden text-stone-800 font-body select-none" style={{ scrollbarWidth: 'none' }}>
      <div className="max-w-[430px] mx-auto min-h-[100dvh] relative flex flex-col pb-4">

        {/* Header */}
        <div className="relative z-10 px-4 pt-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/80 border border-stone-200 flex items-center justify-center shadow-sm"
          >
            <span className="material-symbols-outlined text-stone-600 text-lg">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-stone-500 flex items-center gap-1.5">
            <span>🔒</span> {t('rwa.locked_garden.title')}
          </h1>
        </div>

        {/* Locked content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
          <div className="text-5xl mb-4 flex gap-1">
            🌿🌱🥬🥕🍅
          </div>

          <h2 className="text-lg font-bold text-stone-700 text-center">
            {t('rwa.locked_garden.upgrade_msg')}
          </h2>
          <p className="text-sm text-stone-500 text-center mt-1 max-w-[280px]">
            {t('rwa.locked_garden.desc')}
          </p>

          {/* VIP tiers */}
          <div className="mt-6 w-full max-w-[300px] space-y-3">
            <div className="bg-white/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-lg">⭐</span>
              <div>
                <p className="text-sm font-bold text-amber-700">Standard</p>
                <p className="text-xs text-stone-500">{t('rwa.locked_garden.times_per_month', { count: 4 })} &middot; 0.01 AVAX</p>
              </div>
            </div>
            <div className="bg-white/80 border border-purple-200 rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-lg">👑</span>
              <div>
                <p className="text-sm font-bold text-purple-700">Premium</p>
                <p className="text-xs text-stone-500">{t('rwa.locked_garden.times_per_month', { count: 8 })} &middot; 0.02 AVAX</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/vip/purchase')}
            className="mt-6 w-full max-w-[300px] py-3 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">shopping_cart</span>
            {t('rwa.locked_garden.upgrade_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
