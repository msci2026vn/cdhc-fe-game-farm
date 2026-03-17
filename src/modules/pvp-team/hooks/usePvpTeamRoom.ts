// usePvpTeamRoom.ts
// Colyseus state + message handling cho 3v3 team battle
// Pattern: reuse từ PvpTestScreen (matchedCells, spawningGems, skillCooldowns)

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Room } from '@colyseus/sdk';
import { tilesToGems } from '../../pvp/hooks/pvp-board.adapter';
import type { PvpGem } from '../../pvp/hooks/pvp-board.adapter';
import type { TeamRoomState, ClientPlayerState, TeamMatchResult } from '../pvp-team.types.client';

type SkillCd = { remaining: number; total: number };

export interface UsePvpTeamRoomResult {
  // Phase
  phase: string;
  timeLeft: number;
  isSuddenDeath: boolean;
  winnerId: string;
  // HP pools
  teamAHp: number;
  teamAMaxHp: number;
  teamBHp: number;
  teamBMaxHp: number;
  // My board
  myGems: PvpGem[];
  matchedCells: Set<number>;
  spawningGems: Set<number>;
  // My status
  myCurrentMana: number;
  myMaxMana: number;
  combo: number;
  showCombo: boolean;
  isStunned: boolean;
  otHiemActive: boolean;
  romBocActive: boolean;
  skillCooldowns: Record<string, SkillCd>;
  // All players
  allBoards: Record<string, number[]>;
  allPlayers: Record<string, ClientPlayerState>;
  notifications: string[];
  // Match result (set on game_over)
  matchResult: TeamMatchResult | null;
  // Actions
  sendSwap: (from: number, to: number) => void;
  sendSkill: (skillId: string) => void;
}

