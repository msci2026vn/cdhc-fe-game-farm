// ═══════════════════════════════════════════════════════════════
// useAutoPlayRent — rent auto-play level with OGN (7 days)
// ═══════════════════════════════════════════════════════════════

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { autoPlayApi } from '../api/api-autoplay';
import { AUTO_PLAY_STATUS_KEY } from './useAutoPlayLevel';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';

const LEVEL_NAMES: Record<number, string> = {
  2: 'Lv.2 Thông minh',
  3: 'Lv.3 Nâng cao',
  4: 'Lv.4 Chuyên gia',
  5: 'Lv.5 Tối thượng',
};

export function useAutoPlayRent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (level: number) => autoPlayApi.rent(level),
    onSuccess: (_data, level) => {
      queryClient.invalidateQueries({ queryKey: AUTO_PLAY_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY }); // OGN balance changed
      toast.success(`Đã thuê ${LEVEL_NAMES[level] ?? `Lv.${level}`} — 7 ngày`);
    },
    onError: (err: any) => {
      const msg = err?.message || err?.data?.error || 'Lỗi không xác định';
      if (msg.includes('INSUFFICIENT_OGN') || msg.toLowerCase().includes('insufficient')) {
        toast.error('Không đủ OGN để thuê');
      } else {
        toast.error(`Thuê thất bại: ${msg}`);
      }
    },
  });
}
