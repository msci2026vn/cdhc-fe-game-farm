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
    { key: 'home', image: '/assets/farm/btn_home_page.png', label: t('farming.action_bar.home'), cls: 'farm-action-btn--home' },
    { key: 'dugia', image: '/assets/farm/btn_estimated_price.png', label: t('farming.action_bar.forecast'), cls: 'farm-action-btn--dugia' },
    { key: 'shop', image: '/assets/farm/btn_shop.png', label: t('farming.action_bar.shop'), cls: 'farm-action-btn--shop' },
    { key: 'kho', image: '/assets/farm/btn_storage.png', label: t('farming.action_bar.inventory'), cls: 'farm-action-btn--kho' },
  ] as const;

  return (
    <>
      {BUTTONS.map((btn, i) => (
        <div
          key={btn.key}
          className={`farm-action-btn ${btn.cls}`}
          onClick={handlers[i]}
        >
          <img src={btn.image} alt={btn.key} className="farm-action-btn-img" />
          <span className="farm-action-label">{btn.label}</span>
        </div>
      ))}
    </>
  );
}
