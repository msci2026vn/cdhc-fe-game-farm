import { http, createConfig } from 'wagmi';
import { avalanche, avalancheFuji } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const wagmiConfig = createConfig({
  chains: [avalanche, avalancheFuji],
  connectors: [
    injected(),
    ...(WALLETCONNECT_PROJECT_ID
      ? [walletConnect({ projectId: WALLETCONNECT_PROJECT_ID })]
      : []),
  ],
  transports: {
    [avalanche.id]: http('https://api.avax.network/ext/bc/C/rpc'),
    [avalancheFuji.id]: http('https://api.avax-test.network/ext/bc/C/rpc'),
  },
});
