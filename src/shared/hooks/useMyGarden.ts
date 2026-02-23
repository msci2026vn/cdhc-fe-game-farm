import { useQuery } from '@tanstack/react-query';
import { getMyGarden, getGardenSummary, getDeliveryHistory } from '../api/game-api';

/** Lấy garden data — chỉ gọi khi user là VIP */
export function useMyGarden(enabled = true) {
  return useQuery({
    queryKey: ['rwa', 'my-garden'],
    queryFn: () => getMyGarden(),
    enabled,
    staleTime: 60 * 1000,
    retry: (count, error) => {
      if (error?.message === 'VIP_REQUIRED') return false;
      return count < 2;
    },
  });
}

/** Summary — gọi cho mọi user (badge/widget) */
export function useGardenSummary() {
  return useQuery({
    queryKey: ['rwa', 'garden-summary'],
    queryFn: () => getGardenSummary(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Delivery history — chỉ VIP */
export function useDeliveryHistory(enabled = true) {
  return useQuery({
    queryKey: ['rwa', 'delivery-history'],
    queryFn: () => getDeliveryHistory(),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: (count, error) => {
      if (error?.message === 'VIP_REQUIRED') return false;
      return count < 2;
    },
  });
}
