import { useNav } from '@/shared/hooks/useNav';
import { playSound } from '@/shared/audio';

interface CampaignHeaderProps {
  title: string;
  stars: number;
  maxStars: number;
  backTo?: string;
}

export default function CampaignHeader({ title, stars, maxStars, backTo = '/farm' }: CampaignHeaderProps) {
  const navigate = useNav();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 safe-top">
      <div className="max-w-[430px] mx-auto pt-1 pb-2">
        <div
          className="relative px-4 py-6 flex items-center justify-between"
          style={{
            backgroundImage: "url('/assets/map/campaign_region_1/wooden_frame_title.png')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Back button */}
          <button
            onClick={() => { playSound('ui_back'); navigate(backTo); }}
            className="w-14 h-14 ml-7 flex items-center justify-center active:scale-90 transition-transform"
          >
            <img
              src="/assets/map/campaign_region_1/leaf_button_back.png"
              alt="back"
              className="w-14 h-14 object-contain"
            />
          </button>

          {/* Title */}
          <h1 className="font-game text-[#3E1E0F] text-xl tracking-tight text-center flex-1 mx-2 truncate drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]">
            {title}
          </h1>

          {/* Star counter */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20 flex items-center gap-1.5 flex-shrink-0 mr-7">
            <img src="/assets/map/campaign_region_1/flower_icon.png" alt="flower" className="w-5 h-5 object-contain" />
            <span className="text-white font-game font-bold text-sm">{stars}/{maxStars}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
