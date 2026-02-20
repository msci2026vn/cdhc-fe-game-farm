/**
 * Wallet Auth Debug Logger
 *
 * Bật:  walletDebug.enable() trong Console rồi reload
 * Tắt:  walletDebug.disable() rồi reload
 * Info: walletDebug.logEnvironment()
 *
 * Errors LUÔN log (không cần enable).
 */

const PREFIX = '[WALLET-AUTH]';

function isEnabled(): boolean {
  try {
    return localStorage.getItem('WALLET_DEBUG') === 'true';
  } catch {
    return false;
  }
}

export const walletDebug = {
  log(...args: unknown[]) {
    if (isEnabled()) console.log(PREFIX, ...args);
  },
  warn(...args: unknown[]) {
    if (isEnabled()) console.warn(PREFIX, ...args);
  },
  error(...args: unknown[]) {
    console.error(PREFIX, ...args);
  },
  group(label: string) {
    if (isEnabled()) console.group(`${PREFIX} ${label}`);
  },
  groupEnd() {
    if (isEnabled()) console.groupEnd();
  },
  enable() {
    localStorage.setItem('WALLET_DEBUG', 'true');
    console.log(PREFIX, 'Debug logging ENABLED. Reload page.');
  },
  disable() {
    localStorage.removeItem('WALLET_DEBUG');
    console.log(PREFIX, 'Debug logging DISABLED. Reload page.');
  },
  logEnvironment() {
    if (typeof window === 'undefined') return null;
    const eth = (window as any).ethereum;
    const env = {
      hasEthereum: !!eth,
      providers: eth
        ? {
            isMetaMask: !!eth.isMetaMask,
            isCoreWallet: !!eth.isAvalanche || !!eth.isCoreWallet,
            isCoinbaseWallet: !!eth.isCoinbaseWallet,
            isRabby: !!eth.isRabby,
            chainId: eth.chainId,
          }
        : null,
      multipleProviders: Array.isArray(eth?.providers),
      providerCount: eth?.providers?.length || (eth ? 1 : 0),
      apiUrl: import.meta.env.VITE_API_URL || 'NOT SET',
    };
    console.log(PREFIX, 'Environment:', env);
    return env;
  },
};

if (typeof window !== 'undefined') {
  (window as any).walletDebug = walletDebug;
}
