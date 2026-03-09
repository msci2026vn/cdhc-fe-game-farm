import { useGardenSummary, useMyGarden, useDeliveryHistory } from '@/shared/hooks/useMyGarden';
import MyGardenView from '../components/MyGardenView';
import LockedGardenView from '../components/LockedGardenView';
import { useTranslation } from 'react-i18next';

export default function MyGardenScreen() {
  const { t } = useTranslation();
  const { data: summary, isLoading: loadingSummary } = useGardenSummary();
  const isVip = summary?.isVip ?? false;

  const { data: garden, isLoading: loadingGarden } = useMyGarden(isVip);
  const { data: history, isLoading: loadingHistory } = useDeliveryHistory(isVip);

  // Loading spinner
  if (loadingSummary || (isVip && loadingGarden)) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-green-50 to-[#fefae0]">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isVip) return <LockedGardenView />;

  if (!garden) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-[#fefae0] gap-3">
        <span className="text-3xl">😿</span>
        <p className="text-sm text-stone-500">{t('rwa.my_garden.error_load')}</p>
      </div>
    );
  }

  return (
    <MyGardenView
      garden={garden}
      history={history}
      isLoadingHistory={loadingHistory}
    />
  );
}