export function usePvpTeamRoom(
  room: Room<TeamRoomState> | null,
): UsePvpTeamRoomResult {
  const [phase, setPhase] = useState('waiting');
  const [timeLeft, setTimeLeft] = useState(120);
  const [isSuddenDeath, setIsSuddenDeath] = useState(false);
  const [winnerId, setWinnerId] = useState('');
  const [teamAHp, setTeamAHp] = useState(0);
  const [teamAMaxHp, setTeamAMaxHp] = useState(0);
  const [teamBHp, setTeamBHp] = useState(0);
  const [teamBMaxHp, setTeamBMaxHp] = useState(0);
  const [myTiles, setMyTiles] = useState<number[]>([]);
  const [matchedCells, setMatchedCells] = useState<Set<number>>(new Set());
  const [spawningGems, setSpawningGems] = useState<Set<number>>(new Set());
  const [myCurrentMana, setMyCurrentMana] = useState(0);
  const [myMaxMana, setMyMaxMana] = useState(100);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [isStunned, setIsStunned] = useState(false);
  const [otHiemActive, setOtHiemActive] = useState(false);
  const [romBocActive, setRomBocActive] = useState(false);
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, SkillCd>>({});
  const [allBoards, setAllBoards] = useState<Record<string, number[]>>({});
  const [allPlayers, setAllPlayers] = useState<Record<string, ClientPlayerState>>({});
  const [notifications, setNotifications] = useState<string[]>([]);
  const [matchResult, setMatchResult] = useState<TeamMatchResult | null>(null);

  const prevTilesRef = useRef<number[]>([]);
  const matchedTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const spawningTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const comboTimerRef = useRef<ReturnType<typeof setTimeout>>();
  // ref để tránh stale closure trong message handlers
  const playersRef = useRef<Record<string, ClientPlayerState>>({});

  const addNotification = useCallback((msg: string) => {
    setNotifications(prev => [msg, ...prev].slice(0, 5));
  }, []);

  // Skill cooldown tick — 100ms, giống PvpTestScreen
  useEffect(() => {
    const interval = setInterval(() => {
      setSkillCooldowns(prev => {
        const next = { ...prev };
        let changed = false;
        for (const [id, cd] of Object.entries(next)) {
          if (cd.remaining > 0) {
            next[id] = { ...cd, remaining: Math.max(0, cd.remaining - 100) };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!room) return;

    // ── State sync ──
    const unsubState = room.onStateChange((state: TeamRoomState) => {
      setPhase(state.phase);
      setTimeLeft(state.timeLeft ?? 120);
      setIsSuddenDeath(state.isSuddenDeath ?? false);
      setWinnerId(state.winnerId ?? '');
      setTeamAHp(state.teamA?.teamHp ?? 0);
      setTeamAMaxHp(state.teamA?.teamMaxHp ?? 0);
      setTeamBHp(state.teamB?.teamHp ?? 0);
      setTeamBMaxHp(state.teamB?.teamMaxHp ?? 0);

      const players: Record<string, ClientPlayerState> = {};
      state.players.forEach((p: ClientPlayerState, sid: string) => {
        players[sid] = p;
      });
      playersRef.current = players;
      setAllPlayers(players);

      const myPlayer = players[room.sessionId];
      if (myPlayer) {
        // maxMana = 100 + mana_stat × 20 (mirror STAT_DEFS formula)
        setMyMaxMana(100 + myPlayer.mana * 20);
      }
    });

    // ── game_start: nhận board ban đầu ──
    room.onMessage('game_start', (data: {
      myBoard?: number[];
      myMaxMana?: number;
    }) => {
      const tiles = data.myBoard ?? [];
      prevTilesRef.current = tiles;
      setMyTiles(tiles);
      setAllBoards(prev => ({ ...prev, [room.sessionId]: tiles }));
      if (data.myMaxMana) setMyMaxMana(data.myMaxMana);
      setMatchedCells(new Set());
      setSpawningGems(new Set());
      setCombo(0);
      setShowCombo(false);
      setSkillCooldowns({});
      setIsStunned(false);
      setOtHiemActive(false);
      setRomBocActive(false);
    });

    // ── board_init fallback ──
    room.onMessage('board_init', (data: { tiles: number[] }) => {
      const tiles = data.tiles ?? [];
      prevTilesRef.current = tiles;
      setMyTiles(tiles);
      setAllBoards(prev => ({ ...prev, [room.sessionId]: tiles }));
    });

    // ── board_update: swap result ──
    room.onMessage('board_update', (data: {
      tiles: number[];
      combo?: number;
      matched_cells?: number[];
      mana?: number;
    }) => {
      const tiles = data.tiles;
      const prevTiles = prevTilesRef.current;

      setMyTiles(tiles);
      setAllBoards(prev => ({ ...prev, [room.sessionId]: tiles }));
      if (data.mana !== undefined) setMyCurrentMana(data.mana);

      // Flash matched cells
      if (data.matched_cells?.length) {
        setMatchedCells(new Set(data.matched_cells));
        clearTimeout(matchedTimerRef.current);
        matchedTimerRef.current = setTimeout(() => setMatchedCells(new Set()), 350);
      }

      // Spawning animation — diff tiles để tìm cells mới
      if (prevTiles.length === 64) {
        const spawning = new Set<number>();
        tiles.forEach((t, i) => { if (prevTiles[i] !== t) spawning.add(i); });
        if (spawning.size > 0) {
          setSpawningGems(spawning);
          clearTimeout(spawningTimerRef.current);
          spawningTimerRef.current = setTimeout(() => setSpawningGems(new Set()), 400);
        }
      }
      prevTilesRef.current = tiles;

      // Combo display
      if (data.combo && data.combo > 0) {
        setCombo(data.combo);
        setShowCombo(true);
        clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => setShowCombo(false), 1500);
      }
    });

    // ── skill_used: update cooldown client-side ──
    room.onMessage('skill_used', (data: {
      skillId: string;
      isSelf: boolean;
      cooldownMs: number;
    }) => {
      if (data.isSelf) {
        setSkillCooldowns(prev => ({
          ...prev,
          [data.skillId]: { remaining: data.cooldownMs, total: data.cooldownMs },
        }));
      }
    });

    // ── mana update ──
    room.onMessage('mana_update', (data: { mana: number }) => {
      setMyCurrentMana(data.mana);
    });

    // ── debuff: freeze (stun), ot_hiem, rom_boc ──
    room.onMessage('debuff_apply', (data: { type: string; durationMs: number }) => {
      const ms = data.durationMs || 5000;
      if (data.type === 'freeze') {
        setIsStunned(true);
        setTimeout(() => setIsStunned(false), ms);
      }
      if (data.type === 'ot_hiem') {
        setOtHiemActive(true);
        setTimeout(() => setOtHiemActive(false), ms);
      }
      if (data.type === 'rom_boc') {
        setRomBocActive(true);
        setTimeout(() => setRomBocActive(false), ms);
      }
    });

    // ── Mini boards của đồng đội/địch ──
    room.onMessage('ally_board_update', (data: { sid: string; tiles: number[] }) => {
      setAllBoards(prev => ({ ...prev, [data.sid]: data.tiles }));
    });

    // ── Notifications ──
    room.onMessage('sudden_death_start', () => {
      addNotification('💀 SUDDEN DEATH! Damage ×1.5');
    });
    room.onMessage('team_skill_effect', (data: {
      casterSid: string;
      skillId: string;
      healAmt?: number;
    }) => {
      const p = playersRef.current[data.casterSid];
      const name = p?.name ?? 'Đồng đội';
      if (data.skillId === 'rom_boc') addNotification(`🛡️ ${name} kích hoạt Rơm Bọc!`);
      if (data.skillId === 'tai_sinh') addNotification(`💚 ${name} hồi ${data.healAmt ?? ''} HP!`);
    });
    room.onMessage('skill_junk',     () => addNotification('🧊 Bạn bị Mưa Đá!'));
    room.onMessage('skill_shuffle',  () => addNotification('🌀 Board bị Hỗn Loạn!'));
    room.onMessage('skill_mana_cut', (data: { manaCut: number }) =>
      addNotification(`🕳️ Mất ${data.manaCut} mana!`),
    );

    // ── game_over: full match result ──
    room.onMessage('game_over', (data: {
      winner: string;
      endedBy: string;
      teamAHpLeft: number;
      teamBHpLeft: number;
      teamAMaxHp: number;
      teamBMaxHp: number;
      mvpUserId: string | null;
      durationSecs: number;
      stats: Array<{ userId: string; teamId: string; damage: number; heal: number; skillCount: number }>;
    }) => {
      // Enrich stats with usernames from current players
      const players = playersRef.current;
      const enrichedStats = data.stats.map(s => {
        // Find player by userId (p.id matches s.userId)
        const entry = Object.values(players).find(p => p.id === s.userId);
        return {
          ...s,
          username: entry?.name ?? s.userId,
          teamId: s.teamId as 'team_a' | 'team_b',
        };
      });
      setMatchResult({
        winner: data.winner as 'team_a' | 'team_b' | 'draw',
        endedBy: data.endedBy as 'hp_zero' | 'timeout' | 'surrender',
        teamAHpLeft: data.teamAHpLeft,
        teamBHpLeft: data.teamBHpLeft,
        teamAMaxHp: data.teamAMaxHp,
        teamBMaxHp: data.teamBMaxHp,
        durationSecs: data.durationSecs,
        mvpUserId: data.mvpUserId,
        stats: enrichedStats,
      });
    });

    return () => {
      unsubState();
      clearTimeout(matchedTimerRef.current);
      clearTimeout(spawningTimerRef.current);
      clearTimeout(comboTimerRef.current);
    };
  }, [room, addNotification]);

  const myGems = useMemo(() => tilesToGems(myTiles), [myTiles]);

  const sendSwap = useCallback((from: number, to: number) => {
    room?.send('swap', { from, to });
  }, [room]);

  const sendSkill = useCallback((skillId: string) => {
    room?.send('use_skill', { skillId });
  }, [room]);

  return {
    phase, timeLeft, isSuddenDeath, winnerId,
    teamAHp, teamAMaxHp, teamBHp, teamBMaxHp,
    myGems, matchedCells, spawningGems,
    myCurrentMana, myMaxMana,
    combo, showCombo,
    isStunned, otHiemActive, romBocActive,
    skillCooldowns,
    allBoards, allPlayers,
    notifications,
    matchResult,
    sendSwap, sendSkill,
  };
}
