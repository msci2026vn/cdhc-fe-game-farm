import { useQuery } from '@tanstack/react-query';
import { getVipStatus, getVipPlans } from '../api/game-api';
import type { VipStatus, VipPlan } from '../types/game-api.types';

export function useVipStatus() {
    const statusQuery = useQuery<VipStatus>({
        queryKey: ['vip', 'status'],
        queryFn: getVipStatus,
        staleTime: 5 * 60 * 1000,      // 5 phút — VIP status ít thay đổi
        retry: 1,
    });

    const plansQuery = useQuery<VipPlan[]>({
        queryKey: ['vip', 'plans'],
        queryFn: getVipPlans,
        staleTime: 30 * 60 * 1000,     // 30 phút — plans gần như static
        retry: 1,
    });

    return {
        // Status
        vipStatus: statusQuery.data,
        isVip: statusQuery.data?.isVip ?? false,
        tier: statusQuery.data?.tier ?? 'free',
        ognMultiplier: statusQuery.data?.ognMultiplier ?? 1,
        daysRemaining: statusQuery.data?.daysRemaining ?? 0,

        // Plans
        plans: plansQuery.data ?? [],

        // Loading states
        isLoading: statusQuery.isLoading,
        isError: statusQuery.isError,
        error: statusQuery.error,

        // Refetch
        refetchStatus: statusQuery.refetch,
    };
}
