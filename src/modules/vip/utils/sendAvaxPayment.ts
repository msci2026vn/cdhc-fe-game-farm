import { parseEther } from 'viem';
import { gameApi } from '@/shared/api/game-api';

// ─── Helpers ───

function hexToUint8Array(hex: string): Uint8Array {
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return bytes;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ─── MetaMask / Core Wallet ───

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
        params: [
          {
            chainId: '0xA86A',
            chainName: 'Avalanche C-Chain',
            nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
            rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
            blockExplorerUrls: ['https://snowtrace.io'],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }

  const valueHex = '0x' + parseEther(amountAvax).toString(16);

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: accounts[0],
        to: toAddress,
        value: valueHex,
      },
    ],
  });

  return txHash as string;
}

// ─── Smart Wallet (Passkey + ERC-4337) ───

export async function sendViaSmartWallet(
  toAddress: string,
  amountAvax: string
): Promise<string> {
  // 1. Prepare UserOperation
  const { userOpHash } = await gameApi.prepareUserOp([
    {
      to: toAddress,
      value: parseEther(amountAvax).toString(),
    },
  ]);

  // 2. Sign with passkey (WebAuthn assertion)
  const challenge = hexToUint8Array(userOpHash);

  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Đã hủy xác thực vân tay');
  }

  const response = credential.response as AuthenticatorAssertionResponse;

  const assertion = {
    authenticatorData: bufferToBase64url(response.authenticatorData),
    clientDataJSON: bufferToBase64url(response.clientDataJSON),
    signature: bufferToBase64url(response.signature),
  };

  // 3. Submit signed UserOp
  const { txHash } = await gameApi.submitSignedOp({
    userOpHash,
    assertion,
  });

  return txHash;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}
