/**
 * useSellInventory — TanStack Query mutation for selling inventory items
 *
 * FARMVERSE Inventory Feature
 *
 * Sells individual items or all items at once
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { useUIStore } from '../stores/uiStore';
import type { SellResult, SellAllResult } from '../types/game-api.types';

export function useSellInventory() {
  const queryClient = useQueryClient();

  return useMutation<SellResult, Error, string>({
    mutationFn: (id: string) => gameApi.sellInventoryItem(id),
    onSuccess: (data) => {
      console.log('[FARM-DEBUG] useSellInventory.onSuccess()', data);

      // Update OGN balance
      queryClient.invalidateQueries({ queryKey: ['game', 'profile'] });
      // Refresh inventory list
      queryClient.invalidateQueries({ queryKey: ['game', 'inventory'] });

      // Toast thông báo
      useUIStore.getState().addToast(
        data.message || `${data.sold.plantEmoji} Bán được ${data.sold.sellPrice} OGN!`,
        'success',
        '💰'
      );
    },
    onError: (error) => {
      console.error('[FARM-DEBUG] useSellInventory.onError()', error);
      const msg = error.message || 'Lỗi khi bán';
      useUIStore.getState().addToast(
        msg.includes('héo') || msg.includes('hết hạn') ? '🥀 Nông sản đã héo, mất trắng!' : msg,
        'error',
        '❌'
      );
      // Refresh inventory — item héo đã bị xóa bên backend
      queryClient.invalidateQueries({ queryKey: ['game', 'inventory'] });
    },
  });
}

export function useSellAllInventory() {
  const queryClient = useQueryClient();

  return useMutation<SellAllResult, Error>({
    mutationFn: () => gameApi.sellAllInventory(),
    onSuccess: (data) => {
      console.log('[FARM-DEBUG] useSellAllInventory.onSuccess()', data);

      queryClient.invalidateQueries({ queryKey: ['game', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['game', 'inventory'] });

      useUIStore.getState().addToast(
        data.message || `Đã bán ${data.soldItems.length} nông sản, thu ${data.totalOgn} OGN!`,
        'success',
        '💰'
      );
    },
    onError: (error) => {
      console.error('[FARM-DEBUG] useSellAllInventory.onError()', error);
      useUIStore.getState().addToast(
        error.message || 'Lỗi khi bán',
        'error',
        '❌'
      );
    },
  });
}
