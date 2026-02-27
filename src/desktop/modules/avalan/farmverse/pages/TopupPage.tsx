import { ArrowLeft, Wallet, RefreshCw, CreditCard, Loader2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopupPackages } from '../hooks/useTopupPackages';
import { useTopupCheckout } from '../hooks/useTopupCheckout';
import { useTopupHistory } from '../hooks/useTopupHistory';
import { PackageCard } from '../components/PackageCard';
import { PriceUpdatedBadge } from '../components/PriceUpdatedBadge';
import { useState } from 'react';
import type { PaymentMethod } from '../types/payment.types';

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: 'Cho thanh toan', color: 'text-yellow-600 bg-yellow-50' },
  paid: { label: 'Da thanh toan', color: 'text-blue-600 bg-blue-50' },
  transferring: { label: 'Dang chuyen AVAX', color: 'text-purple-600 bg-purple-50' },
  completed: { label: 'Hoan thanh', color: 'text-green-600 bg-green-50' },
  failed: { label: 'That bai', color: 'text-red-600 bg-red-50' },
  expired: { label: 'Het han', color: 'text-gray-500 bg-gray-50' },
};

export default function TopupPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useTopupPackages();
  const checkout = useTopupCheckout();
  const history = useTopupHistory();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');

  const selectedPkg = data?.packages.find((p) => p.id === selectedId);

  const handleCheckout = () => {
    if (!selectedId) return;
    checkout.mutate({ packageId: selectedId, paymentMethod });
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Quay lai</span>
          </button>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            <span className="font-bold text-green-700">Nap AVAX</span>
          </div>
          <button
            onClick={() => refetch()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Cap nhat gia"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Nap AVAX vao vi FARMVERSE
          </h1>
          <p className="text-gray-500 text-sm">
            Chon goi nap phu hop · Thanh toan bang PayPal hoac the quoc te
          </p>

          {data && (
            <div className="mt-3 flex justify-center">
              <PriceUpdatedBadge
                updatedAt={data.updatedAt}
                stale={data.stale}
                avaxPriceUsd={data.avaxPriceUsd}
              />
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 text-green-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Dang tai gia...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-3">Khong the tai gia. Thu lai?</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              Thu lai
            </button>
          </div>
        )}

        {/* Package grid */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {data.packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onSelect={setSelectedId}
                selectedId={selectedId || undefined}
              />
            ))}
          </div>
        )}

        {/* Payment method selector */}
        {data && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Thanh toan bang:</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* PayPal */}
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'paypal'
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <span className="text-2xl">🟡</span>
                <span className="font-semibold text-gray-800 text-sm">PayPal</span>
                <span className="text-xs text-gray-500 text-center">
                  Visa, Mastercard, PayPal
                </span>
                {paymentMethod === 'paypal' && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                    Khuyen nghi
                  </span>
                )}
              </button>

              {/* Stripe */}
              <button
                onClick={() => setPaymentMethod('stripe')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-purple-500 bg-purple-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <CreditCard className="w-7 h-7 text-purple-600" />
                <span className="font-semibold text-gray-800 text-sm">Stripe</span>
                <span className="text-xs text-gray-500 text-center">
                  Visa, Mastercard, JCB
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Checkout button */}
        {data && (
          <div className="mb-10">
            <button
              onClick={handleCheckout}
              disabled={!selectedId || checkout.isPending}
              className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                !selectedId
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : checkout.isPending
                    ? 'bg-gray-300 text-gray-500 cursor-wait'
                    : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] shadow-lg shadow-green-200'
              }`}
            >
              {checkout.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Dang xu ly...
                </>
              ) : selectedPkg ? (
                <>
                  <Zap className="w-5 h-5" />
                  Nap {selectedPkg.avaxAmount} AVAX
                </>
              ) : (
                'Chon goi nap de tiep tuc'
              )}
            </button>
          </div>
        )}

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
          <h3 className="font-semibold text-blue-800 text-sm mb-2">Luu y</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>* Ho tro thanh toan qua PayPal (Visa, Mastercard, PayPal) va Stripe (Visa, Mastercard, JCB)</li>
            <li>* AVAX se duoc chuyen vao vi FARMVERSE trong vong 1-2 phut</li>
            <li>* Gia AVAX cap nhat moi 5 phut tu Chainlink Oracle</li>
            <li>* Dung AVAX de mua VIP, vat pham, va cac dich vu trong game</li>
          </ul>
        </div>

        {/* Transaction history */}
        {history.data && history.data.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Lich su nap</h2>
            <div className="space-y-2">
              {history.data.slice(0, 5).map((order) => {
                const st = statusMap[order.status] || statusMap.pending;
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3"
                  >
                    <div>
                      <span className="font-semibold text-gray-800">
                        {order.avaxAmount} AVAX
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
