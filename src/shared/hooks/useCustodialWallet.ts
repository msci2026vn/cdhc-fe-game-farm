import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { toast } from 'sonner';

export interface CustodialWallet {
  address: string;
  balance: string;
  balanceWei: string;
  chainId: number;
  isActive: boolean;
}

export function useCustodialWallet() {
  const queryClient = useQueryClient();

  // ─── Query: Custodial Wallet status ───
  const {
    data: wallet,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['custodial-wallet'],
    queryFn: async (): Promise<CustodialWallet | null> => {
      try {
        const data = await gameApi.getCustodialWalletStatus();
        return data || null;
      } catch (err: any) {
        if (err?.status === 404) return null;
        throw err;
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  // ─── Mutation: Create wallet ───
  const createMutation = useMutation({
    mutationFn: () => gameApi.createCustodialWallet(),
    onSuccess: (data) => {
      toast.success(`Tạo ví thành công! ${data.address.slice(0, 6)}...${data.address.slice(-4)}`);
      queryClient.invalidateQueries({ queryKey: ['custodial-wallet'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể tạo ví');
    },
  });

  // ─── Mutation: Send transaction ───
  const sendMutation = useMutation({
    mutationFn: ({ to, amount }: { to: string; amount: string }) =>
      gameApi.sendCustodialTransaction(to, amount),
    onSuccess: (data) => {
      toast.success(`Đã gửi ${data.amount} AVAX`);
      queryClient.invalidateQueries({ queryKey: ['custodial-wallet'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gửi thất bại');
    },
  });

  // ─── Mutation: Export private key ───
  const exportMutation = useMutation({
    mutationFn: () => gameApi.exportCustodialKey(),
  });

  return {
    wallet,
    isLoading,
    isError,
    error,
    hasWallet: !!wallet?.address,
    refetch,
    createWallet: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    sendTransaction: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    sendError: sendMutation.error,
    exportKey: exportMutation.mutateAsync,
    isExporting: exportMutation.isPending,
  };
}
