import { useQuery } from '@tanstack/react-query';
import { worldBossApi } from '@/shared/api/api-world-boss';
import type {
  WorldBossMyRewards,
  WorldBossHistoryResponse,
  WorldBossHistoryLeaderboard,
} from '../types/world-boss.types';

export function useWorldBossRewards(eventId: string | null) {
  return useQuery<WorldBossMyRewards>({
    queryKey: ['world-boss', 'my-rewards', eventId],
    queryFn: () => worldBossApi.getMyRewards(eventId!),
    enabled: !!eventId,
    staleTime: 60_000,
    retry: 2,
  });
}

export function useWorldBossHistory(limit = 10) {
  return useQuery<WorldBossHistoryResponse>({
    queryKey: ['world-boss', 'history', limit],
    queryFn: () => worldBossApi.getHistory(limit),
    staleTime: 30_000,
  });
}

export function useWorldBossHistoryLeaderboard(eventId: string | null) {
  return useQuery<WorldBossHistoryLeaderboard>({
    queryKey: ['world-boss', 'leaderboard', eventId],
    queryFn: () => worldBossApi.getHistoryLeaderboard(eventId!),
    enabled: !!eventId,
    staleTime: 60_000,
  });
}
