import { useEffect } from 'react';
import type { MilestoneInfo } from '../types/game-api.types';

interface MilestonePopupProps {
  milestone: MilestoneInfo;
  isOpen: boolean;
  onClose: () => void;
}

export function MilestonePopup({ milestone, isOpen, onClose }: MilestonePopupProps) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-5 max-w-[300px] w-full mx-4 shadow-2xl text-center"
        style={{ animation: 'bounceIn 0.4s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-2">{milestone.icon}</div>
        <h3 className="font-heading text-lg font-bold text-amber-600 mb-1">
          Mo khoa moi!
        </h3>
        <p className="font-bold text-base mb-1">{milestone.name}</p>
        <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-amber-500 active:scale-95 shadow-lg"
        >
          Tuyet voi!
        </button>
      </div>
    </div>
  );
}
