// TeamResult.tsx — Post-game result screen for 3v3 PvP
// Pattern: follows PostGameScreen.tsx (1v1) + inline styles matching dark theme

import { useState, useEffect } from 'react';
import type { TeamMatchResult, TeamId } from './pvp-team.types.client';

interface TeamResultProps {
  result: TeamMatchResult;
  mySessionId: string;
  myTeam: TeamId;
  onPlayAgain: () => void;
  onExit: () => void;
}

// ─── Sub-components ───────────────────────────────────────────

function ResultHero({ isWinner, isDraw, isMvp }: {
  isWinner: boolean; isDraw: boolean; isMvp: boolean;
}) {
  const icon = isDraw ? '🤝' : isWinner ? '🏆' : '💀';
  const text = isDraw ? 'HÒA' : isWinner ? 'CHIẾN THẮNG' : 'THẤT BẠI';
  const color = isDraw ? '#94a3b8' : isWinner ? '#f0c040' : '#6b6870';

  return (
    <div style={{ textAlign: 'center', padding: '24px 0 12px', position: 'relative' }}>
      <div style={{
        fontSize: 64,
        display: 'block',
        marginBottom: 6,
        animation: 'pgIconIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        {icon}
      </div>
      <div style={{
        fontFamily: "'Syne', -apple-system, sans-serif",
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        animation: 'pgTextUp 0.5s 0.2s ease both',
        color,
        textShadow: isWinner ? '0 0 30px rgba(240,192,64,0.5)' : 'none',
      }}>
        {text}
      </div>
      {isMvp && (
        <div style={{
          marginTop: 6,
          display: 'inline-block',
          background: 'linear-gradient(135deg,#f59e0b,#d97706)',
          color: '#000',
          fontSize: 13,
          fontWeight: 800,
          padding: '4px 14px',
          borderRadius: 20,
          letterSpacing: 1,
        }}>
          ⭐ MVP
        </div>
      )}
    </div>
  );
}

function EndedByBadge({ endedBy, durationSecs }: {
  endedBy: string; durationSecs: number;
}) {
  const label: Record<string, string> = {
    hp_zero: 'Hạ gục hoàn toàn',
    timeout: 'Hết giờ',
    surrender: 'Đối thủ bỏ cuộc',
  };
  const mins = Math.floor(durationSecs / 60);
  const secs = String(durationSecs % 60).padStart(2, '0');

  return (
    <div style={{
      textAlign: 'center',
      color: '#94a3b8',
      fontSize: 13,
      marginBottom: 12,
    }}>
      {label[endedBy] ?? endedBy} • {mins}:{secs}
    </div>
  );
}

function HpRemainingBar({ label, hp, maxHp, color }: {
  label: string; hp: number; maxHp: number; color: string;
}) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100))) : 0;
  const fillColor = pct > 50 ? '#4ade80' : pct > 25 ? '#facc15' : '#f87171';

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: '#94a3b8', marginBottom: 3,
      }}>
        <span>{label}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {hp.toLocaleString()} ({pct}%)
        </span>
      </div>
      <div style={{
        height: 10,
        background: 'rgba(0,0,0,0.55)',
        borderRadius: 5,
        overflow: 'hidden',
        border: `1px solid ${color}`,
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: fillColor,
          borderRadius: 4,
          transition: 'width 0.8s ease',
          boxShadow: `0 0 6px ${fillColor}88`,
        }} />
      </div>
    </div>
  );
}

