// ═══════════════════════════════════════════════════════════════
// useAutoPlayBuy — buy auto-play level permanently with AVAX
// ═══════════════════════════════════════════════════════════════

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { autoPlayApi } from '../api/api-autoplay';
import { AUTO_PLAY_STATUS_KEY } from './useAutoPlayLevel';

const LEVEL_NAMES: Record<number, string> = {
  2: 'Lv.2 Thông minh',
  3: 'Lv.3 Nâng cao',
  4: 'Lv.4 Chuyên gia',
  5: 'Lv.5 Tối thượng',
};

export function useAutoPlayBuy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ level, txHash }: { level: number; txHash?: string }) =>
      autoPlayApi.buy(level, txHash),
    onSuccess: (_data, { level }) => {
      queryClient.invalidateQueries({ queryKey: AUTO_PLAY_STATUS_KEY });
      toast.success(`Đã mua ${LEVEL_NAMES[level] ?? `Lv.${level}`} — Vĩnh viễn!`);
    },
    onError: (err: any) => {
      const msg = err?.message || '';
      if (msg.includes('ALREADY_PURCHASED') || msg.toLowerCase().includes('already')) {
        toast.error('Đã sở hữu level này rồi');
      } else if (msg.includes('PAYMENT_VERIFICATION') || msg.toLowerCase().includes('verification')) {
        toast.error('Xác minh thanh toán thất bại');
      } else {
        toast.error(`Mua thất bại: ${msg}`);
      }
    },
  });
}
