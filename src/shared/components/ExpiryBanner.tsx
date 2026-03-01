// ═══════════════════════════════════════════════════════════════
// ExpiryBanner — shows when auto-play rent is expiring soon
// Displays when daysUntilExpiry <= 2
// ═══════════════════════════════════════════════════════════════

import { useNavigate } from 'react-router-dom';

interface Props {
  daysLeft: number;
}

export default function ExpiryBanner({ daysLeft }: Props) {
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
        ⚠️ Auto AI {urgent ? 'đã hết hạn' : `hết hạn trong ${daysLeft} ngày`}
      </span>
      <button
        onClick={() => navigate('/shop')}
        className="ml-2 px-2 py-0.5 rounded active:opacity-75 transition-opacity"
        style={{ background: 'rgba(255,255,255,0.2)' }}
      >
        Gia hạn
      </button>
    </div>
  );
}
