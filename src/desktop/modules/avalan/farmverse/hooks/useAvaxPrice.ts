import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, handleApiError } from '@/shared/api/api-utils';
import type { AvaxPriceResponse } from '../types/payment.types';

export function useAvaxPrice() {
  return useQuery<AvaxPriceResponse['data']>({
    queryKey: ['topup', 'price'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/topup/price`, {
        credentials: 'include',
      });
      if (!res.ok) await handleApiError(res);
      const json: AvaxPriceResponse = await res.json();
      if (!json.success) throw new Error('API error');
      return json.data;
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
