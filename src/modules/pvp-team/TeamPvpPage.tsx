// TeamPvpPage.tsx — Page wrapper: lobby → battle → result
// Route: /pvp-team

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Room } from '@colyseus/sdk';
import TeamLobby from './TeamLobby';
import TeamBattleScreen from './TeamBattleScreen';
import TeamResult from './TeamResult';
import type { TeamRoomState, TeamId, TeamMatchResult } from './pvp-team.types.client';

type Screen = 'lobby' | 'battle' | 'result';

export default function TeamPvpPage() {
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
