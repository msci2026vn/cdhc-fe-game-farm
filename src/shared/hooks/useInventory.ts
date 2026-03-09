/**
 * useInventory — TanStack Query hook for fetching inventory
 *
 * FARMVERSE Inventory Feature
 *
 * Fetches harvested crops in player's inventory
 */
import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import type { InventoryResponse } from '../types/game-api.types';

export function useInventory() {
  return useQuery<InventoryResponse>({
    queryKey: ['game', 'inventory'],
    queryFn: () => gameApi.getInventory(),
    staleTime: 30_000,      // 30s — kho đồ không cần realtime
    refetchInterval: 60_000, // 1 phút refetch 1 lần — check hết hạn
  });
}
