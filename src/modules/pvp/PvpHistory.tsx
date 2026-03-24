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
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      background: "url('/assets/pvp/bg_pvp.png') no-repeat center center / 100% 100%",
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: '40px 16px 100px',
    }}>
      <div style={{ maxWidth: 335, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: 40,
          minHeight: 32,
        }}>
          <button
            onClick={() => navigate('/pvp')}
            style={{
              position: 'absolute',
              left: -10,
              top: '50%',
              marginTop: 45,
              background: "url('/assets/stats/btn_back_arrow.png') no-repeat center center / contain",
              border: 'none',
              width: 36,
              height: 36,
              cursor: 'pointer',
              color: 'transparent',
              padding: 0,
              transition: 'transform 0.1s',
            }}
            onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
            onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Back
          </button>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 900,
            color: '#FFFEA3',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontFamily: "'Fredoka One', 'Nunito', sans-serif",
            textShadow: '2px 2px 0 #1a0a00, -2px 2px 0 #1a0a00, 2px -2px 0 #1a0a00, -2px -2px 0 #1a0a00, 3px 0 0 #1a0a00, -3px 0 0 #1a0a00, 0 3px 0 #1a0a00, 0 -3px 0 #1a0a00',
          }}>
            ⚔️ Stats
          </h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'center', flexShrink: 0 }}>
          <button
            onClick={() => setTab('history')}
            style={{
              width: 130, height: 40, flexShrink: 0,
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              opacity: tab === 'history' ? 1 : 0.6,
              transition: 'opacity 0.2s, transform 0.1s',
            }}
            onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <img src="/assets/stats/btn_history.png" alt="History" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </button>

          <button
            onClick={() => setTab('leaderboard')}
            style={{
              width: 130, height: 40, flexShrink: 0,
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              opacity: tab === 'leaderboard' ? 1 : 0.6,
              transition: 'opacity 0.2s, transform 0.1s',
            }}
            onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
            onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <img src="/assets/stats/btn_rankings.png" alt="Leaderboard" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </button>
        </div>

        <style>{`
          .pvp-history-scroll::-webkit-scrollbar { display: none; }
          .pvp-history-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        <div className="pvp-history-scroll" style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 120,
        }}>
          {/* History tab */}
          {tab === 'history' && (
            <>
              {histLoading && (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>{t('common.loading')}</div>
              )}
              {!histLoading && !historyData?.matches?.length && (
                <div style={{
                  background: `url('/assets/stats/rankings/frame_wood_7.png') no-repeat center center / 100% 100%`,
                  borderRadius: 12, padding: 32, textAlign: 'center',
                  color: '#fff',
                  fontFamily: "'Fredoka One', 'Nunito', sans-serif",
                  textShadow: '1.5px 1.5px 0 #1a0a00, -1.5px 1.5px 0 #1a0a00, 1.5px -1.5px 0 #1a0a00, -1.5px -1.5px 0 #1a0a00, 1.5px 0 0 #1a0a00, -1.5px 0 0 #1a0a00, 0 1.5px 0 #1a0a00, 0 -1.5px 0 #1a0a00',
                  letterSpacing: 0.5,
                  fontSize: 14,
                  fontWeight: 900,
                }}>
                  {t('history.noHistory')}
                </div>
              )}
              {historyData?.matches?.map(m => (
                <div key={m.id} style={{
                  background: `url('/assets/stats/rankings/frame_wood_7.png') no-repeat center center / 100% 100%`,
                  borderRadius: 12, padding: '12px 20px', marginBottom: 8,
                  minHeight: 72, display: 'flex', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
                          background: "url('/assets/pvp_1vs1_arena/frame_result.png') no-repeat center center / 100% 100%",
                          color: m.result === 'win' ? '#fff' : m.result === 'draw' ? '#94a3b8' : '#ef4444',
                          textAlign: 'center', minWidth: 70,
                          fontFamily: "'Fredoka One', 'Nunito', sans-serif",
                          textShadow: m.result === 'win' ? '1px 1px 0 #14532d' : 'none',
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
                  background: `url('/assets/stats/rankings/${idx === 0 ? 'frame_gold.png'
                    : idx === 1 ? 'frame_silver.png'
                      : idx === 2 ? 'frame_bronze.png'
                        : 'frame_wood_7.png'
                    }') no-repeat center center / 100% 100%`,
                  borderRadius: 12, padding: '12px 20px', marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 12,
                  minHeight: 72, // Optional: Ensure the frame is large enough
                }}>
                  {/* Rank */}
                  <div style={{
                    width: idx < 3 ? 36 : 32, height: idx < 3 ? 36 : 32, borderRadius: '50%', flexShrink: 0,
                    background: idx >= 3 ? '#1e3a5a' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700, color: '#fff',
                  }}>
                    {idx === 0 ? <img src="/assets/stats/rankings/gold_icon.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="1" /> :
                      idx === 1 ? <img src="/assets/stats/rankings/silver_icon.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="2" /> :
                        idx === 2 ? <img src="/assets/stats/rankings/bronze_icon.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="3" /> :
                          entry.rank}
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
                      <span style={{ color: '#4ade80' }}>{entry.wins}W</span>
                      <span> · </span>
                      <span style={{ color: '#f87171' }}>{entry.losses}L</span>
                      <span> · </span>
                      <span style={{ color: '#94a3b8' }}>{entry.draws}D</span>
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
    </div>
  );
}
