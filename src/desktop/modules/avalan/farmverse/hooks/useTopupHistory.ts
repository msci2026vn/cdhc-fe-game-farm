import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, handleApiError } from '@/shared/api/api-utils';
import type { TopupHistoryResponse, TopupOrder } from '../types/payment.types';

export function useTopupHistory() {
  return useQuery<TopupOrder[]>({
    queryKey: ['topup', 'history'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/topup/history`, {
        credentials: 'include',
      });
      if (!res.ok) await handleApiError(res);
      const json: TopupHistoryResponse = await res.json();
      if (!json.success) throw new Error('API error');
      return json.data;
    },
    staleTime: 30 * 1000,
  });
}
