import { useQuery } from '@tanstack/react-query';
import { gameApi } from '@/shared/api/game-api';

export function useCampaignZones() {
  return useQuery({
    queryKey: ['game', 'campaign', 'zones'],
    queryFn: () => gameApi.getCampaignZones(),
    staleTime: 60_000,
    retry: 2,
  });
}
