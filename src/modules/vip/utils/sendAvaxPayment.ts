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

// ─── Wait for TX receipt (polling via eth_getTransactionReceipt) ───

async function waitForTxReceipt(
  txHash: string,
  timeout = 30_000,
  interval = 2_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const receipt = await window.ethereum!.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    });
    if (receipt) {
      if (receipt.status === '0x0') {
        throw new Error('Giao dịch thất bại trên blockchain');
      }
      return;
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  // Timeout — let backend handle final verification
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

  const txHash = (await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: accounts[0],
        to: toAddress,
        value: valueHex,
      },
    ],
  })) as string;

  // Wait for TX to be mined before returning (fixes race condition)
  await waitForTxReceipt(txHash);

  return txHash;
}

// ─── Smart Wallet (Passkey + ERC-4337) ───

export interface PrepareResult {
  userOpHash: string;
  expiresAt: number;
  expiresIn: number;
}

/** Step 1: Prepare UserOperation — returns hash + expiry info for countdown */
export async function prepareSmartWalletOp(
  toAddress: string,
  amountAvax: string
): Promise<PrepareResult> {
  const result = await gameApi.prepareUserOp([
    {
      to: toAddress,
      value: parseEther(amountAvax).toString(),
    },
  ]);

  return {
    userOpHash: result.userOpHash,
    expiresAt: result.expiresAt,
    expiresIn: result.expiresIn,
  };
}

/** Step 2: Sign with passkey + submit to bundler */
export async function signAndSubmitSmartWalletOp(
  userOpHash: string
): Promise<string> {
  // Sign with passkey (WebAuthn assertion)
  const challenge = hexToUint8Array(userOpHash);

  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: 'cdhc.vn',
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

  // Submit signed UserOp
  const { txHash } = await gameApi.submitSignedOp({
    userOpHash,
    assertion,
  });

  return txHash;
}

/** All-in-one (kept for backward compat) */
export async function sendViaSmartWallet(
  toAddress: string,
  amountAvax: string
): Promise<string> {
  const { userOpHash } = await prepareSmartWalletOp(toAddress, amountAvax);
  return signAndSubmitSmartWalletOp(userOpHash);
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}
