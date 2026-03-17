import { useState, useEffect } from 'react';
import type { Room } from '@colyseus/sdk';
import type { TeamRoomState, TeamId, ClientPlayerState } from './pvp-team.types.client';

interface DraftBuildInfo {
  userId: string;
  username: string;
  str: number;
  vit: number;
  wis: number;
  arm: number;
  mana: number;
}

interface TeamDraftPhaseProps {
  room: Room<TeamRoomState>;
  mySessionId: string;
  myTeam: TeamId;
}

function counterHint(b: DraftBuildInfo): string {
  if (b.str >= 20) return '⚠️ Carry mạnh — cần Tank/Heal';
  if (b.vit >= 20) return '⚠️ Tank cao — cần DPS cao';
  if (b.wis >= 15) return '⚠️ Support — cần cắt mana';
  return '';
}

function calcExpectedHp(builds: DraftBuildInfo[]): number {
  return builds.reduce((sum, b) => sum + 5000 + (b.vit ?? 6) * 200, 0);
}

export function TeamDraftPhase({ room, mySessionId, myTeam }: TeamDraftPhaseProps) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [teamABuilds, setTeamABuilds] = useState<DraftBuildInfo[]>([]);
  const [teamBBuilds, setTeamBBuilds] = useState<DraftBuildInfo[]>([]);

  // Sync state từ Colyseus
  useEffect(() => {
    const unsub = room.onStateChange((state: TeamRoomState) => {
      setTimeLeft(state.draftTimeLeft ?? 20);

      const a: DraftBuildInfo[] = [];
      const b: DraftBuildInfo[] = [];
      state.players.forEach((p: ClientPlayerState, _sid: string) => {
        const info: DraftBuildInfo = {
          userId: p.id,
          username: p.name,
          str: p.str,
          vit: p.vit,
          wis: p.wis,
          arm: p.arm,
          mana: p.mana,
        };
        if (p.team === 'team_a') a.push(info);
        else b.push(info);
      });
      setTeamABuilds(a);
      setTeamBBuilds(b);
    });
    return () => unsub();
  }, [room]);

  const oppBuilds = myTeam === 'team_a' ? teamBBuilds : teamABuilds;
  const myBuilds  = myTeam === 'team_a' ? teamABuilds : teamBBuilds;
  const myHpPool  = calcExpectedHp(myBuilds);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0f3460 100%)',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: '16px',
    }}>
      {/* Timer */}
      <div style={{
        textAlign: 'center',
        padding: '12px 24px',
        borderRadius: 12,
        background: timeLeft <= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.15)',
        border: `1px solid ${timeLeft <= 5 ? '#ef4444' : '#3b82f6'}`,
        marginBottom: 16,
        fontSize: 18,
        fontWeight: 700,
        color: timeLeft <= 5 ? '#ef4444' : '#93c5fd',
      }}>
        ⏱ {timeLeft}s — Xem build địch và điều chỉnh!
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {/* Build team địch */}
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, color: '#ef4444' }}>
            🔴 Build Team Địch
          </h3>
          {oppBuilds.length === 0 && (
            <div style={{ color: '#64748b', fontSize: 13 }}>Đang tải...</div>
          )}
          {oppBuilds.map((b, i) => (
            <div key={i} style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10,
              padding: '10px 12px',
              marginBottom: 8,
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                {b.username}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                <span>⚔️ {b.str}</span>
                <span>❤️ {b.vit}</span>
                <span>💜 {b.wis}</span>
                <span>🛡️ {b.arm}</span>
                <span>⭐ {b.mana}</span>
              </div>
              {counterHint(b) && (
                <div style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: '#fbbf24',
                  fontStyle: 'italic',
                }}>
                  {counterHint(b)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Build đội mình */}
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, color: '#3b82f6' }}>
            🔵 Build Đội Mình
          </h3>
          {myBuilds.length === 0 && (
            <div style={{ color: '#64748b', fontSize: 13 }}>Đang tải...</div>
          )}
          {myBuilds.map((b, i) => (
            <div key={i} style={{
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 10,
              padding: '10px 12px',
              marginBottom: 8,
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                {b.username}
                {b.userId === mySessionId ? ' (Bạn)' : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                <span>⚔️ {b.str}</span>
                <span>❤️ {b.vit}</span>
                <span>💜 {b.wis}</span>
                <span>🛡️ {b.arm}</span>
                <span>⭐ {b.mana}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HP Pool preview */}
      {myHpPool > 0 && (
        <div style={{
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: 10,
          padding: '10px 14px',
          marginTop: 8,
          fontSize: 13,
        }}>
          📊 HP Pool dự kiến đội mình:{' '}
          <strong style={{ color: '#22c55e' }}>{myHpPool.toLocaleString()}</strong>
        </div>
      )}

      <div style={{
        marginTop: 12,
        textAlign: 'center',
        color: '#64748b',
        fontSize: 12,
        fontStyle: 'italic',
      }}>
        💡 Còn {timeLeft}s để đổi build — vào /pvp/build nếu muốn thay đổi
      </div>
    </div>
  );
}
