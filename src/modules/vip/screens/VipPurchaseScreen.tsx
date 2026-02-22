import { useNavigate } from 'react-router-dom';
import { PurchaseFlow } from '../components/PurchaseFlow';
import { useVipOrders } from '@/shared/hooks/useVipPayment';

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60_000) return 'Vừa xong';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VipPurchaseScreen() {
  const navigate = useNavigate();
  const { data: orders } = useVipOrders();

  return (
    <div className="bg-background-light min-h-[100dvh] text-farm-brown-dark font-body select-none">
      <div className="max-w-[430px] mx-auto min-h-[100dvh] relative bg-farm-vibe shadow-2xl">

        {/* Decorative bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-green-200 rounded-full blur-[60px] opacity-40" />
          <div className="absolute bottom-[-20px] right-[-20px] w-80 h-80 bg-yellow-100 rounded-full blur-[50px] opacity-60" />
        </div>

        {/* Header */}
        <div className="relative z-10 px-4 pt-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="bg-white/80 p-2 rounded-xl shadow-paper-shadow text-farm-brown-dark hover:bg-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="font-heading font-bold text-xl text-farm-brown-dark">
              Nâng cấp VIP
            </h1>
            <p className="text-xs text-gray-500">
              Mở khoá toàn bộ tính năng nông trại hữu cơ
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 mt-6 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 80px)' }}>
          <PurchaseFlow />

          {/* Order History */}
          {orders && orders.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-bold text-gray-400 uppercase">Lịch sử mua hàng</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-2">
                {orders.map((order, idx) => {
                  const id = order.orderId || (order as any).id || '';
                  return (
                  <div
                    key={id || idx}
                    className="bg-white/60 rounded-xl p-3 border border-white/50 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-farm-brown-dark">
                          {order.amountAvax || '?'} AVAX
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {id ? `${id.slice(0, 8)}...` : '—'}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : order.status === 'expired'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {order.status === 'confirmed' ? 'Thành công' :
                         order.status === 'pending' ? 'Đang chờ' :
                         order.status === 'expired' ? 'Hết hạn' : 'Thất bại'}
                      </span>
                    </div>

                    {/* Time + Snowtrace link */}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-gray-400">
                        {order.createdAt ? formatRelativeTime(order.createdAt) : '—'}
                      </span>
                      {order.explorerUrl && order.status === 'confirmed' && (
                        <a
                          href={order.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-500 hover:underline"
                        >
                          Xem trên Snowtrace
                        </a>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