function RankDelta({ delta, isMvp }: { delta: number; isMvp: boolean }) {
  const color = delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : '#94a3b8';
  const sign = delta > 0 ? '+' : '';

  return (
    <div style={{
      textAlign: 'center',
      fontSize: 18,
      fontWeight: 800,
      color,
      marginBottom: 14,
      fontFamily: "'Syne', -apple-system, sans-serif",
    }}>
      {sign}{delta} điểm rank
      {isMvp && delta > 0 && (
        <span style={{ fontSize: 12, color: '#f59e0b', marginLeft: 6 }}>
          (bao gồm +10 MVP)
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function TeamResult({
  result,
  mySessionId,
  myTeam,
  onPlayAgain,
  onExit,
}: TeamResultProps) {
  const [showStats, setShowStats] = useState(false);
  const [rankDelta, setRankDelta] = useState<number | null>(null);

  const isWinner = result.winner === myTeam;
  const isDraw = result.winner === 'draw';
  // MVP: match mvpUserId against stats (userId field) or sessionId
  const myStatEntry = result.stats.find(s =>
    s.userId === mySessionId || s.username === mySessionId,
  );
  const isMvp = result.mvpUserId !== null && (
    result.mvpUserId === mySessionId ||
    result.mvpUserId === myStatEntry?.userId
  );

  useEffect(() => {
    const delta = isDraw ? 0 : isWinner ? (isMvp ? 34 : 24) : -21;
    const t1 = setTimeout(() => setRankDelta(delta), 800);
    const t2 = setTimeout(() => setShowStats(true), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teamAStats = result.stats.filter(s => s.teamId === 'team_a');
  const teamBStats = result.stats.filter(s => s.teamId === 'team_b');
  const mvpPlayer = result.stats.find(s => s.userId === result.mvpUserId);

  const myStats = myTeam === 'team_a' ? teamAStats : teamBStats;
  const oppStats = myTeam === 'team_a' ? teamBStats : teamAStats;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0f3460 100%)',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      overflowY: 'auto',
      zIndex: 100,
    }}>
      {/* Inline keyframes */}
      <style>{`
        @keyframes pgIconIn {
          from { transform: scale(0) rotate(-30deg); opacity: 0; }
          to   { transform: scale(1) rotate(0deg);   opacity: 1; }
        }
        @keyframes pgTextUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes pgStatIn {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '12px 16px 80px',
      }}>
        {/* Result hero */}
        <ResultHero isWinner={isWinner} isDraw={isDraw} isMvp={isMvp} />

        {/* Ended by + duration */}
        <EndedByBadge endedBy={result.endedBy} durationSecs={result.durationSecs} />

        {/* Rank delta */}
        {rankDelta !== null && <RankDelta delta={rankDelta} isMvp={isMvp} />}

        {/* HP remaining */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 16,
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <HpRemainingBar
            label="🔵 Đội Mình"
            hp={myTeam === 'team_a' ? result.teamAHpLeft : result.teamBHpLeft}
            maxHp={myTeam === 'team_a' ? result.teamAMaxHp : result.teamBMaxHp}
            color="rgba(59,130,246,0.4)"
          />
          <HpRemainingBar
            label="🔴 Đội Địch"
            hp={myTeam === 'team_a' ? result.teamBHpLeft : result.teamAHpLeft}
            maxHp={myTeam === 'team_a' ? result.teamBMaxHp : result.teamAMaxHp}
            color="rgba(239,68,68,0.4)"
          />
        </div>

        {/* MVP spotlight */}
        {mvpPlayer && (
          <div style={{
            textAlign: 'center',
            padding: '10px 14px',
            marginBottom: 14,
            background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(217,119,6,0.08))',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>
              ⭐ MVP — {mvpPlayer.username}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              ⚔️ {mvpPlayer.damage.toLocaleString()} DMG
              &nbsp;•&nbsp;
              💚 {mvpPlayer.heal.toLocaleString()} Heal
              &nbsp;•&nbsp;
              ✨ {mvpPlayer.skillCount} Skills
            </div>
          </div>
        )}

        {/* Stats table */}
        {showStats && (
          <div style={{
            animation: 'pgStatIn 0.4s ease both',
            marginBottom: 16,
          }}>
            {/* My team */}
            <StatsTeamBlock
              label="🔵 Đội Mình"
              stats={myStats}
              mvpUserId={result.mvpUserId}
              mySessionId={mySessionId}
              color="#3b82f6"
            />

            {/* Opp team */}
            <StatsTeamBlock
              label="🔴 Đội Địch"
              stats={oppStats}
              mvpUserId={result.mvpUserId}
              mySessionId={mySessionId}
              color="#ef4444"
              style={{ marginTop: 10 }}
            />
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={onPlayAgain}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
              border: 'none',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔍 Trận Mới
          </button>
          <button
            onClick={onExit}
            style={{
              padding: '14px 20px',
              borderRadius: 12,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🚪 Thoát
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Block per Team ─────────────────────────────────────

interface StatsTeamBlockProps {
  label: string;
  stats: TeamMatchResult['stats'];
  mvpUserId: string | null;
  mySessionId: string;
  color: string;
  style?: React.CSSProperties;
}

function StatsTeamBlock({ label, stats, mvpUserId, mySessionId, color, style }: StatsTeamBlockProps) {
  const totalContrib = stats.reduce((sum, s) => sum + s.damage + s.heal, 0);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}33`,
      borderRadius: 12,
      padding: '10px 12px',
      ...style,
    }}>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color,
        marginBottom: 8,
      }}>
        {label}
      </div>

      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 65px 60px 42px 50px',
        gap: 4,
        fontSize: 10,
        color: '#64748b',
        paddingBottom: 4,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 4,
      }}>
        <span>Người chơi</span>
        <span style={{ textAlign: 'right' }}>⚔️ DMG</span>
        <span style={{ textAlign: 'right' }}>💚 Heal</span>
        <span style={{ textAlign: 'right' }}>✨</span>
        <span style={{ textAlign: 'right' }}>%</span>
      </div>

      {/* Player rows */}
      {stats.map(s => {
        const contrib = totalContrib > 0
          ? Math.round(((s.damage + s.heal) / totalContrib) * 100)
          : 0;
        const isMe = s.userId === mySessionId;
        const isMvp = s.userId === mvpUserId;

        return (
          <div
            key={s.userId}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 65px 60px 42px 50px',
              gap: 4,
              fontSize: 12,
              padding: '5px 2px',
              borderRadius: 6,
              background: isMe ? 'rgba(59,130,246,0.1)' : 'transparent',
              borderLeft: isMvp ? '3px solid #f59e0b' : '3px solid transparent',
            }}
          >
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: isMe ? 700 : 400,
            }}>
              {isMvp && '⭐ '}
              {s.username}
              {isMe && ' (Bạn)'}
            </span>
            <span style={{
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              color: '#fca5a5',
            }}>
              {s.damage.toLocaleString()}
            </span>
            <span style={{
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              color: '#86efac',
            }}>
              {s.heal.toLocaleString()}
            </span>
            <span style={{
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              color: '#c4b5fd',
            }}>
              {s.skillCount}
            </span>
            <span style={{
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
              color: '#e2e8f0',
            }}>
              {contrib}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
