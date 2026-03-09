import { http, createConfig } from 'wagmi';
import { avalanche, avalancheFuji } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { walletDebug } from '@/shared/utils/wallet-debug';

export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const wagmiConfig = createConfig({
  chains: [avalanche, avalancheFuji],
  connectors: [
    injected(),
    ...(WALLETCONNECT_PROJECT_ID
      ? [walletConnect({
          projectId: WALLETCONNECT_PROJECT_ID,
          showQrModal: true,
          metadata: {
            name: 'FARMVERSE - Con Đường Hữu Cơ',
            description: 'Organic Kingdom - Nông trại hữu cơ trên Avalanche',
            url: 'https://cdhc.vn',
            icons: ['https://cdhc.vn/favicon.ico'],
          },
        })]
      : []),
  ],
  transports: {
    [avalanche.id]: http('https://api.avax.network/ext/bc/C/rpc'),
    [avalancheFuji.id]: http('https://api.avax-test.network/ext/bc/C/rpc'),
  },
});

walletDebug.log('Wagmi config created:', {
  chains: wagmiConfig.chains.map(c => ({ id: c.id, name: c.name })),
  walletConnectProjectId: WALLETCONNECT_PROJECT_ID ? 'SET' : 'NOT SET',
});
