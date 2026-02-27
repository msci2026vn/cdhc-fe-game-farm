// === Payment Method ===
export type PaymentMethod = 'stripe' | 'paypal';

// === API Response Types ===

export interface TopupPackage {
  id: string;
  name: string;
  avaxAmount: string;
  emoji: string;
  description: string;
  priceUsd: number;
  priceUsdCents: number;
  priceVnd: number;
}

export interface TopupPackagesResponse {
  success: boolean;
  data: {
    avaxPriceUsd: number;
    avaxPriceVnd: number;
    updatedAt: number;
    stale: boolean;
    packages: TopupPackage[];
  };
}

export interface AvaxPriceResponse {
  success: boolean;
  data: {
    usd: number;
    vnd: number;
    updatedAt: number;
    stale: boolean;
  };
}

export interface CheckoutResponse {
  success: boolean;
  data: {
    sessionUrl: string;
    orderId: string;
  };
}

export interface TopupOrder {
  id: string;
  packageId: string;
  avaxAmount: string;
  avaxPriceUsd: string;
  fiatAmountUsd: number;
  fiatAmountVnd: number;
  paymentMethod: string;
  status: 'pending' | 'paid' | 'transferring' | 'completed' | 'failed' | 'expired';
  txHash: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface TopupHistoryResponse {
  success: boolean;
  data: TopupOrder[];
}
