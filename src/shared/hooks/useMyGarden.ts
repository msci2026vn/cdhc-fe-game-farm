import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClaimSlotRequest, ScanClaimRequest } from '../types/game-api.types';
import {
  getMyGarden, getGardenSummary, getDeliveryHistory,
  claimDeliverySlot, scanClaimDelivery, manualVerifyDelivery,
  getSlotQr, getDeliveryProof,
} from '../api/game-api';
import { useUIStore } from '../stores/uiStore';

/** Lấy garden data — chỉ gọi khi user là VIP */
export function useMyGarden(enabled = true) {
  return useQuery({
    queryKey: ['rwa', 'my-garden'],
    queryFn: () => getMyGarden(),
    enabled,
    staleTime: 60 * 1000,
    retry: (count, error) => {
      if (error?.message === 'VIP_REQUIRED') return false;
      return count < 2;
    },
  });
}

/** Summary — gọi cho mọi user (badge/widget) */
export function useGardenSummary() {
  return useQuery({
    queryKey: ['rwa', 'garden-summary'],
    queryFn: () => getGardenSummary(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Delivery history — chỉ VIP */
export function useDeliveryHistory(enabled = true) {
  return useQuery({
    queryKey: ['rwa', 'delivery-history'],
    queryFn: () => getDeliveryHistory(),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: (count, error) => {
      if (error?.message === 'VIP_REQUIRED') return false;
      return count < 2;
    },
  });
}

// ═══ Phase 6F: Delivery claim + scan + manual verify hooks ═══

/** Claim slot → gửi form nhận quà → nhận OTP */
export function useClaimSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, ...data }: { slotId: string } & ClaimSlotRequest) =>
      claimDeliverySlot(slotId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rwa', 'my-garden'] });
      queryClient.invalidateQueries({ queryKey: ['rwa', 'garden-summary'] });
    },
    onError: (error: Error) => {
      useUIStore.getState().addToast(error.message || 'Không thể nhận hàng', 'error');
    },
  });
}

/** Scan QR → gọi scan-claim API */
export function useScanClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ScanClaimRequest) => scanClaimDelivery(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rwa', 'my-garden'] });
      queryClient.invalidateQueries({ queryKey: ['rwa', 'garden-summary'] });
      useUIStore.getState().addToast('Nhận hàng thành công! +50 XP', 'success', '✅', 4000);
    },
    onError: (error: Error) => {
      useUIStore.getState().addToast(error.message || 'Xác nhận thất bại', 'error');
    },
  });
}

/** Manual verify → user tự nhập mã 6 số */
export function useManualVerify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, otpCode }: { slotId: string; otpCode: string }) =>
      manualVerifyDelivery(slotId, otpCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rwa', 'my-garden'] });
      queryClient.invalidateQueries({ queryKey: ['rwa', 'garden-summary'] });
      useUIStore.getState().addToast('Nhận hàng thành công! +50 XP', 'success', '✅', 4000);
    },
    onError: (error: Error) => {
      useUIStore.getState().addToast(error.message || 'Xác nhận thất bại', 'error');
    },
  });
}

/** Get slot QR + OTP (xem lại) */
export function useSlotQr(slotId: string | null) {
  return useQuery({
    queryKey: ['rwa', 'slot-qr', slotId],
    queryFn: () => getSlotQr(slotId!),
    enabled: !!slotId,
    staleTime: 30 * 1000,
  });
}

/** Blockchain proof */
export function useDeliveryProof(slotId: string | null) {
  return useQuery({
    queryKey: ['rwa', 'delivery-proof', slotId],
    queryFn: () => getDeliveryProof(slotId!),
    enabled: !!slotId,
    staleTime: 60 * 1000,
  });
}
