import { useState, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { createSiweMessage } from 'viem/siwe';
import { API_BASE_URL } from '@/shared/utils/constants';
import { queryClient } from '@/shared/lib/queryClient';
import { PLAYER_PROFILE_KEY } from '@/shared/hooks/usePlayerProfile';
import { gameApi, resetRedirectLock } from '@/shared/api/game-api';

const SIWE_DOMAIN = 'cdhc.vn';
const SIWE_URI = API_BASE_URL;
const CHAIN_ID = 43114; // Avalanche C-Chain mainnet

interface WalletAuthState {
  isConnecting: boolean;
  isSigning: boolean;
  isVerifying: boolean;
  error: string | null;
}

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [state, setState] = useState<WalletAuthState>({
    isConnecting: false,
    isSigning: false,
    isVerifying: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const connectWallet = useCallback(
    async (connectorType?: 'metamask' | 'walletconnect') => {
      setState((s) => ({ ...s, isConnecting: true, error: null }));
      try {
        let connector;
        if (connectorType === 'walletconnect') {
          connector = connectors.find((c) => c.id === 'walletConnect');
        } else {
          connector = connectors.find((c) => c.id === 'injected');
        }

        if (!connector) {
          throw new Error(
            connectorType === 'walletconnect'
              ? 'WalletConnect không khả dụng'
              : 'Không tìm thấy ví. Hãy cài MetaMask hoặc Core Wallet.',
          );
        }

        const result = await connectAsync({ connector });
        return result.accounts[0];
      } finally {
        setState((s) => ({ ...s, isConnecting: false }));
      }
    },
    [connectAsync, connectors],
  );

  const fetchNonce = useCallback(async (walletAddress: string) => {
    const res = await fetch(
      `${API_BASE_URL}/api/auth/wallet/nonce?address=${walletAddress}`,
      { credentials: 'include' },
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Không lấy được nonce');
    return data.data as { nonce: string; issuedAt: string; expiresAt: string };
  }, []);

  const signSiweMessage = useCallback(
    async (walletAddress: string, nonce: string) => {
      setState((s) => ({ ...s, isSigning: true }));
      try {
        const message = createSiweMessage({
          domain: SIWE_DOMAIN,
          address: walletAddress as `0x${string}`,
          statement: 'Đăng nhập FARMVERSE - Con Đường Hữu Cơ',
          uri: SIWE_URI,
          version: '1',
          chainId: CHAIN_ID,
          nonce,
          issuedAt: new Date(),
          expirationTime: new Date(Date.now() + 5 * 60 * 1000),
        });

        const signature = await signMessageAsync({ message });
        return { message, signature };
      } finally {
        setState((s) => ({ ...s, isSigning: false }));
      }
    },
    [signMessageAsync],
  );

  const verifySignature = useCallback(
    async (message: string, signature: string) => {
      setState((s) => ({ ...s, isVerifying: true }));
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/wallet/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message, signature }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message || 'Xác thực thất bại');
        return data;
      } finally {
        setState((s) => ({ ...s, isVerifying: false }));
      }
    },
    [],
  );

  const loginWithWallet = useCallback(
    async (connectorType?: 'metamask' | 'walletconnect') => {
      try {
        setState({ isConnecting: false, isSigning: false, isVerifying: false, error: null });

        // 1. Connect wallet
        let walletAddress = address;
        if (!isConnected || !walletAddress) {
          walletAddress = await connectWallet(connectorType);
        }
        if (!walletAddress) throw new Error('Không kết nối được ví');

        // 2. Get nonce
        const { nonce } = await fetchNonce(walletAddress);

        // 3. Sign SIWE message
        const { message, signature } = await signSiweMessage(walletAddress, nonce);

        // 4. Verify with backend
        const result = await verifySignature(message, signature);

        // 5. Update auth state — same pattern as Google login in LoginScreen
        resetRedirectLock();

        try {
          await queryClient.prefetchQuery({
            queryKey: PLAYER_PROFILE_KEY,
            queryFn: () => gameApi.getProfile(),
          });
        } catch {
          // Non-blocking
        }

        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Đăng nhập thất bại';
        setState((s) => ({ ...s, error: msg }));

        if (msg.includes('User rejected') || msg.includes('denied')) {
          wagmiDisconnect();
        }
        throw error;
      }
    },
    [address, isConnected, connectWallet, fetchNonce, signSiweMessage, verifySignature, wagmiDisconnect],
  );

  const linkWallet = useCallback(async () => {
    try {
      setState({ isConnecting: false, isSigning: false, isVerifying: false, error: null });

      // 1. Connect wallet
      let walletAddress = address;
      if (!isConnected || !walletAddress) {
        walletAddress = await connectWallet();
      }
      if (!walletAddress) throw new Error('Không kết nối được ví');

      // 2. Get nonce
      const { nonce } = await fetchNonce(walletAddress);

      // 3. Sign SIWE message
      const { message, signature } = await signSiweMessage(walletAddress, nonce);

      // 4. Link via backend (authenticated — cookie JWT auto-sent)
      setState((s) => ({ ...s, isVerifying: true }));
      const res = await fetch(`${API_BASE_URL}/api/auth/wallet/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message, signature }),
      });
      const data = await res.json();
      setState((s) => ({ ...s, isVerifying: false }));

      if (!data.success) throw new Error(data.error?.message || 'Liên kết thất bại');

      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Liên kết thất bại';
      setState((s) => ({ ...s, error: msg, isVerifying: false }));
      if (msg.includes('User rejected') || msg.includes('denied')) {
        wagmiDisconnect();
      }
      throw error;
    }
  }, [address, isConnected, connectWallet, fetchNonce, signSiweMessage, wagmiDisconnect]);

  return {
    state,
    isLoading: state.isConnecting || state.isSigning || state.isVerifying,
    address,
    isConnected,
    loginWithWallet,
    linkWallet,
    disconnect: wagmiDisconnect,
    clearError,
  };
}
