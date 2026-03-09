import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';
import { useUIStore } from '../stores/uiStore';

export function useShopBuy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity?: number }) =>
      gameApi.buyItem(itemId, quantity),

    retry: false, // Không retry — tránh mua 2 lần

    // Optimistic update
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['game', 'shop', 'items'] });
      const prev = queryClient.getQueryData(['game', 'shop', 'items']);
      // Optimistic: tăng owned +1 ngay
      queryClient.setQueryData(['game', 'shop', 'items'], (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item: any) =>
            item.id === variables.itemId
              ? { ...item, owned: item.owned + (variables.quantity || 1) }
              : item
          ),
        };
      });
      return { prev };
    },

    onSuccess: (data) => {
      console.log('[FARM-DEBUG] useShopBuy.onSuccess:', data);

      // Toast notification
      useUIStore.getState().addToast(
        `Đã mua ${data.item?.name || 'vật phẩm'}! -${data.ognSpent || 0} OGN`,
        'success',
        '🛒'
      );

      // Optimistic: update OGN immediately for realtime UI
      if (data.ognRemaining !== undefined) {
        queryClient.setQueryData(PLAYER_PROFILE_KEY, (old: any) => ({
          ...old,
          ogn: data.ognRemaining,
        }));
      }

      // Invalidate queries for server truth
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });
      // Refetch shop items (server truth)
      queryClient.invalidateQueries({ queryKey: ['game', 'shop', 'items'] });
    },

    onError: (error, variables, context) => {
      console.error('[FARM-DEBUG] useShopBuy.onError:', error.message);

      // Toast notification
      const msg = error.message?.includes('OGN') ? 'Không đủ OGN!'
                  : error.message?.includes('STOCK') ? 'Hết hàng!'
                  : 'Không thể mua.';
      useUIStore.getState().addToast(msg, 'error');

      // Rollback optimistic
      if (context?.prev) {
        queryClient.setQueryData(['game', 'shop', 'items'], context.prev);
      }
    },
  });
}
