import { Check } from 'lucide-react';
import type { TopupPackage } from '../types/payment.types';

interface PackageCardProps {
  pkg: TopupPackage;
  onSelect: (packageId: string) => void;
  selectedId?: string;
}

export function PackageCard({ pkg, onSelect, selectedId }: PackageCardProps) {
  const isSelected = selectedId === pkg.id;

  return (
    <div
      className={`
        relative rounded-xl border-2 p-3 transition-all duration-200 cursor-pointer
        active:scale-[0.97]
        ${isSelected
          ? 'border-green-500 bg-green-50 shadow-sm shadow-green-100'
          : 'border-gray-200 bg-white hover:border-green-300'
        }
      `}
      onClick={() => onSelect(pkg.id)}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Emoji + AVAX Amount */}
      <div className="text-center mb-2">
        <span className="text-2xl">{pkg.emoji}</span>
        <div className="mt-1">
          <span className="text-xl font-bold text-green-600">{pkg.avaxAmount}</span>
          <span className="text-xs text-green-600 ml-0.5">AVAX</span>
        </div>
      </div>

      {/* Prices */}
      <div className="text-center space-y-0.5">
        <p className="text-xs text-gray-700 font-semibold">
          ${(pkg.priceUsd ?? 0).toFixed(2)}
        </p>
        <p className="text-[11px] text-gray-500">
          {(pkg.priceVnd ?? 0).toLocaleString('vi-VN')}đ
        </p>
      </div>

      {/* Name */}
      <p className="text-[10px] text-gray-400 text-center mt-1.5 truncate">{pkg.name}</p>
    </div>
  );
}
