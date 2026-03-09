import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startRegistration } from '@simplewebauthn/browser';
import { gameApi } from '../api/game-api';
import { toast } from 'sonner';

export function useSmartWallet() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // ─── Query: Smart Wallet status ───
  const {
    data: walletStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['smart-wallet', 'status'],
    queryFn: () => gameApi.getSmartWalletStatus(),
    staleTime: 30_000,
    retry: 1,
  });

  // ─── Query: Passkeys list ───
  const {
    data: passkeys,
    isLoading: isLoadingPasskeys,
  } = useQuery({
    queryKey: ['passkeys', 'list'],
    queryFn: () => gameApi.listPasskeys(),
    staleTime: 60_000,
    retry: 1,
  });

  const hasPasskey = (passkeys?.length ?? 0) > 0;
  const hasWallet = walletStatus?.hasWallet ?? false;

  // ─── Mutation: Register Passkey ───
  const registerPasskeyMutation = useMutation({
    mutationFn: async (friendlyName?: string) => {
      // Step 1: Get challenge from backend
      const options = await gameApi.getPasskeyRegisterOptions();

      // Step 2: Browser WebAuthn API — user quét vân tay
      // v13: startRegistration({ optionsJSON }) format
      const credential = await startRegistration({ optionsJSON: options });

      // Step 3: Send credential to backend
      return gameApi.registerPasskey({
        ...credential,
        friendlyName: friendlyName || 'Smart Wallet Key',
      });
    },
    onSuccess: () => {
      toast.success('Tạo Passkey thành công!');
      queryClient.invalidateQueries({ queryKey: ['passkeys'] });
    },
    onError: (error: any) => {
      if (error.name === 'NotAllowedError') {
        toast.info('Đã hủy tạo Passkey');
        return;
      }
      toast.error(error.message || 'Không thể tạo Passkey');
    },
  });

  // ─── Mutation: Create Smart Wallet ───
  const createWalletMutation = useMutation({
    mutationFn: () => gameApi.createSmartWallet(),
    onSuccess: (data) => {
      toast.success(`Tạo ví thành công! ${data.address.slice(0, 6)}...${data.address.slice(-4)}`);
      queryClient.invalidateQueries({ queryKey: ['smart-wallet'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tạo ví');
    },
  });

  // ─── Combined: Tạo Passkey + Wallet (1 click) ───
  const setupSmartWallet = useCallback(async () => {
    setIsCreating(true);
    try {
      if (!hasPasskey) {
        toast.info('Bước 1/2: Tạo Passkey — Quét vân tay...');
        await registerPasskeyMutation.mutateAsync('Smart Wallet Key');
        await new Promise(r => setTimeout(r, 1000));
      }

      toast.info(hasPasskey ? 'Đang tạo ví...' : 'Bước 2/2: Tạo ví...');
      const wallet = await createWalletMutation.mutateAsync();
      return wallet;
    } catch {
      // Error handled in mutation onError
    } finally {
      setIsCreating(false);
    }
  }, [hasPasskey, registerPasskeyMutation, createWalletMutation]);

  return {
    walletStatus,
    hasPasskey,
    hasWallet,
    isLoading: isLoadingStatus || isLoadingPasskeys,
    isCreating,
    setupSmartWallet,
    refetchStatus,
    isRegisteringPasskey: registerPasskeyMutation.isPending,
    isCreatingWallet: createWalletMutation.isPending,
  };
}
