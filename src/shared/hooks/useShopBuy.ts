import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { useFarmStore } from '@/modules/farming/stores/farmStore';
import { usePlayerStore } from '@/shared/stores/playerStore';

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

      // Update OGN in Zustand stores immediately (realtime)
      if (data.ognRemaining !== undefined) {
        useFarmStore.getState().setOgn(data.ognRemaining);
        usePlayerStore.getState().setOgn(data.ognRemaining);
      }

      // Invalidate queries for server truth
      queryClient.invalidateQueries({ queryKey: ['game', 'profile'] });
      // Refetch shop items (server truth)
      queryClient.invalidateQueries({ queryKey: ['game', 'shop', 'items'] });
    },

    onError: (error, variables, context) => {
      console.error('[FARM-DEBUG] useShopBuy.onError:', error.message);
      // Rollback optimistic
      if (context?.prev) {
        queryClient.setQueryData(['game', 'shop', 'items'], context.prev);
      }
    },
  });
}
