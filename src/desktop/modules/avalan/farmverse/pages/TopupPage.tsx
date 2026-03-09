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
  pending: { label: 'Chờ thanh toán', color: 'text-yellow-600 bg-yellow-50' },
  paid: { label: 'Đã thanh toán', color: 'text-blue-600 bg-blue-50' },
  transferring: { label: 'Đang chuyển AVAX', color: 'text-purple-600 bg-purple-50' },
  completed: { label: 'Hoàn thành', color: 'text-green-600 bg-green-50' },
  failed: { label: 'Thất bại', color: 'text-red-600 bg-red-50' },
  expired: { label: 'Hết hạn', color: 'text-gray-500 bg-gray-50' },
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
    <div className="h-[100dvh] overflow-y-auto bg-gradient-to-b from-green-50 to-white pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Quay lại</span>
          </button>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            <span className="font-bold text-green-700">Nạp AVAX</span>
          </div>
          <button
            onClick={() => refetch()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Cập nhật giá"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* Title */}
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-gray-800 mb-1">
            Nạp AVAX vào ví FARMVERSE
          </h1>
          <p className="text-gray-500 text-xs">
            Chọn gói nạp phù hợp · Thanh toán bằng PayPal hoặc thẻ quốc tế
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
            <p className="text-gray-500">Đang tải giá...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-3">Không thể tải giá. Thử lại?</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Package grid */}
        {data && (
          <div className="grid grid-cols-2 gap-3 mb-6">
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
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Thanh toán bằng:</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* PayPal */}
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'paypal'
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
              >
                <span className="text-xl">🟡</span>
                <span className="font-semibold text-gray-800 text-sm">PayPal</span>
                <span className="text-[11px] text-gray-500 text-center">
                  Visa, Mastercard, PayPal
                </span>
                {paymentMethod === 'paypal' && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                    Khuyến nghị
                  </span>
                )}
              </button>

              {/* Stripe */}
              <button
                onClick={() => setPaymentMethod('stripe')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'stripe'
                    ? 'border-purple-500 bg-purple-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
              >
                <CreditCard className="w-6 h-6 text-purple-600" />
                <span className="font-semibold text-gray-800 text-sm">Stripe</span>
                <span className="text-[11px] text-gray-500 text-center">
                  Visa, Mastercard, JCB
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Checkout button */}
        {data && (
          <div className="mb-8">
            <button
              onClick={handleCheckout}
              disabled={!selectedId || checkout.isPending}
              className={`w-full py-3.5 px-5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${!selectedId
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : checkout.isPending
                    ? 'bg-gray-300 text-gray-500 cursor-wait'
                    : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] shadow-lg shadow-green-200'
                }`}
            >
              {checkout.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : selectedPkg ? (
                <>
                  <Zap className="w-5 h-5" />
                  Nạp {selectedPkg.avaxAmount} AVAX — ${(selectedPkg.priceUsd ?? 0).toFixed(2)}
                </>
              ) : (
                'Chọn gói nạp để tiếp tục'
              )}
            </button>
          </div>
        )}

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6">
          <h3 className="font-semibold text-blue-800 text-xs mb-1.5">Lưu ý</h3>
          <ul className="text-[11px] text-blue-700 space-y-0.5">
            <li>· Hỗ trợ thanh toán qua PayPal (Visa, Mastercard, PayPal) và Stripe (Visa, Mastercard, JCB)</li>
            <li>· AVAX sẽ được chuyển vào ví FARMVERSE trong vòng 1-2 phút</li>
            <li>· Giá AVAX cập nhật mỗi 5 phút từ Chainlink Oracle</li>
            <li>· Dùng AVAX để mua VIP, vật phẩm, và các dịch vụ trong game</li>
          </ul>
        </div>

        {/* Transaction history */}
        {history.data && history.data.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-gray-800 mb-3">Lịch sử nạp</h2>
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
