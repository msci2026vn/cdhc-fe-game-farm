import { ArrowLeft, Wallet, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopupPackages } from '../hooks/useTopupPackages';
import { useTopupCheckout } from '../hooks/useTopupCheckout';
import { useTopupHistory } from '../hooks/useTopupHistory';
import { PackageCard } from '../components/PackageCard';
import { PriceUpdatedBadge } from '../components/PriceUpdatedBadge';
import { useState } from 'react';

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

  const handleSelect = (packageId: string) => {
    setSelectedId(packageId);
    checkout.mutate(packageId);
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

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Nạp AVAX vào ví FARMVERSE
          </h1>
          <p className="text-gray-500 text-sm">
            Chọn gói nạp phù hợp · Thanh toán bằng thẻ quốc tế
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {data.packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onSelect={handleSelect}
                loading={checkout.isPending}
                selectedId={selectedId || undefined}
              />
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
          <h3 className="font-semibold text-blue-800 text-sm mb-2">Lưu ý</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Thanh toán qua Stripe — hỗ trợ Visa, Mastercard, JCB</li>
            <li>• AVAX sẽ được chuyển vào ví FARMVERSE trong vòng 1-2 phút</li>
            <li>• Giá AVAX cập nhật mỗi 5 phút từ Chainlink Oracle</li>
            <li>• Dùng AVAX để mua VIP, vật phẩm, và các dịch vụ trong game</li>
          </ul>
        </div>

        {/* Transaction history */}
        {history.data && history.data.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Lịch sử nạp</h2>
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
