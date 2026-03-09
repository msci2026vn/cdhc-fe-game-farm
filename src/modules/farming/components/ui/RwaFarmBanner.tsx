import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  isVip: boolean;
}

export default function RwaFarmBanner({ isVip }: Props) {
  const navigate = useNavigate();

  return (
    <div
      className={`rwa-farm-banner ${!isVip ? 'rwa-farm-banner--locked' : ''}`}
      onClick={() => navigate('/rwa/my-garden')}
    >
      <span>🌿 RWA Farm</span>
      {isVip ? (
        <span className="rwa-vip-crown">👑 VIP</span>
      ) : (
        <span style={{ fontSize: 14 }}>🔒</span>
      )}
    </div>
  );
}
