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

export interface SecurityStatus {
  hasPin: boolean;
  pinSetAt: string | null;
  hasPasskey: boolean;
  passkeyCount: number;
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

  // ─── Query: Security status ───
  const {
    data: securityStatus,
    refetch: refetchSecurity,
  } = useQuery({
    queryKey: ['custodial-wallet-security'],
    queryFn: async (): Promise<SecurityStatus> => {
      try {
        return await gameApi.getSecurityStatus();
      } catch {
        return { hasPin: false, pinSetAt: null, hasPasskey: false, passkeyCount: 0 };
      }
    },
    staleTime: 60_000,
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

  // ─── Mutation: Send transaction (+ pin) ───
  const sendMutation = useMutation({
    mutationFn: ({ to, amount, pin }: { to: string; amount: string; pin?: string }) =>
      gameApi.sendCustodialTransaction(to, amount, pin),
    onSuccess: (data) => {
      toast.success(`Đã gửi ${data.amount} AVAX`);
      queryClient.invalidateQueries({ queryKey: ['custodial-wallet'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gửi thất bại');
    },
  });

  // ─── Mutation: Export private key (+ pin) ───
  const exportMutation = useMutation({
    mutationFn: (args?: { pin?: string }) => gameApi.exportCustodialKey(args?.pin),
  });

  // ─── Mutation: Set PIN ───
  const setPinMutation = useMutation({
    mutationFn: (pin: string) => gameApi.setWalletPin(pin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodial-wallet-security'] });
    },
  });

  // ─── Mutation: Change PIN ───
  const changePinMutation = useMutation({
    mutationFn: ({ oldPin, newPin }: { oldPin: string; newPin: string }) =>
      gameApi.changeWalletPin(oldPin, newPin),
  });

  // ─── Mutation: Reset PIN ───
  const resetPinMutation = useMutation({
    mutationFn: () => gameApi.resetWalletPin(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodial-wallet-security'] });
    },
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
    // Security
    securityStatus,
    refetchSecurity,
    setPin: setPinMutation.mutateAsync,
    isSettingPin: setPinMutation.isPending,
    changePin: changePinMutation.mutateAsync,
    resetPin: resetPinMutation.mutateAsync,
  };
}
