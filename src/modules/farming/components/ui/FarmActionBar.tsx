import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onHome: () => void;
  onDuGia: () => void;
  onShop: () => void;
  onKhoDo: () => void;
}

export default function FarmActionBar({ onHome, onDuGia, onShop, onKhoDo }: Props) {
  const { t } = useTranslation();
  const handlers = [onHome, onDuGia, onShop, onKhoDo];

  const BUTTONS = [
    { key: 'home', icon: '🏠', label: t('farming.action_bar.home'), cls: 'farm-action-btn--home' },
    { key: 'dugia', icon: '📈', label: t('farming.action_bar.forecast'), cls: 'farm-action-btn--dugia' },
    { key: 'shop', icon: '🛒', label: t('farming.action_bar.shop'), cls: 'farm-action-btn--shop' },
    { key: 'kho', icon: '🎒', label: t('farming.action_bar.inventory'), cls: 'farm-action-btn--kho' },
  ] as const;

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
