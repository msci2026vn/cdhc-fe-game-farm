export interface RoomInfo {
  roomId: string;
  roomCode: string;
  hostName: string;
  clients: number;
  maxClients: number;
  createdAt: string | null;
  isPublic?: boolean;
  spectatorCount?: number;
}

export interface LiveRoomInfo {
  roomId:         string;
  roomCode:       string;
  player1Name:    string;
  player2Name:    string;
  player1Id?:     string;
  player2Id?:     string;
  spectatorCount: number;
  startedAt:      string;
  phase:          string;
}
