import { useEffect, useRef } from 'react';
import type { TeamId } from './pvp-team.types.client';

interface TeamBattleHUDProps {
  teamAHp: number;
  teamAMaxHp: number;
  teamBHp: number;
  teamBMaxHp: number;
  timeLeft: number;
  isSuddenDeath: boolean;
  myTeam: TeamId;
  notifications: string[];
}

function HpBar({
  hp, maxHp, label, color,
  flashRef,
}: {
  hp: number;
  maxHp: number;
  label: string;
  color: string;
  flashRef: React.RefObject<HTMLDivElement>;
}) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;
  const fillColor = pct > 50 ? '#4ade80' : pct > 25 ? '#facc15' : '#f87171';

  return (
    <div ref={flashRef} style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 10, color: '#94a3b8', marginBottom: 3,
      }}>
        <span>{label}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {hp.toLocaleString()}
        </span>
      </div>
      <div style={{
        height: 12,
        background: 'rgba(0,0,0,0.55)',
        borderRadius: 6,
        overflow: 'hidden',
        border: `1px solid ${color}`,
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: fillColor,
          borderRadius: 5,
          transition: 'width 0.3s ease',
          boxShadow: `0 0 6px ${fillColor}88`,
        }} />
      </div>
    </div>
  );
}

export function TeamBattleHUD({
  teamAHp, teamAMaxHp,
  teamBHp, teamBMaxHp,
  timeLeft, isSuddenDeath,
  myTeam, notifications,
}: TeamBattleHUDProps) {
  const hpARef = useRef<HTMLDivElement>(null);
  const hpBRef = useRef<HTMLDivElement>(null);
  const prevAHp = useRef(teamAHp);
  const prevBHp = useRef(teamBHp);

  // Flash animation khi HP giảm
  useEffect(() => {
    if (teamAHp < prevAHp.current && hpARef.current) {
      hpARef.current.style.outline = '2px solid #f87171';
      setTimeout(() => { if (hpARef.current) hpARef.current.style.outline = ''; }, 300);
    }
    prevAHp.current = teamAHp;
  }, [teamAHp]);

  useEffect(() => {
    if (teamBHp < prevBHp.current && hpBRef.current) {
      hpBRef.current.style.outline = '2px solid #f87171';
      setTimeout(() => { if (hpBRef.current) hpBRef.current.style.outline = ''; }, 300);
    }
    prevBHp.current = teamBHp;
  }, [teamBHp]);

  const timerUrgent = timeLeft <= 10;
  const timerWarning = !timerUrgent && timeLeft <= 30;
  const timerColor = isSuddenDeath ? '#a855f7'
    : timerUrgent ? '#f87171'
    : timerWarning ? '#facc15'
    : '#86efac';
  const timerBorder = isSuddenDeath ? 'rgba(168,85,247,0.45)'
    : timerUrgent ? 'rgba(248,113,113,0.5)'
    : 'rgba(34,197,94,0.35)';

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, '0');

  const myHp    = myTeam === 'team_a' ? teamAHp    : teamBHp;
  const myMaxHp = myTeam === 'team_a' ? teamAMaxHp : teamBMaxHp;
  const oppHp    = myTeam === 'team_a' ? teamBHp    : teamAHp;
  const oppMaxHp = myTeam === 'team_a' ? teamBMaxHp : teamAMaxHp;

  return (
    <div style={{
      position: 'relative',
      zIndex: 2,
      padding: '6px 10px 4px',
      flexShrink: 0,
    }}>
      {/* HP bars + timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <HpBar
          hp={myHp} maxHp={myMaxHp}
          label="🔵 Đội Mình"
          color="rgba(59,130,246,0.4)"
          flashRef={hpARef}
        />

        {/* Timer */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          background: 'rgba(0,0,0,0.6)',
          border: `1.5px solid ${timerBorder}`,
          borderRadius: 16,
          padding: '4px 10px',
          fontFamily: "'Cinzel', serif",
          fontSize: 14,
          fontWeight: 700,
          color: timerColor,
          animation: timerUrgent ? 'pvpTimerPulse 0.9s ease infinite' : undefined,
        }}>
          {isSuddenDeath && (
            <span style={{ fontSize: 7, color: '#a855f7', letterSpacing: 1, fontFamily: 'sans-serif' }}>
              ⚡SD
            </span>
          )}
          <span>{mins}:{secs}</span>
        </div>

        <HpBar
          hp={oppHp} maxHp={oppMaxHp}
          label="🔴 Đội Địch"
          color="rgba(239,68,68,0.4)"
          flashRef={hpBRef}
        />
      </div>

      {/* Notification feed */}
      {notifications.length > 0 && (
        <div style={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          {notifications.map((msg, i) => (
            <div
              key={i}
              style={{
                fontSize: 11,
                color: '#e2e8f0',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: 6,
                padding: '2px 8px',
                opacity: 1 - i * 0.2,
                transition: 'opacity 0.3s',
              }}
            >
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
