// ═══════════════════════════════════════════════════════════════
// ExpiryBanner — shows when auto-play rent is expiring soon
// Displays when daysUntilExpiry <= 2
// ═══════════════════════════════════════════════════════════════

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
  daysLeft: number;
}

export default function ExpiryBanner({ daysLeft }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const urgent = daysLeft <= 0;

  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-bold"
      style={{
        background: urgent ? '#ef4444' : '#f97316',
        color: 'white',
      }}
    >
      <span>
        ⚠️ {urgent ? t('auto_ai_expired') : t('auto_ai_expires_in', { days: daysLeft })}
      </span>
      <button
        onClick={() => navigate('/shop')}
        className="ml-2 px-2 py-0.5 rounded active:opacity-75 transition-opacity"
        style={{ background: 'rgba(255,255,255,0.2)' }}
      >
        {t('renew')}
      </button>
    </div>
  );
}
