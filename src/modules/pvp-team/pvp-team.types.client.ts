// Types cho frontend — mirror TeamRoomState từ Colyseus server

export type TeamId = 'team_a' | 'team_b';

export type RoomPhase =
  | 'waiting'
  | 'draft'
  | 'countdown'
  | 'playing'
  | 'sudden_death'
  | 'finished';

export interface ClientPlayerState {
  id: string;
  name: string;
  str: number;
  vit: number;
  wis: number;
  arm: number;
  mana: number;
  ready: boolean;
  team: TeamId;
  skillA: string | null;
  skillB: string | null;
  skillC: string | null;
}

export interface ClientTeamState {
  teamId: TeamId;
  teamHp: number;
  teamMaxHp: number;
  teamArmor: number;
  totalDamageDealt: number;
  totalHealDone: number;
}

export interface TeamRoomState {
  phase: RoomPhase;
  roomCode: string;
  timeLeft: number;
  draftTimeLeft: number;
  countdownLeft: number;
  isSuddenDeath: boolean;
  winnerId: string;
  players: Map<string, ClientPlayerState>;
  teamA: ClientTeamState;
  teamB: ClientTeamState;
}

// ─── Match Result (from server "game_over" message) ─────────

export interface TeamPlayerStat {
  userId: string;
  username: string;
  teamId: TeamId;
  damage: number;
  heal: number;
  skillCount: number;
}

export interface TeamMatchResult {
  winner: TeamId | 'draw';
  endedBy: 'hp_zero' | 'timeout' | 'surrender';
  teamAHpLeft: number;
  teamBHpLeft: number;
  teamAMaxHp: number;
  teamBMaxHp: number;
  durationSecs: number;
  mvpUserId: string | null;
  stats: TeamPlayerStat[];
}
