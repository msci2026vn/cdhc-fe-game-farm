import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL, handleApiError } from '@/shared/api/api-utils';

export function usePayPalCapture() {
  return useMutation({
    mutationFn: async (paypalOrderId: string) => {
      const res = await fetch(`${API_BASE_URL}/api/topup/paypal/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paypalOrderId }),
      });

      if (!res.ok) await handleApiError(res);

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Capture failed');
      return json.data as { orderId: string; avaxAmount: string; status: string };
    },
  });
}
