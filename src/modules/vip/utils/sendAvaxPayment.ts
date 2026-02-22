import { parseEther } from 'viem';

export function hasWalletExtension(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum;
}

export async function sendViaWalletExtension(
  toAddress: string,
  amountAvax: string
): Promise<string> {
  if (!window.ethereum) throw new Error('Không tìm thấy ví (MetaMask/Core)');

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('Chưa chọn tài khoản ví');
  }

  // Switch to Avalanche Mainnet (43114 = 0xA86A)
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xA86A' }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xA86A',
          chainName: 'Avalanche C-Chain',
          nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
          rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
          blockExplorerUrls: ['https://snowtrace.io'],
        }],
      });
    } else {
      throw switchError;
    }
  }

  const valueHex = '0x' + parseEther(amountAvax).toString(16);

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from: accounts[0],
      to: toAddress,
      value: valueHex,
    }],
  });

  return txHash as string;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}
