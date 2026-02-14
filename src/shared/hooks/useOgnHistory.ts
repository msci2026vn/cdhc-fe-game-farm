import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import type { OgnTransaction } from '../types/game-api.types';

export function useOgnHistory(limit = 50, offset = 0) {
  return useQuery<OgnTransaction[]>({
    queryKey: ['game', 'ognHistory', limit, offset],
    queryFn: async () => {
      const result = await gameApi.getOgnHistory(limit, offset);
      return result.transactions;
    },
    staleTime: 30_000, // 30 seconds
  });
}
