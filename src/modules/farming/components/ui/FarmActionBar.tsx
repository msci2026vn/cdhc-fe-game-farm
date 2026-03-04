import React from 'react';

interface Props {
  onHome: () => void;
  onDuGia: () => void;
  onShop: () => void;
  onKhoDo: () => void;
}

const BUTTONS = [
  { key: 'home', icon: '🏠', label: 'Trang Chủ', cls: 'farm-action-btn--home' },
  { key: 'dugia', icon: '📈', label: 'Dự Giá', cls: 'farm-action-btn--dugia' },
  { key: 'shop', icon: '🛒', label: 'Cửa Hàng', cls: 'farm-action-btn--shop' },
  { key: 'kho', icon: '🎒', label: 'Kho Đồ', cls: 'farm-action-btn--kho' },
] as const;

export default function FarmActionBar({ onHome, onDuGia, onShop, onKhoDo }: Props) {
  const handlers = [onHome, onDuGia, onShop, onKhoDo];

  return (
    <>
      {BUTTONS.map((btn, i) => (
        <div
          key={btn.key}
          className={`farm-action-btn ${btn.cls}`}
          onClick={handlers[i]}
        >
          <span className="farm-action-icon">{btn.icon}</span>
          <span className="farm-action-label">{btn.label}</span>
        </div>
      ))}
    </>
  );
}
