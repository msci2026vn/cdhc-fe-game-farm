import { Loader2, Zap } from 'lucide-react';
import type { TopupPackage } from '../types/payment.types';

interface PackageCardProps {
  pkg: TopupPackage;
  onSelect: (packageId: string) => void;
  loading?: boolean;
  selectedId?: string;
}

export function PackageCard({ pkg, onSelect, loading, selectedId }: PackageCardProps) {
  const isSelected = selectedId === pkg.id;
  const isLoading = loading && isSelected;

  return (
    <div
      className={`
        relative rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer
        hover:shadow-lg hover:-translate-y-1
        ${isSelected
          ? 'border-green-500 bg-green-50 shadow-green-100'
          : 'border-gray-200 bg-white hover:border-green-300'
        }
      `}
      onClick={() => !loading && onSelect(pkg.id)}
    >
      {/* Emoji + Name */}
      <div className="text-center mb-4">
        <span className="text-4xl">{pkg.emoji}</span>
        <h3 className="text-lg font-bold text-gray-800 mt-2">{pkg.name}</h3>
        <p className="text-sm text-gray-500">{pkg.description}</p>
      </div>

      {/* AVAX Amount */}
      <div className="text-center mb-4">
        <span className="text-3xl font-bold text-green-600">{pkg.avaxAmount}</span>
        <span className="text-lg text-green-600 ml-1">AVAX</span>
      </div>

      {/* Prices */}
      <div className="text-center space-y-1 mb-5">
        <p className="text-sm text-gray-600">
          ≈ <span className="font-semibold">${pkg.priceUsd.toFixed(2)}</span> USD
        </p>
        <p className="text-sm text-gray-600">
          ≈ <span className="font-semibold">{pkg.priceVnd.toLocaleString('vi-VN')}</span>đ
        </p>
      </div>

      {/* Button */}
      <button
        disabled={loading}
        className={`
          w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all
          flex items-center justify-center gap-2
          ${isLoading
            ? 'bg-gray-300 text-gray-500 cursor-wait'
            : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
          }
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Nạp {pkg.avaxAmount} AVAX
          </>
        )}
      </button>
    </div>
  );
}
