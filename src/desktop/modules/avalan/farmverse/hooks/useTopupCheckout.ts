import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL, handleApiError } from '@/shared/api/api-utils';
import { toast } from 'sonner';
import type { CheckoutResponse } from '../types/payment.types';

export function useTopupCheckout() {
  return useMutation({
    mutationFn: async (packageId: string) => {
      const res = await fetch(`${API_BASE_URL}/api/topup/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ packageId }),
      });

      if (!res.ok) await handleApiError(res);

      const json: CheckoutResponse = await res.json();
      if (!json.success) throw new Error('Checkout failed');
      return json.data;
    },
    onSuccess: (data) => {
      toast.info('Đang chuyển đến trang thanh toán...');
      window.location.href = data.sessionUrl;
    },
    onError: (error: Error) => {
      if (error.message === 'Session expired') return;
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}
