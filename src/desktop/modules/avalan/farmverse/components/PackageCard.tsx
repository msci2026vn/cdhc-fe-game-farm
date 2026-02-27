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
        relative rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer
        hover:shadow-lg hover:-translate-y-1
        ${isSelected
          ? 'border-green-500 bg-green-50 shadow-green-100'
          : 'border-gray-200 bg-white hover:border-green-300'
        }
      `}
      onClick={() => onSelect(pkg.id)}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

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
      <div className="text-center space-y-1">
        <p className="text-sm text-gray-600">
          ≈ <span className="font-semibold">${(pkg.priceUsd ?? 0).toFixed(2)}</span> USD
        </p>
        <p className="text-sm text-gray-600">
          ≈ <span className="font-semibold">{(pkg.priceVnd ?? 0).toLocaleString('vi-VN')}</span>đ
        </p>
      </div>
    </div>
  );
}
