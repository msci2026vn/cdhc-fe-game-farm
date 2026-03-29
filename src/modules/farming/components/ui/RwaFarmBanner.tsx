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
      <span className="rwa-farm-text">RWA Farm</span>
    </div>
  );
}
