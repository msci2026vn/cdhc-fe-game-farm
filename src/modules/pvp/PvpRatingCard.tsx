import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { pvpApi, getRankFromPoints } from '@/shared/api/api-pvp';
import { useAuth } from '@/shared/hooks/useAuth';

export function PvpRatingCard() {
  const navigate = useNavigate();
  const { t } = useTranslation('pvp');
  const { data: auth } = useAuth();

  const { data: rating } = useQuery({
    queryKey: ['pvp', 'rating'],
    queryFn: pvpApi.getRating,
    enabled: !!auth?.user,
  });

  const rankPoints = rating?.rankPoints ?? 0;
  const rankInfo = getRankFromPoints(rankPoints);
  const winRate = rating
    ? rating.wins + rating.losses + rating.draws > 0
      ? Math.round((rating.wins / (rating.wins + rating.losses + rating.draws)) * 100)
      : 0
    : 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg,#1e3a5a,#0f1e30)',
      border: '1px solid #1e4d78',
      borderRadius: 16, padding: '16px 20px', marginBottom: 20,
    }}>
      {/* Tier row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>{rankInfo.tier.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: rankInfo.tier.color }}>
            {rankInfo.tier.name}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {rankInfo.subTierName}
          </div>
        </div>
        <button
          onClick={() => navigate('/pvp/rank')}
          style={{
            background: 'none', border: '1px solid #475569',
            borderRadius: 8, padding: '4px 10px',
            color: '#94a3b8', fontSize: 11, cursor: 'pointer',
          }}
        >
          Xem thang →
        </button>
      </div>

      {/* Rank Points */}
      <div style={{ fontSize: 32, fontWeight: 900, color: '#f59e0b', marginBottom: 4 }}>
        {rankPoints} <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 400 }}>điểm</span>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%', height: 6, background: '#374151',
        borderRadius: 3, overflow: 'hidden', marginBottom: 10,
      }}>
        <div style={{
          height: '100%', borderRadius: 3,
          width: `${rankInfo.progress}%`,
          backgroundColor: rankInfo.tier.color,
          transition: 'width 0.5s',
        }} />
      </div>

      {/* Win/Loss/Draw row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
        <span style={{ color: '#22c55e' }}>{rating?.wins ?? 0} {t('lobby.wins')}</span>
        <span style={{ color: '#ef4444' }}>{rating?.losses ?? 0} {t('lobby.losses')}</span>
        <span style={{ color: '#94a3b8' }}>{rating?.draws ?? 0} {t('lobby.draws')}</span>
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12 }}>
          {t('lobby.winRate', { rate: winRate })}
        </span>
      </div>
    </div>
  );
}
