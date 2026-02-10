import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';

export function useShopItems() {
  return useQuery({
    queryKey: ['game', 'shop', 'items'],
    queryFn: () => gameApi.getShopItems(),
    staleTime: 30_000, // 30s — refresh khi user quay lại shop
  });
}
