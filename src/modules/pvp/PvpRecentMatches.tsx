import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { pvpApi } from '@/shared/api/api-pvp';
import { useAuth } from '@/shared/hooks/useAuth';

export function PvpRecentMatches() {
  const navigate = useNavigate();
  const { t } = useTranslation('pvp');
  const { data: auth } = useAuth();

  const { data: historyData } = useQuery({
    queryKey: ['pvp', 'history', 3],
    queryFn: () => pvpApi.getHistory(3),
    enabled: !!auth?.user,
  });

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>{t('lobby.recentMatches')}</span>
        <button
          onClick={() => navigate('/pvp/history')}
          style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
        >
          {t('lobby.viewAll')}
        </button>
      </div>

      {!historyData?.matches?.length ? (
        <div style={{
          background: '#0d1b2a', border: '1px solid #1e3a5a',
          borderRadius: 10, padding: '20px', textAlign: 'center',
          color: '#64748b', fontSize: 13,
        }}>
          {t('lobby.noMatches')}
        </div>
      ) : (
        historyData.matches.map(m => (
          <div key={m.id} style={{
            background: '#0d1b2a', border: '1px solid #1e3a5a',
            borderRadius: 10, padding: '12px 16px', marginBottom: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#1e4d78',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, overflow: 'hidden',
              }}>
                {m.opponent_avatar
                  ? <img src={m.opponent_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : '👤'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                  vs {m.opponent_name}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {m.my_score.toLocaleString()} – {m.opp_score.toLocaleString()}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, padding: '4px 12px',
              borderRadius: 8,
              background: m.result === 'win' ? '#14532d' : m.result === 'draw' ? '#1e293b' : '#450a0a',
              color: m.result === 'win' ? '#22c55e' : m.result === 'draw' ? '#94a3b8' : '#ef4444',
            }}>
              {m.result === 'win' ? t('history.win') : m.result === 'draw' ? t('history.draw') : t('history.lose')}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
