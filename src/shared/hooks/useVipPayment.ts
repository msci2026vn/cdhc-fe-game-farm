import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gameApi, getVipPlans } from '../api/game-api';

export function useVipPlans() {
  return useQuery({
    queryKey: ['vip', 'plans'],
    queryFn: getVipPlans,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateVipOrder() {
  return useMutation({
    mutationFn: (planId: string) => gameApi.createVipOrder(planId),
  });
}

export function useVerifyVipPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, txHash }: { orderId: string; txHash: string }) =>
      gameApi.verifyVipPayment(orderId, txHash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip'] });
    },
  });
}

export function useVipOrders() {
  return useQuery({
    queryKey: ['vip', 'orders'],
    queryFn: () => gameApi.getVipOrders(),
    staleTime: 60 * 1000,
  });
}
