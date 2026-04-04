import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  temperature: number;
  humidity: number;
  weatherIcon?: string;
  ognBalance: number | string;
}

export default function FarmWeatherOGN({ temperature, humidity, weatherIcon, ognBalance }: Props) {
  const navigate = useNavigate();
  const icon = weatherIcon || (temperature > 30 ? '☀️' : temperature > 20 ? '⛅' : '🌧️');
  const formatted = typeof ognBalance === 'number'
    ? ognBalance.toLocaleString('vi-VN')
    : ognBalance;

  return (
    <>
      <div className="farm-weather-pill">
        <span>{icon}</span>
        <span>{Math.round(temperature)}°C</span>
        <span>💧{humidity}%</span>
      </div>
      <div
        className="farm-ogn-pill"
        onClick={() => navigate('/ogn-history')}
        style={{ cursor: 'pointer' }}
        role="button"
        aria-label="Lịch sử OGN"
      >
        <img src="/icons/ogn_coin.png" alt="coin" className="w-4 h-4 object-contain shadow-sm" />
        <span>{formatted}</span>
      </div>
    </>
  );
}
