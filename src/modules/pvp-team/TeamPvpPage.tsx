// TeamPvpPage.tsx — Page wrapper: lobby → battle → result
// Route: /pvp-team

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Room } from '@colyseus/sdk';
import TeamLobby from './TeamLobby';
import TeamBattleScreen from './TeamBattleScreen';
import TeamResult from './TeamResult';
import type { TeamRoomState, TeamId, TeamMatchResult } from './pvp-team.types.client';

type Screen = 'lobby' | 'battle' | 'result';

export default TeamPvpPageWrapped;

function TeamPvpPage() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('lobby');
  const [battleRoom, setBattleRoom] = useState<Room<TeamRoomState> | null>(null);
  const [myTeam, setMyTeam] = useState<TeamId>('team_a');
  const [mySessionId, setMySessionId] = useState('');
  const [matchResult, setMatchResult] = useState<TeamMatchResult | null>(null);

  const handleBattleStart = useCallback(
    (room: Room<TeamRoomState>, team: TeamId) => {
      setBattleRoom(room);
      setMyTeam(team);
      setMySessionId(room.sessionId);
      setMatchResult(null);
      setScreen('battle');
    },
    [],
  );

  const handleMatchEnd = useCallback(
    (result: TeamMatchResult) => {
      setMatchResult(result);
      setScreen('result');
      // Leave room after capturing result
      battleRoom?.leave();
      setBattleRoom(null);
    },
    [battleRoom],
  );

  const handlePlayAgain = useCallback(() => {
    setMatchResult(null);
    setScreen('lobby');
  }, []);

  const handleExit = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // ─── Result screen ──────────────────────────────────────────
  if (screen === 'result' && matchResult) {
    return (
      <TeamResult
        result={matchResult}
        mySessionId={mySessionId}
        myTeam={myTeam}
        onPlayAgain={handlePlayAgain}
        onExit={handleExit}
      />
    );
  }

  // ─── Battle screen ──────────────────────────────────────────
  if (screen === 'battle' && battleRoom) {
    return (
      <TeamBattleScreen
        room={battleRoom}
        myTeam={myTeam}
        onMatchEnd={handleMatchEnd}
      />
    );
  }

  // ─── Lobby ──────────────────────────────────────────────────
  return <TeamLobby onBattleStart={handleBattleStart} />;
}

// ─── ErrorBoundary wrapper ──────────────────────────────────

class TeamPvpErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f1a',
          color: '#e0e0e0',
          padding: 32,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>Đã xảy ra lỗi</p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => { window.location.href = '/pvp'; }}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Quay lại PvP
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function TeamPvpPageWrapped() {
  return (
    <TeamPvpErrorBoundary>
      <TeamPvpPage />
    </TeamPvpErrorBoundary>
  );
}
