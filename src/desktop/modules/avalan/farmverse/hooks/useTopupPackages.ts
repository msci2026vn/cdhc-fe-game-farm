import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, handleApiError } from '@/shared/api/api-utils';
import type { TopupPackagesResponse } from '../types/payment.types';

export function useTopupPackages() {
  return useQuery<TopupPackagesResponse['data']>({
    queryKey: ['topup', 'packages'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/topup/packages`, {
        credentials: 'include',
      });
      if (!res.ok) await handleApiError(res);
      const json: TopupPackagesResponse = await res.json();
      if (!json.success) throw new Error('API error');
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
