import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { pvpApi, getRankFromPoints } from '@/shared/api/api-pvp';
import { useAuth } from '@/shared/hooks/useAuth';

export default function PvpHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation('pvp');
  const { data: auth } = useAuth();
  const [tab, setTab] = useState<'history' | 'leaderboard'>(
    searchParams.get('tab') === 'leaderboard' ? 'leaderboard' : 'history'
  );

  const { data: historyData, isLoading: histLoading } = useQuery({
    queryKey: ['pvp', 'history', 20],
    queryFn: () => pvpApi.getHistory(20),
    enabled: !!auth?.user && tab === 'history',
  });

  const { data: lbData, isLoading: lbLoading } = useQuery({
    queryKey: ['pvp', 'leaderboard'],
    queryFn: () => pvpApi.getLeaderboard(50),
    enabled: !!auth?.user && tab === 'leaderboard',
  });

  return (
    <div style={{
      height: '100dvh',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0f3460 100%)',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: '16px 16px 80px',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => navigate('/pvp')}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: 4 }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>⚔️ PVP Stats</h1>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: '#0d1b2a',
          borderRadius: 10, padding: 4, marginBottom: 20,
          border: '1px solid #1e3a5a',
        }}>
          {(['history', 'leaderboard'] as const).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: 8,
                background: tab === tabKey ? '#e94560' : 'transparent',
                color: tab === tabKey ? '#fff' : '#64748b',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tabKey === 'history' ? `📜 ${t('history.title')}` : `🏆 ${t('history.leaderboard')}`}
            </button>
          ))}
        </div>

        {/* History tab */}
        {tab === 'history' && (
          <>
            {histLoading && (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>{t('common.loading')}</div>
            )}
            {!histLoading && !historyData?.matches?.length && (
              <div style={{
                background: '#0d1b2a', border: '1px solid #1e3a5a',
                borderRadius: 12, padding: 32, textAlign: 'center', color: '#64748b',
              }}>
                {t('history.noHistory')}
              </div>
            )}
            {historyData?.matches?.map(m => (
              <div key={m.id} style={{
                background: '#0d1b2a', border: '1px solid #1e3a5a',
                borderRadius: 12, padding: '14px 16px', marginBottom: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: '#1e4d78', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                      flexShrink: 0,
                    }}>
                      {m.opponent_avatar
                        ? <img src={m.opponent_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        : '👤'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                        vs {m.opponent_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {new Date(m.created_at).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        {m.duration_seconds ? ` · ${m.duration_seconds}s` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 4 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 700, padding: '3px 10px',
                        borderRadius: 6,
                        background: m.result === 'win' ? '#14532d' : m.result === 'draw' ? '#1e293b' : '#450a0a',
                        color: m.result === 'win' ? '#22c55e' : m.result === 'draw' ? '#94a3b8' : '#ef4444',
                      }}>
                        {m.result === 'win' ? `🏆 ${t('history.win')}` : m.result === 'draw' ? `🤝 ${t('history.draw')}` : `💀 ${t('history.lose')}`}
                      </div>
                      {m.points_change != null && m.points_change !== 0 && (
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: m.points_change > 0 ? '#22c55e' : '#ef4444',
                        }}>
                          {m.points_change > 0 ? '+' : ''}{m.points_change}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {m.my_score.toLocaleString()} – {m.opp_score.toLocaleString()}
                    </div>
                    {m.tx_hash && (
                      <a
                        href={`https://snowtrace.io/tx/${m.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 10, color: 'rgba(255,255,255,0.25)',
                          display: 'block', marginTop: 3,
                          fontFamily: 'monospace', textDecoration: 'none',
                        }}
                      >
                        {m.tx_hash.slice(0, 8)}...{m.tx_hash.slice(-6)} ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Leaderboard tab */}
        {tab === 'leaderboard' && (
          <>
            {lbLoading && (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>{t('common.loading')}</div>
            )}
            {lbData?.leaderboard?.map((entry, idx) => (
              <div key={entry.user_id} style={{
                background: idx < 3
                  ? `linear-gradient(135deg,${['#78350f','#334155','#1c1c0a'][idx]},#0d1b2a)`
                  : '#0d1b2a',
                border: `1px solid ${idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#1e3a5a'}`,
                borderRadius: 12, padding: '12px 16px', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                {/* Rank */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#1e3a5a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: idx < 3 ? 16 : 12,
                  fontWeight: 700, color: '#fff',
                }}>
                  {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : entry.rank}
                </div>

                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: '#1e4d78', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {entry.picture
                    ? <img src={entry.picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : '👤'}
                </div>

                {/* Name + stats */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{entry.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {entry.wins}W · {entry.losses}L · {entry.draws}D
                  </div>
                </div>

                {/* Rank tier + points */}
                <div style={{ textAlign: 'right' }}>
                  {(() => {
                    const rk = getRankFromPoints(entry.rank_points ?? 0);
                    return (
                      <>
                        <div style={{ fontSize: 16, marginBottom: 1 }}>{rk.tier.icon}</div>
                        <div style={{ fontSize: 9, color: rk.tier.color, marginBottom: 2, whiteSpace: 'nowrap' }}>
                          {rk.tier.name} {rk.subTierName}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: idx < 3 ? '#f59e0b' : rk.tier.color }}>
                          {entry.rank_points ?? 0}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  );
}
