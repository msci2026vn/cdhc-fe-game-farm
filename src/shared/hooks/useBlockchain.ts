import { useQuery } from '@tanstack/react-query';
import { getBlockchainStats, getBlockchainLogs } from '../api/game-api';
import type { BlockchainStats, BlockchainLog } from '../api/game-api';

export function useBlockchainStats() {
  return useQuery<BlockchainStats>({
    queryKey: ['blockchain', 'stats'],
    queryFn: getBlockchainStats,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useBlockchainLogs(limit = 20) {
  return useQuery<BlockchainLog[]>({
    queryKey: ['blockchain', 'logs', limit],
    queryFn: () => getBlockchainLogs(limit),
    staleTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}
