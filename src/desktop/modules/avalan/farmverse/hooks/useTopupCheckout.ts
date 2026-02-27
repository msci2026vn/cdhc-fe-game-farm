import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL, handleApiError } from '@/shared/api/api-utils';
import { toast } from 'sonner';
import type { CheckoutResponse, PaymentMethod } from '../types/payment.types';

interface CheckoutParams {
  packageId: string;
  paymentMethod?: PaymentMethod;
}

export function useTopupCheckout() {
  return useMutation({
    mutationFn: async ({ packageId, paymentMethod = 'paypal' }: CheckoutParams) => {
      const res = await fetch(`${API_BASE_URL}/api/topup/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ packageId, paymentMethod }),
      });

      if (!res.ok) await handleApiError(res);

      const json: CheckoutResponse = await res.json();
      if (!json.success) throw new Error('Checkout failed');
      return json.data;
    },
    onSuccess: (data) => {
      toast.info('Dang chuyen den trang thanh toan...');
      window.location.href = data.sessionUrl;
    },
    onError: (error: Error) => {
      if (error.message === 'Session expired') return;
      toast.error(`Loi: ${error.message}`);
    },
  });
}
