// ============================================================
// Guild Hooks — TanStack Query wrappers cho /api/guild/*
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guildApi, type Guild } from '../api/api-guild';

export type { Guild };

export const GUILD_KEYS = {
  all: ['guild'] as const,
  list: () => [...GUILD_KEYS.all, 'list'] as const,
  my: () => [...GUILD_KEYS.all, 'my'] as const,
  balance: () => [...GUILD_KEYS.all, 'balance'] as const,
};

export function useGuildList(offset = 0, limit = 20) {
  return useQuery({
    queryKey: GUILD_KEYS.list(),
    queryFn: async () => {
      const res = await guildApi.getList(offset, limit);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useMyGuild() {
  return useQuery({
    queryKey: GUILD_KEYS.my(),
    queryFn: async () => {
      const res = await guildApi.getMy();
      return res.data;
    },
    staleTime: 10_000,
  });
}

export function useSubnetBalance() {
  return useQuery({
    queryKey: GUILD_KEYS.balance(),
    queryFn: async () => {
      const res = await guildApi.getSubnetBalance();
      return res.data;
    },
    refetchInterval: 30_000,
  });
}

export function useCreateGuild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await guildApi.create(name);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GUILD_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: GUILD_KEYS.my() });
      queryClient.invalidateQueries({ queryKey: GUILD_KEYS.balance() });
    },
  });
}

export function useJoinGuild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (guildId: number) => {
      const res = await guildApi.join(guildId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GUILD_KEYS.all });
    },
  });
}

export function useLeaveGuild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await guildApi.leave();
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GUILD_KEYS.all });
    },
  });
}
