import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';

export const AUTH_STATUS_KEY = ['auth', 'status'] as const;

export function useAuth() {
    return useQuery({
        queryKey: AUTH_STATUS_KEY,
        queryFn: () => gameApi.getAuthStatus(),
        staleTime: 5 * 60 * 1000, // 5 mins
    });
}
