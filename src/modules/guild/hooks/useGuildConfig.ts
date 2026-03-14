// ============================================================
// useGuildConfig — Lấy guild constants từ API
// KHÔNG hardcode số trong component — mọi số đến từ đây
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { guildApi, type GuildConfig } from '../api/api-guild';

export type { GuildConfig };

export function useGuildConfig() {
  return useQuery({
    queryKey: ['guild', 'config'],
    queryFn: async () => {
      const res = await guildApi.getConfig();
      return res.data;
    },
    staleTime: Infinity,
  });
}
