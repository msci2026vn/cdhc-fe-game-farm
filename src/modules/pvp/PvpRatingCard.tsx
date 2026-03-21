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
      background: "url('/assets/pvp/frame_thuc_dien_ky.png') no-repeat center center / 100% 100%",
      borderRadius: 12,
      padding: '12px 24px',
      marginBottom: 12,
      minHeight: 180,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      {/* Tier row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, paddingTop: 6 }}>
        <img
          src="/assets/pvp/leaf_icon.png"
          alt="rank-icon"
          style={{ width: 48, height: 48, objectFit: 'contain' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: rankInfo.tier.color, textShadow: '0 1px 2px rgba(0,0,0,0.5)', fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5 }}>
            {rankInfo.tier.name}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', fontWeight: 600, fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5 }}>
            {rankInfo.subTierName}
          </div>
        </div>
        <img
          src="/assets/pvp/btn_xem_thang.png"
          alt="view-rank"
          onClick={() => navigate('/pvp/rank')}
          style={{ width: 94, cursor: 'pointer', transition: 'transform 0.1s' }}
          onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
          onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </div>

      {/* Bottom section moved up */}
      <div style={{ transform: 'translateY(-12px)' }}>
        {/* Rank Points */}
        <div style={{ fontSize: 32, fontWeight: 900, color: '#b45309', marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 6, fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5 }}>
          {rankPoints} <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', fontWeight: 700, fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5 }}>điểm</span>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 10, background: 'rgba(0,0,0,0.15)',
          borderRadius: 5, overflow: 'hidden', marginBottom: 10,
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
        }}>
          <div style={{
            height: '100%', borderRadius: 6,
            width: `${rankInfo.progress}%`,
            backgroundColor: rankInfo.tier.color,
            transition: 'width 0.5s',
            boxShadow: '0 0 8px rgba(0,0,0,0.2)',
          }} />
        </div>

        {/* Win/Loss/Draw row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 15, fontWeight: 600, fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5 }}>
          <span style={{ color: '#15803d' }}>{rating?.wins ?? 0} {t('lobby.wins')}</span>
          <span style={{ color: '#b91c1c' }}>{rating?.losses ?? 0} {t('lobby.losses')}</span>
          <span style={{ color: '#475569' }}>{rating?.draws ?? 0} {t('lobby.draws')}</span>
          <span style={{ marginLeft: 'auto', color: 'rgba(0,0,0,0.45)', fontSize: 14, fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5 }}>
            {t('lobby.winRate', { rate: winRate })}
          </span>
        </div>
      </div>
    </div>
  );
}
