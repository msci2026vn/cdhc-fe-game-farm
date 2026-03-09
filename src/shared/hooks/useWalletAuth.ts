import { useState, useCallback, useMemo } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { createSiweMessage } from 'viem/siwe';
import { API_BASE_URL } from '@/shared/utils/constants';
import { queryClient } from '@/shared/lib/queryClient';
import { PLAYER_PROFILE_KEY } from '@/shared/hooks/usePlayerProfile';
import { gameApi, resetRedirectLock } from '@/shared/api/game-api';
import { walletDebug } from '@/shared/utils/wallet-debug';
import { WALLETCONNECT_PROJECT_ID } from '@/shared/config/wagmi';

const SIWE_DOMAIN = 'cdhc.vn';
const SIWE_URI = API_BASE_URL;
const CHAIN_ID = 43114; // Avalanche C-Chain mainnet

interface WalletAuthState {
  isConnecting: boolean;
  isSigning: boolean;
  isVerifying: boolean;
  error: string | null;
}

export type WalletId = 'metamask' | 'core' | 'walletconnect';

export interface DetectedWallet {
  id: WalletId;
  name: string;
  icon: string;
  installed: boolean;
  downloadUrl: string;
  isDeepLink?: boolean;
}

function detectWallets(): DetectedWallet[] {
  const eth = typeof window !== 'undefined' ? (window as any).ethereum : null;

  let hasMetaMask = false;
  let hasCoreWallet = false;

  if (eth) {
    hasMetaMask = !!eth.isMetaMask;
    hasCoreWallet = !!eth.isAvalanche || !!eth.isCoreWallet;

    // EIP-6963: Multiple injected providers
    if (Array.isArray(eth.providers)) {
      for (const p of eth.providers) {
        if (p.isMetaMask) hasMetaMask = true;
        if (p.isAvalanche || p.isCoreWallet) hasCoreWallet = true;
      }
    }
  }

  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isMetaMaskDeepLink = isMobile && !hasMetaMask && typeof window !== 'undefined';
  const metamaskUrl = isMetaMaskDeepLink
    ? `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
    : 'https://metamask.io/download/';

  const wallets: DetectedWallet[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      installed: hasMetaMask,
      downloadUrl: metamaskUrl,
      isDeepLink: isMetaMaskDeepLink,
    },
    {
      id: 'core',
      name: 'Core Wallet',
      icon: '🔺',
      installed: hasCoreWallet,
      downloadUrl: 'https://core.app/download/',
    },
  ];

  // Only show WalletConnect if project ID is configured
  if (WALLETCONNECT_PROJECT_ID) {
    wallets.push({
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      installed: true, // always available (QR scan)
      downloadUrl: '',
    });
  }

  return wallets;
}

/** Map raw error → Vietnamese user-friendly message */
function toUserError(raw: string, context: 'login' | 'link'): string {
  const fallback = context === 'login' ? 'Đăng nhập thất bại. Vui lòng thử lại.' : 'Liên kết thất bại. Vui lòng thử lại.';

  if (raw === 'NO_WALLET_EXTENSION' || raw.includes('Provider not found') || raw.includes('No provider'))
    return 'Chưa cài ví. Hãy cài MetaMask hoặc Core Wallet rồi thử lại.';
  if (raw === 'NO_WALLETCONNECT')
    return 'WalletConnect chưa được cấu hình.';
  if (raw.includes('User rejected') || raw.includes('user rejected') || raw.includes('denied'))
    return 'Bạn đã từ chối kết nối. Bấm lại để thử.';
  if (raw.includes('nonce') || raw.includes('Nonce') || raw.includes('expired'))
    return 'Phiên đăng nhập hết hạn. Vui lòng thử lại.';
  if (raw.includes('chain') || raw.includes('Chain') || raw.includes('network'))
    return 'Sai mạng. Hãy chuyển ví sang Avalanche C-Chain.';
  if (raw.includes('SIWE') || raw.includes('Signature') || raw.includes('signature'))
    return 'Xác thực chữ ký thất bại. Vui lòng thử lại.';
  if (raw.includes('already linked') || raw.includes('đã được liên kết') || raw.includes('WALLET_ALREADY_LINKED'))
    return 'Ví này đã được liên kết tài khoản khác.';
  if (raw.includes('already has a wallet') || raw.includes('USER_HAS_WALLET'))
    return 'Tài khoản đã liên kết ví rồi.';

  return fallback;
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

  const detectedWallets = useMemo(() => detectWallets(), []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  // Step 1: Connect wallet
  const connectWallet = useCallback(
    async (walletId: WalletId = 'metamask') => {
      setState((s) => ({ ...s, isConnecting: true, error: null }));

      walletDebug.group('Connect Wallet');
      walletDebug.log('Wallet ID:', walletId);
      walletDebug.log('Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })));
      walletDebug.logEnvironment();

      try {
        // Check wallet installed before connecting (skip for WalletConnect)
        if (walletId !== 'walletconnect') {
          const wallet = detectedWallets.find(w => w.id === walletId);
          walletDebug.log('Detected wallet:', wallet);
          if (!wallet?.installed) {
            walletDebug.warn('Wallet not installed:', walletId);
            throw new Error('NO_WALLET_EXTENSION');
          }
        }

        let connector;
        if (walletId === 'walletconnect') {
          connector = connectors.find((c) => c.id === 'walletConnect');
          if (!connector) throw new Error('NO_WALLETCONNECT');
        } else {
          // Both MetaMask and Core Wallet use injected connector
          connector = connectors.find((c) => c.id === 'injected');
          if (!connector) throw new Error('NO_WALLET_EXTENSION');
        }

        walletDebug.log('Selected connector:', { id: connector.id, name: connector.name });

        const result = await connectAsync({ connector });
        walletDebug.log('Connected:', { address: result.accounts[0], chainId: result.chainId });
        walletDebug.groupEnd();
        return result.accounts[0];
      } catch (error) {
        walletDebug.error('Connect failed:', error instanceof Error ? error.message : error);
        walletDebug.groupEnd();
        throw error;
      } finally {
        setState((s) => ({ ...s, isConnecting: false }));
      }
    },
    [connectAsync, connectors, detectedWallets],
  );

  // Step 2: Get nonce
  const fetchNonce = useCallback(async (walletAddress: string) => {
    walletDebug.group('Fetch Nonce');
    walletDebug.log('Address:', walletAddress);

    const res = await fetch(
      `${API_BASE_URL}/api/auth/wallet/nonce?address=${walletAddress}`,
      { credentials: 'include' },
    );
    const data = await res.json();

    if (!data.success) {
      walletDebug.error('Nonce failed:', { status: res.status, error: data.error });
      walletDebug.groupEnd();
      throw new Error(data.error?.message || 'Không lấy được nonce');
    }

    walletDebug.log('Nonce received:', { nonce: data.data.nonce?.slice(0, 8) + '...', expiresAt: data.data.expiresAt });
    walletDebug.groupEnd();
    return data.data as { nonce: string; issuedAt: string; expiresAt: string };
  }, []);

  // Step 3: Sign SIWE message
  const signSiweMessage = useCallback(
    async (walletAddress: string, nonce: string) => {
      setState((s) => ({ ...s, isSigning: true }));

      walletDebug.group('Sign SIWE');
      walletDebug.log('Params:', { domain: SIWE_DOMAIN, address: walletAddress, chainId: CHAIN_ID, nonce });

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

        walletDebug.log('Message length:', message.length);

        const signature = await signMessageAsync({ message });

        walletDebug.log('Signed:', { sigPrefix: signature.slice(0, 20) + '...', sigLength: signature.length });
        walletDebug.groupEnd();
        return { message, signature };
      } catch (error) {
        walletDebug.warn('Sign failed:', error instanceof Error ? error.message : error);
        walletDebug.groupEnd();
        throw error;
      } finally {
        setState((s) => ({ ...s, isSigning: false }));
      }
    },
    [signMessageAsync],
  );

  // Step 4: Verify with backend
  const verifySignature = useCallback(
    async (message: string, signature: string) => {
      setState((s) => ({ ...s, isVerifying: true }));

      walletDebug.group('Verify Signature');
      walletDebug.log('POST', `${API_BASE_URL}/api/auth/wallet/verify`);

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/wallet/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message, signature }),
        });
        const data = await res.json();

        if (!data.success) {
          walletDebug.error('Verify failed:', { status: res.status, error: data.error });
          walletDebug.groupEnd();
          throw new Error(data.error?.message || 'Xác thực thất bại');
        }

        walletDebug.log('Verified:', { userId: data.user?.id, isNewUser: data.isNewUser });
        walletDebug.groupEnd();
        return data;
      } finally {
        setState((s) => ({ ...s, isVerifying: false }));
      }
    },
    [],
  );

  // Full login flow
  const loginWithWallet = useCallback(
    async (walletId: WalletId = 'metamask') => {
      walletDebug.group('=== WALLET LOGIN FLOW ===');
      walletDebug.log('Wallet:', walletId, '| Current:', { address, isConnected });

      try {
        setState({ isConnecting: false, isSigning: false, isVerifying: false, error: null });

        let walletAddress = address;
        if (!isConnected || !walletAddress) {
          walletAddress = await connectWallet(walletId);
        }
        if (!walletAddress) throw new Error('Không kết nối được ví');

        const { nonce } = await fetchNonce(walletAddress);
        const { message, signature } = await signSiweMessage(walletAddress, nonce);
        const result = await verifySignature(message, signature);

        resetRedirectLock();

        try {
          await queryClient.prefetchQuery({
            queryKey: PLAYER_PROFILE_KEY,
            queryFn: () => gameApi.getProfile(),
          });
        } catch {
          // Non-blocking
        }

        walletDebug.log('=== LOGIN COMPLETE ===');
        walletDebug.groupEnd();
        return result;
      } catch (error) {
        const rawMsg = error instanceof Error ? error.message : 'Đăng nhập thất bại';
        const userMsg = toUserError(rawMsg, 'login');

        walletDebug.error('Login failed (raw):', rawMsg);
        walletDebug.error('Login failed (user):', userMsg);
        walletDebug.groupEnd();

        // Always reset redirect lock on login failure to prevent stuck state
        resetRedirectLock();

        setState((s) => ({ ...s, error: userMsg }));

        if (rawMsg.includes('User rejected') || rawMsg.includes('denied') || rawMsg === 'NO_WALLET_EXTENSION') {
          wagmiDisconnect();
        }
        throw error;
      }
    },
    [address, isConnected, connectWallet, fetchNonce, signSiweMessage, verifySignature, wagmiDisconnect],
  );

  // Link wallet flow
  const linkWallet = useCallback(async (walletId: WalletId = 'metamask') => {
    walletDebug.group('=== LINK WALLET FLOW ===');

    try {
      setState({ isConnecting: false, isSigning: false, isVerifying: false, error: null });

      let walletAddress = address;
      if (!isConnected || !walletAddress) {
        walletAddress = await connectWallet(walletId);
      }
      if (!walletAddress) throw new Error('Không kết nối được ví');

      const { nonce } = await fetchNonce(walletAddress);
      const { message, signature } = await signSiweMessage(walletAddress, nonce);

      setState((s) => ({ ...s, isVerifying: true }));

      walletDebug.log('POST', `${API_BASE_URL}/api/auth/wallet/link`);

      const res = await fetch(`${API_BASE_URL}/api/auth/wallet/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message, signature }),
      });
      const data = await res.json();
      setState((s) => ({ ...s, isVerifying: false }));

      if (!data.success) {
        walletDebug.error('Link failed:', data.error);
        throw new Error(data.error?.message || 'Liên kết thất bại');
      }

      walletDebug.log('=== LINK COMPLETE ===', data.data);
      walletDebug.groupEnd();
      return data;
    } catch (error) {
      const rawMsg = error instanceof Error ? error.message : 'Liên kết thất bại';
      const userMsg = toUserError(rawMsg, 'link');

      walletDebug.error('Link failed (raw):', rawMsg);
      walletDebug.groupEnd();

      setState((s) => ({ ...s, error: userMsg, isVerifying: false }));
      if (rawMsg.includes('User rejected') || rawMsg.includes('denied') || rawMsg === 'NO_WALLET_EXTENSION') {
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
    detectedWallets,
    loginWithWallet,
    linkWallet,
    disconnect: wagmiDisconnect,
    clearError,
  };
}
