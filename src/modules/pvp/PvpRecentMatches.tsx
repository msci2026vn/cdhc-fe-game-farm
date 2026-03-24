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
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{
          fontSize: 14, fontWeight: 900, color: '#FFFEA3',
          fontFamily: "'Fredoka One', 'Nunito', sans-serif",
          textShadow: '1px 1px 0 #1a0a00, -1px 1px 0 #1a0a00, 1px -1px 0 #1a0a00, -1px -1px 0 #1a0a00',
        }}>{t('lobby.recentMatches')}</span>
        <button
          onClick={() => navigate('/pvp/history')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#FFFEA3',
            fontSize: 12, fontWeight: 900,
            fontFamily: "'Fredoka One', 'Nunito', sans-serif",
            textShadow: '1px 1px 0 #1a0a00, -1px 1px 0 #1a0a00, 1px -1px 0 #1a0a00, -1px -1px 0 #1a0a00',
            padding: 0,
          }}
        >
          {t('lobby.viewAll')}
        </button>
      </div>

      {!historyData?.matches?.length ? (
        <div style={{
          background: "url('/assets/pvp_1vs1_arena/frame_recent_match.png') no-repeat center center / 100% 100%",
          borderRadius: 10, padding: '18px 12px', textAlign: 'center',
          color: '#5c3a21', fontSize: 13, minHeight: 60,
          fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5,
          textShadow: '0 1px 1px rgba(255,255,255,0.4)',
        }}>
          {t('lobby.noMatches')}
        </div>
      ) : (
        historyData.matches.map(m => (
          <div key={m.id} style={{
            background: "url('/assets/pvp_1vs1_arena/frame_recent_match.png') no-repeat center center / 100% 100%",
            borderRadius: 10, padding: '12px 32px', marginBottom: 6,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            minHeight: 64,
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
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4a2c16' }}>
                  vs {m.opponent_name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(74, 44, 22, 0.7)' }}>
                  {m.my_score.toLocaleString()} – {m.opp_score.toLocaleString()}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: 12, fontWeight: 900, padding: '4px 14px',
              borderRadius: 6,
              background: "url('/assets/pvp_1vs1_arena/frame_result.png') no-repeat center center / 100% 100%",
              color: m.result === 'win' ? '#fff' : m.result === 'draw' ? '#94a3b8' : '#ef4444',
              minWidth: 70, textAlign: 'center',
              fontFamily: "'Fredoka One', 'Nunito', sans-serif",
              textShadow: m.result === 'win' ? '1px 1px 0 #14532d' : 'none',
            }}>
              {m.result === 'win' ? t('history.win') : m.result === 'draw' ? t('history.draw') : t('history.lose')}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
