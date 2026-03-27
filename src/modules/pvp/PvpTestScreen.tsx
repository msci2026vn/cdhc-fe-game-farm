import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { Client, type Room } from '@colyseus/sdk';
import { useAuth } from '@/shared/hooks/useAuth';
import { pvpApi, SKILL_GROUPS, SKILL_COOLDOWNS } from '@/shared/api/api-pvp';
import type { PvpRating } from '@/shared/api/api-pvp';
import { PvpSkillButton } from './components/PvpSkillButton';
import { PvpSkillOverlay, type ActiveEffect } from './components/PvpSkillOverlay';
import { socialApi } from '@/shared/api/api-social';
import PostGameScreen from './PostGameScreen';
import type { ClientMvpStats, H2HData } from './PostGameScreen';
import './pvp-battle.css';

const WS_URL = import.meta.env.VITE_PVP_WS_URL || (import.meta.env.DEV
  ? 'ws://localhost:3001'
  : 'wss://sta.cdhc.vn/pvp-ws');

const API_BASE = import.meta.env.VITE_API_URL || 'https://sta.cdhc.vn';

// Gem visual — aligned with campaign GEM_META (src/shared/match3/board.utils.ts)
// 0=atk(⚔️) 1=hp(💚) 2=def(🛡️) 3=star(⭐) 4=junk(🪨)
const GEM_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#6b7280'];
const GEM_LABELS = ['⚔️', '💚', '🛡️', '⭐', '🪨'];

interface PlayerInfo {
  id: string;
  name: string;
  ready: boolean;
  score?: number;
}

interface RoomStateBroadcast {
  phase: 'waiting' | 'ready' | 'playing' | 'sudden_death' | 'finished';
  roomCode: string;
  hostId: string;
  countdown: number;
  players: Record<string, PlayerInfo>;
  timeLeft?: number;
  lobbyTimeLeft?: number;
  winnerId?: string;
  spectatorCount?: number;
}

async function fetchPvpToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/pvp-token`, { credentials: 'include' });
  if (!res.ok) {
    if (res.status === 401) throw new Error(i18n.t('pvp:error.notLoggedIn'));
    throw new Error(i18n.t('pvp:error.tokenFailed', { status: res.status }));
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'pvp-token error');
  return json.data.token;
}

// ─── Interactive Board — CampaignMatch3Board ───────────────────────────────────
// import { useCanvasBoard } from './hooks/useCanvasBoard';  // kept for rollback
import CampaignMatch3Board from '@/modules/campaign/components/CampaignMatch3Board';
import { tilesToGems, PVP_GEM_META } from './hooks/pvp-board.adapter';
import { usePvpBoardInput } from './hooks/usePvpBoardInput';

// Mini board — opponent compact view (kept as-is, CSS-based)
interface MiniBoardProps { tiles: number[]; }
function MiniBoard({ tiles }: MiniBoardProps) {
  if (!tiles.length) return null;
  return (
    <div className="pvp-mini-board">
      {tiles.map((gem, idx) => (
        <div key={idx} className={`pvp-mini-gem ${gem === -1 ? 'pvp-mini-gem--empty' : `pvp-mini-gem--${gem}`}`} />
      ))}
    </div>
  );
}

// ─── Countdown overlay ─────────────────────────────────────────────────────────
function CountdownOverlay({ count }: { count: number }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
    }}>
      <div key={count} style={{
        fontSize: 120, fontWeight: 900, color: '#e94560',
        animation: 'cdPop 0.85s ease-out forwards',
        textShadow: '0 0 40px #e9456088',
      }}>
        {count}
      </div>
      <style>{`
        @keyframes cdPop {
          0%   { transform: scale(2.2); opacity: 1; }
          100% { transform: scale(0.7); opacity: 0; }
        }
        @keyframes comboFlash {
          0%   { transform: translateX(-50%) scale(0.5); opacity: 0; }
          20%  { transform: translateX(-50%) scale(1.1); opacity: 1; }
          80%  { transform: translateX(-50%) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── HP Bar — aligned with campaign PlayerHPBar ────────────────────────────────
function HpBar({ current, max, armor, color = '#22c55e', label }: {
  current: number; max: number; armor: number;
  color?: string; label: string;
}) {
  const hpPct = Math.max(0, (current / max) * 100);
  const armorPct = Math.min(100, (armor / max) * 100);
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
        <span>{label}</span>
        <span style={{ color: current < max * 0.3 ? '#ef4444' : 'white' }}>
          {current}/{max}{armor > 0 ? ` 🛡️${armor}` : ''}
        </span>
      </div>
      <div style={{ height: 10, background: '#1f2937', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${hpPct}%`, height: '100%',
          background: current < max * 0.3 ? '#ef4444' : color,
          transition: 'width 0.3s',
        }} />
        {armor > 0 && (
          <div style={{
            position: 'absolute', right: 0, top: 0,
            width: `${armorPct}%`, height: '100%',
            background: '#3b82f6', opacity: 0.6,
          }} />
        )}
      </div>
    </div>
  );
}

// ─── Mana Bar with skill cost markers ────────────────────────────────────────
function ManaBar({ current, max, markers }: {
  current: number; max: number;
  markers?: Array<{ icon: string; cost: number }>;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
        <span>⭐ Mana</span><span>{current}/{max}</span>
      </div>
      <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${Math.min(100, (current / max) * 100)}%`, height: '100%',
          background: '#eab308', transition: 'width 0.3s',
        }} />
        {/* Skill cost threshold markers */}
        {markers?.map((m, i) => {
          const pct = (m.cost / max) * 100;
          if (pct > 100) return null;
          return (
            <div key={i} style={{
              position: 'absolute', top: -10, left: `${pct}%`,
              transform: 'translateX(-50%)',
              fontSize: 8, lineHeight: 1, pointerEvents: 'none',
              opacity: current >= m.cost ? 1 : 0.4,
            }}>
              {m.icon}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function PvpTestScreen() {
  const { data: auth } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('pvp');
  const [searchParams] = useSearchParams();
  const fromQueue = searchParams.get('fromQueue') === '1';
  const urlRoomCode = searchParams.get('roomId') || searchParams.get('room') || '';
  const clientRef = useRef<Client | null>(null);
  const roomRef = useRef<Room | null>(null);
  const autoJoinedRef = useRef(false);
  const myUserIdRef = useRef('');

  const [inRoom, setInRoom] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [challengeSearching, setChallengeSearching] = useState(false);
  const [inputCode, setInputCode] = useState(() => searchParams.get('roomId') || searchParams.get('room') || '');
  const [roomState, setRoomState] = useState<RoomStateBroadcast | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [mySessionId, setMySessionId] = useState('');
  const [myReady, setMyReady] = useState(false);
  const [myBoard, setMyBoard] = useState<number[]>([]);
  const [opponentBoard, setOpponentBoard] = useState<number[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [comboText, setComboText] = useState('');
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [lobbyTimeLeft, setLobbyTimeLeft] = useState(900);
  const [isSuddenDeath, setIsSuddenDeath] = useState(false);
  const [winnerId, setWinnerId] = useState('');
  const [winnerSessionId, setWinnerSessionId] = useState('');
  const [gameOverPlayers, setGameOverPlayers] = useState<Array<{ userId: string; name: string; score: number }>>([]);
  const [junkAlert, setJunkAlert] = useState('');
  // Combat stats — aligned with campaign BossState
  const [myHp, setMyHp] = useState(5000);
  const [myMaxHp, setMyMaxHp] = useState(5000);
  const [myArmor, setMyArmor] = useState(0);
  const [myMana, setMyMana] = useState(0);
  const [opponentHp, setOpponentHp] = useState(5000);
  const [opponentMaxHp, setOpponentMaxHp] = useState(5000);
  const [opponentArmor, setOpponentArmor] = useState(0);
  const [opponentMana, setOpponentMana] = useState(0);
  const [opponentMaxMana, setOpponentMaxMana] = useState(100);
  const [myMaxMana, setMyMaxMana] = useState(100);
  const [myBuild, setMyBuild] = useState<{
    str: number; vit: number; wis: number; arm: number; mana: number;
    skillA: string; skillB: string; skillC: string;
  } | null>(null);
  const [damageFlash, setDamageFlash] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState('');
  // ── Emoji Taunt + Tilted System ──
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string }>>([]);
  const [emojiCooldown, setEmojiCooldown] = useState(false);
  const [activeDebuff, setActiveDebuff] = useState<{ type: string; until: number } | null>(null);
  const [scoreAlert, setScoreAlert] = useState<{ text: string; color: string } | null>(null);
  const [isDangerZone, setIsDangerZone] = useState(false);
  const [comboBlast, setComboBlast] = useState<{ combo: number; id: number } | null>(null);

  // ── Skill state ──
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, { remaining: number; total: number }>>({});
  const [opponentSkillFlash, setOpponentSkillFlash] = useState<string | null>(null);

  // ── Avatar state ──
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [opponentAvatar, setOpponentAvatar] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>('');
  const [opponentName, setOpponentName] = useState<string>('');

  // ── Opponent board reveal (Thiên Nhãn) ──
  const [opponentBoardRevealed, setOpponentBoardRevealed] = useState(false);

  // ── Opponent skill notification (big banner) ──
  const [opponentSkillNotif, setOpponentSkillNotif] = useState<{
    icon: string;
    name: string;
    target: string;
  } | null>(null);

  // ── Skill effect overlays ──
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [boardShake, setBoardShake] = useState(false);

  // ── Spectator mode ──
  const isSpectator = searchParams.get('mode') === 'spectator';
  const [spectatorCount, setSpectatorCount] = useState<number>(0);

  // ── Build reveal (PostGame) ──
  const [gameBuilds, setGameBuilds] = useState<Record<string, {
    str: number; vit: number; wis: number; arm: number; mana: number;
    skillA: string; skillB: string; skillC: string;
  }> | null>(null);

  // ── Board flash effects ──
  const [matchedCells, setMatchedCells] = useState<Set<number>>(new Set());
  const [spawningGems, setSpawningGems] = useState<Set<number>>(new Set());
  const myBoardRef = useRef<number[]>([]);
  const matchedTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const spawningTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const comboTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [pvpCombo, setPvpCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  // ── Post-game data ──
  const EMPTY_STATS: ClientMvpStats = {
    highestCombo: 0, fastestSwapMs: 9999,
    debuffSent: 0, debuffReceived: 0,
    tauntsTotal: 0, validSwaps: 0, totalSwaps: 0,
    dmgDealt: 0, dmgReceived: 0, armorAbsorbed: 0,
    hpHealed: 0, junkSent: 0, junkReceived: 0,
    skillsUsed: 0, opponentSkillsUsed: 0,
  };
  const [myStats, setMyStats] = useState<ClientMvpStats>({ ...EMPTY_STATS });
  const [opponentStats, setOpponentStats] = useState<ClientMvpStats | null>(null);
  const statsRef = useRef<ClientMvpStats>({ ...EMPTY_STATS });
  const myHpStatsRef = useRef(0);
  const lastSwapAtRef = useRef(0);
  const gameStartAtRef = useRef(0);
  const [gameDurationMs, setGameDurationMs] = useState(0);
  const [ratingBefore, setRatingBefore] = useState(1000);
  const [ratingAfter, setRatingAfter] = useState<PvpRating | null>(null);
  const [h2hData, setH2hData] = useState<H2HData>(null);
  const [rematchState, setRematchState] = useState<'idle' | 'waiting' | 'ready'>('idle');
  const [postGameCountdown, setPostGameCountdown] = useState(10);

  // ── Invite link state ──
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteExpiry, setInviteExpiry] = useState<number | null>(null);
  const [inviteToast, setInviteToast] = useState('');
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [friendList, setFriendList] = useState<Array<{ id: string; name: string; avatar: string | null; level: number }>>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [sendingInviteTo, setSendingInviteTo] = useState<string | null>(null);

  // ── On-chain proof ──
  const [matchId, setMatchId] = useState<string | null>(null);
  const [proofData, setProofData] = useState<{
    merkleRoot: string | null;
    ipfsHash: string | null;
    txHash: string | null;
    moveCount: number | null;
  }>({ merkleRoot: null, ipfsHash: null, txHash: null, moveCount: null });
  const proofPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync userId ref for post-game API calls
  useEffect(() => {
    if (auth?.user?.id) myUserIdRef.current = auth.user.id;
  }, [auth?.user?.id]);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  }, []);

  useEffect(() => {
    clientRef.current = new Client(WS_URL);
    addLog(`Client → ${WS_URL}`);
    return () => { roomRef.current?.leave(); };
  }, [addLog]);

  useEffect(() => {
    return () => { if (proofPollRef.current) clearInterval(proofPollRef.current); };
  }, []);

  // ── Local Timer Tick for Smooth Countdown ──
  useEffect(() => {
    const timer = setInterval(() => {
      if (roomState?.phase === 'waiting' || roomState?.phase === 'ready') {
        setLobbyTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (roomState?.phase === 'playing' || roomState?.phase === 'sudden_death') {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [roomState?.phase]);

  // ── Swap handler ──
  const handleSwap = useCallback((from: number, to: number) => {
    if (!roomRef.current) return;
    statsRef.current.totalSwaps++;
    roomRef.current.send('swap', { from, to });
  }, []);

  // ── PVP Board input (CampaignMatch3Board gesture wrapper) ──
  // disabled prop is passed as ref-based value; actual phase check happens at render
  const {
    selected: boardSelected,
    animating: boardAnimating,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = usePvpBoardInput({
    onSwap: handleSwap,   // hook internally triggers animating after each swap
    disabled: (roomState?.phase !== 'playing' && roomState?.phase !== 'sudden_death') || (roomState?.timeLeft ?? 90) <= 0,
  });

  // Stable gem array — recomputed only when board tiles change
  const myGems = useMemo(() => tilesToGems(myBoard), [myBoard]);

  // ── Skill info from build ──
  const mySkills = useMemo(() => {
    if (!myBuild) return [];
    const skills: Array<{ id: string; icon: string; name: string; manaCost: number; cooldownMs: number }> = [];
    const groups = ['A', 'B', 'C'] as const;
    const buildKeys = ['skillA', 'skillB', 'skillC'] as const;
    for (let i = 0; i < 3; i++) {
      const skillId = myBuild[buildKeys[i]];
      if (!skillId) continue;
      const group = SKILL_GROUPS[groups[i]];
      const def = group.find((s) => s.id === skillId);
      if (def) {
        skills.push({
          id: skillId,
          icon: def.icon,
          name: def.name,
          manaCost: def.manaCost,
          cooldownMs: SKILL_COOLDOWNS[skillId] || 20000,
        });
      }
    }
    return skills;
  }, [myBuild]);

  // ── Skill cooldown timer (100ms tick) ──
  useEffect(() => {
    const interval = setInterval(() => {
      setSkillCooldowns(prev => {
        const next = { ...prev };
        let changed = false;
        for (const [skillId, cd] of Object.entries(next)) {
          if (cd.remaining > 0) {
            next[skillId] = { ...cd, remaining: Math.max(0, cd.remaining - 100) };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // ── Cast skill ──
  const handleCastSkill = useCallback((skillId: string) => {
    if (!roomRef.current) return;
    roomRef.current.send('use_skill', { skillId });
  }, []);

  // ── Add skill effect with auto-remove ──
  const addEffect = useCallback((effect: Omit<ActiveEffect, 'id' | 'startedAt'>) => {
    const id = `${effect.type}_${Date.now()}`;
    const full: ActiveEffect = { ...effect, id, startedAt: Date.now() };
    setActiveEffects(prev => [...prev, full]);
    const removeAfter = effect.durationMs || 2000;
    setTimeout(() => {
      setActiveEffects(prev => prev.filter(e => e.id !== id));
    }, removeAfter);
  }, []);

  // ── Taunt handler ──
  const sendTaunt = useCallback((emoji: string) => {
    if (!roomRef.current || emojiCooldown) return;
    statsRef.current.tauntsTotal++;
    roomRef.current.send('taunt', { emoji });
    setEmojiCooldown(true);
    setTimeout(() => setEmojiCooldown(false), 5000);
  }, [emojiCooldown]);

  const attachHandlers = useCallback((r: Room) => {
    roomRef.current = r;

    r.onMessage('room_info', (data: {
      roomId: string; roomCode: string; isHost: boolean; mySessionId: string; myOrder: 1 | 2;
    }) => {
      setRoomId(data.roomId);
      setRoomCode(data.roomCode || data.roomId);
      setIsHost(data.isHost);
      setMySessionId(data.mySessionId);
      addLog(`Vào phòng | id: ${data.roomId} | host: ${data.isHost}`);
    });

    r.onMessage('rematch_request', (_data: { fromId: string }) => {
      setRematchState('ready');
    });

    r.onMessage('rematch_start', (data: { roomId: string }) => {
      if (data.roomId) navigate(`/pvp-test?roomId=${data.roomId}`);
    });

    // ── Room reset — quay về phòng chờ trong cùng room ──
    r.onMessage('room_reset', () => {
      setMyReady(false);
      setRematchState('idle');
      setWinnerId('');
      setWinnerSessionId('');
      setGameOverPlayers([]);
      setGameBuilds(null);
      setMatchId(null);
      setProofData({ merkleRoot: null, ipfsHash: null, txHash: null, moveCount: null });
      if (proofPollRef.current) { clearInterval(proofPollRef.current); proofPollRef.current = null; }
      setPostGameCountdown(10);
      setOpponentStats(null);
      setMyMana(0);
      setMyArmor(0);
      setOpponentMana(0);
      setOpponentArmor(0);
      setSkillCooldowns({});
      setActiveEffects([]);
      setBoardShake(false);
      setOpponentBoardRevealed(false);
      setOpponentSkillFlash(null);
      setOpponentSkillNotif(null);
      addLog('↩️ Quay về phòng chờ — Bấm Sẵn Sàng để chơi lại!');
    });

    r.onMessage('host_changed', (data: { newHostId: string; newHostName: string }) => {
      setIsHost(data.newHostId === r.sessionId);
      addLog(`👑 Host mới: ${data.newHostName}`);
    });

    r.onMessage('you_are_host', () => {
      setIsHost(true);
      addLog('👑 Bạn là Host mới');
    });

    r.onMessage('player_left', (data: { sessionId: string; name: string }) => {
      addLog(`🚪 ${data.name} đã rời phòng`);
    });

    r.onMessage('state_update', (data: RoomStateBroadcast) => {
      setRoomState(data);
      setOpponentLeft(false);
      if (data.timeLeft !== undefined) setTimeLeft(data.timeLeft);
      if (data.lobbyTimeLeft !== undefined) setLobbyTimeLeft(data.lobbyTimeLeft);
      if (data.spectatorCount !== undefined) setSpectatorCount(data.spectatorCount);
      const names = Object.values(data.players).map(p => p.name).join(', ');
      addLog(`State: [${data.phase}] cd:${data.countdown} t:${data.timeLeft ?? '-'}s | ${names || '(trống)'}`);
    });

    r.onMessage('role_assigned', (data: { role: string }) => {
      console.log('[PvpTestScreen] role assigned:', data.role);
    });

    r.onMessage('spectator_update', (data: { spectatorCount: number }) => {
      setSpectatorCount(data.spectatorCount);
    });

    r.onMessage('lobby_warning', (data: { secondsLeft: number }) => {
      const msg = data.secondsLeft === 60 ? t('game.lobbyWarning1min') : t('game.lobbyWarning5min');
      setJunkAlert(msg);
      setTimeout(() => setJunkAlert(''), 4000);
    });

    r.onMessage('lobby_timeout', () => {
      addLog('⚠️ Phòng đã đóng do chờ quá lâu');
      navigate('/pvp');
    });

    r.onMessage('game_start', (data: {
      myBoard: number[]; opponentBoard: number[];
      myMaxHp?: number; opponentMaxHp?: number;
      myMaxMana?: number; opponentMaxMana?: number;
      myBuild?: { str: number; vit: number; wis: number; arm: number; mana: number; skillA: string; skillB: string; skillC: string };
      myName?: string; opponentName?: string;
      myAvatar?: string | null; opponentAvatar?: string | null;
    }) => {
      myBoardRef.current = data.myBoard;
      setMyBoard(data.myBoard);
      setOpponentBoard(data.opponentBoard);
      setMyScore(0);
      setOpponentScore(0);
      setComboText('');
      setTimeLeft(90);
      setIsSuddenDeath(false);
      setWinnerId('');
      setWinnerSessionId('');
      setGameOverPlayers([]);
      setJunkAlert('');
      // Reset combat stats — use server-sent maxHp/maxMana from build
      const serverMaxHp = data.myMaxHp ?? 5000;
      const serverOpMaxHp = data.opponentMaxHp ?? 5000;
      const serverMaxMana = data.myMaxMana ?? 100;
      const serverOpMaxMana = data.opponentMaxMana ?? 100;
      setMyMaxHp(serverMaxHp);
      setOpponentMaxHp(serverOpMaxHp);
      setMyMaxMana(serverMaxMana);
      setOpponentMaxMana(serverOpMaxMana);
      setMyHp(serverMaxHp);
      setMyArmor(0);
      setMyMana(0);
      setOpponentHp(serverOpMaxHp);
      setOpponentArmor(0);
      setOpponentMana(0);
      if (data.myBuild) setMyBuild(data.myBuild);
      // Reset taunt/debuff state
      setFloatingEmojis([]);
      setActiveDebuff(null);
      setScoreAlert(null);
      setIsDangerZone(false);
      setComboBlast(null);
      // Reset skill state
      setSkillCooldowns({});
      setOpponentSkillFlash(null);
      setActiveEffects([]);
      setBoardShake(false);
      setGameBuilds(null);
      // Avatar + name from server
      setMyAvatar(data.myAvatar || null);
      setOpponentAvatar(data.opponentAvatar || null);
      if (data.myName) setMyName(data.myName);
      if (data.opponentName) setOpponentName(data.opponentName);
      // Reset opponent board reveal
      setOpponentBoardRevealed(false);
      setOpponentSkillNotif(null);
      // Reset board flash effects
      setMatchedCells(new Set());
      setSpawningGems(new Set());
      setPvpCombo(0);
      setShowCombo(false);
      // Reset post-game tracking
      const freshStats: ClientMvpStats = {
        highestCombo: 0, fastestSwapMs: 9999,
        debuffSent: 0, debuffReceived: 0,
        tauntsTotal: 0, validSwaps: 0, totalSwaps: 0,
        dmgDealt: 0, dmgReceived: 0, armorAbsorbed: 0,
        hpHealed: 0, junkSent: 0, junkReceived: 0,
        skillsUsed: 0, opponentSkillsUsed: 0,
      };
      statsRef.current = freshStats;
      setMyStats(freshStats);
      setOpponentStats(null);
      myHpStatsRef.current = serverMaxHp;
      lastSwapAtRef.current = 0;
      gameStartAtRef.current = Date.now();
      setRatingAfter(null);
      setH2hData(null);
      setRematchState('idle');
      // Capture rating before game
      pvpApi.getRating().then(r => setRatingBefore(r.rating)).catch(() => { });
      addLog('Board nhận thành công → Game bắt đầu!');
    });

    r.onMessage('board_update', (data: {
      tiles: number[]; score: number; combo: number; gained: number;
      matched_cells?: number[];
      junkReceived?: number; hp?: number; armor?: number; mana?: number;
      damageDealt?: number;
      effects?: { atk: number; hp: number; def: number; star: number };
      junkSent?: number;
    }) => {
      // Save prev board BEFORE updating ref (for spawn diff)
      const prevTiles = myBoardRef.current;
      myBoardRef.current = data.tiles;
      setMyBoard(data.tiles);
      setMyScore(data.score);
      if (data.hp !== undefined) {
        if (data.hp > myHpStatsRef.current) {
          statsRef.current.hpHealed += data.hp - myHpStatsRef.current;
        }
        myHpStatsRef.current = data.hp;
        setMyHp(data.hp);
      }
      if (data.armor !== undefined) setMyArmor(data.armor);
      if (data.mana !== undefined) setMyMana(data.mana);
      // Track combat stats
      if (data.damageDealt && data.damageDealt > 0) statsRef.current.dmgDealt += data.damageDealt;
      if (data.junkSent && data.junkSent > 0) statsRef.current.junkSent += data.junkSent;
      if (data.junkReceived && data.junkReceived > 0) statsRef.current.junkReceived += data.junkReceived;
      // Track valid swap + fastest swap
      statsRef.current.validSwaps++;
      const now = Date.now();
      if (lastSwapAtRef.current > 0) {
        const ms = now - lastSwapAtRef.current;
        if (ms < statsRef.current.fastestSwapMs) statsRef.current.fastestSwapMs = ms;
      }
      lastSwapAtRef.current = now;

      // Flash matched cells (clear old timeout to prevent early clear on rapid updates)
      if (data.matched_cells?.length) {
        setMatchedCells(new Set(data.matched_cells));
        clearTimeout(matchedTimerRef.current);
        matchedTimerRef.current = setTimeout(() => setMatchedCells(new Set()), 350);
      }

      // Spawn animation — diff old vs new board to find cells that changed
      if (prevTiles.length === 64) {
        const spawning = new Set<number>();
        data.tiles.forEach((tile: number, i: number) => {
          if (prevTiles[i] !== tile) spawning.add(i);
        });
        if (spawning.size > 0) {
          setSpawningGems(spawning);
          clearTimeout(spawningTimerRef.current);
          spawningTimerRef.current = setTimeout(() => setSpawningGems(new Set()), 400);
        }
      }

      // Combo state for CampaignMatch3Board overlay
      if (data.combo > 0) {
        setPvpCombo(data.combo);
        setShowCombo(true);
        clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => setShowCombo(false), 1500);
      }

      // Effect log
      const parts: string[] = [];
      if (data.effects?.atk && data.effects.atk > 0) parts.push(`⚔️×${data.effects.atk}`);
      if (data.effects?.hp && data.effects.hp > 0) parts.push(`💚×${data.effects.hp}`);
      if (data.effects?.def && data.effects.def > 0) parts.push(`🛡️×${data.effects.def}`);
      if (data.effects?.star && data.effects.star > 0) parts.push(`⭐×${data.effects.star}`);
      const effectStr = parts.join(' ');

      if (data.combo > 1) {
        setComboText(`COMBO x${data.combo}! ${effectStr}`);
        setTimeout(() => setComboText(''), 1500);
      }
      if (data.junkReceived && data.junkReceived > 0) {
        setJunkAlert(`+${data.junkReceived} JUNK!`);
        setTimeout(() => setJunkAlert(''), 1500);
      }
      addLog(`Score: ${data.score} DMG:${data.damageDealt ?? 0} ${effectStr}${data.combo > 1 ? ` COMBO×${data.combo}` : ''}${data.junkReceived ? ` JUNK:${data.junkReceived}` : ''}`);
    });

    r.onMessage('opponent_update', (data: {
      tiles?: number[]; score?: number;
      opponentHp?: number; opponentMaxHp?: number; opponentArmor?: number; opponentMana?: number; opponentScore?: number;
      myHp?: number; myMaxHp?: number; myArmor?: number; myMana?: number;
    }) => {
      if (data.tiles) setOpponentBoard(data.tiles);
      if (data.score !== undefined) setOpponentScore(data.score);
      if (data.opponentScore !== undefined) setOpponentScore(data.opponentScore);
      if (data.opponentHp !== undefined) setOpponentHp(data.opponentHp);
      if (data.opponentMaxHp !== undefined) setOpponentMaxHp(data.opponentMaxHp);
      if (data.opponentArmor !== undefined) setOpponentArmor(data.opponentArmor);
      if (data.opponentMana !== undefined) setOpponentMana(data.opponentMana);
      // Update own stats (may have taken damage from opponent)
      if (data.myHp !== undefined) { myHpStatsRef.current = data.myHp; setMyHp(data.myHp); }
      if (data.myMaxHp !== undefined) setMyMaxHp(data.myMaxHp);
      if (data.myArmor !== undefined) setMyArmor(data.myArmor);
      if (data.myMana !== undefined) setMyMana(data.myMana);
    });

    // combat_hit — mình bị đánh
    r.onMessage('combat_hit', (data: {
      damage: number; absorbed: number; remainingHp: number; remainingArmor: number;
    }) => {
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 300);
      myHpStatsRef.current = data.remainingHp;
      setMyHp(data.remainingHp);
      setMyArmor(data.remainingArmor);
      statsRef.current.dmgReceived += data.damage;
      statsRef.current.armorAbsorbed += data.absorbed;
      addLog(`💥 Nhận ${data.damage} damage${data.absorbed > 0 ? ` (🛡️${data.absorbed} absorbed)` : ''}! HP: ${data.remainingHp}`);
    });

    r.onMessage('game_over', (data: {
      winnerId: string; winnerSessionId: string;
      players: Array<{ userId: string; name: string; score: number; hp?: number }>;
      isSuddenDeath: boolean;
      builds?: Record<string, { str: number; vit: number; wis: number; arm: number; mana: number; skillA: string; skillB: string; skillC: string }>;
      battleStats?: Record<string, {
        dmgDealt: number; dmgReceived: number; armorAbsorbed: number;
        hpHealed: number; junkSent: number; skillsUsed: number;
        highestCombo: number; fastestSwapMs: number;
        totalSwaps: number; validSwaps: number;
        debuffSent: number; debuffReceived: number; tauntsTotal: number;
      }>;
    }) => {
      setWinnerId(data.winnerId);
      setWinnerSessionId(data.winnerSessionId);
      if (data.builds) setGameBuilds(data.builds);
      setGameOverPlayers(data.players);
      setIsSuddenDeath(data.isSuddenDeath);
      const iWon = data.winnerSessionId === mySessionId;
      const isDr = data.winnerId === 'draw';
      // Snapshot local stats as base
      const snap = { ...statsRef.current };
      setMyStats(snap);
      // Merge server battleStats (authoritative) over local snapshot
      if (data.battleStats) {
        const myId = r.sessionId;
        const serverMy = data.battleStats[myId];
        const serverOppEntry = Object.entries(data.battleStats).find(([sid]) => sid !== myId);
        const serverOpp = serverOppEntry?.[1];
        if (serverMy) {
          setMyStats({
            ...snap,
            dmgDealt: serverMy.dmgDealt ?? snap.dmgDealt,
            dmgReceived: serverMy.dmgReceived ?? snap.dmgReceived,
            armorAbsorbed: serverMy.armorAbsorbed ?? snap.armorAbsorbed,
            hpHealed: serverMy.hpHealed ?? snap.hpHealed,
            junkSent: serverMy.junkSent ?? snap.junkSent,
            skillsUsed: serverMy.skillsUsed ?? snap.skillsUsed,
            highestCombo: serverMy.highestCombo ?? snap.highestCombo,
            fastestSwapMs: serverMy.fastestSwapMs > 0 ? serverMy.fastestSwapMs : snap.fastestSwapMs,
            totalSwaps: serverMy.totalSwaps ?? snap.totalSwaps,
          });
        }
        if (serverOpp) {
          setOpponentStats({
            highestCombo: serverOpp.highestCombo ?? 0,
            fastestSwapMs: serverOpp.fastestSwapMs > 0 ? serverOpp.fastestSwapMs : 9999,
            debuffSent: serverOpp.debuffSent ?? 0,
            debuffReceived: serverOpp.debuffReceived ?? 0,
            tauntsTotal: serverOpp.tauntsTotal ?? 0,
            validSwaps: serverOpp.validSwaps ?? 0,
            totalSwaps: serverOpp.totalSwaps ?? 0,
            dmgDealt: serverOpp.dmgDealt ?? 0,
            dmgReceived: serverOpp.dmgReceived ?? 0,
            armorAbsorbed: serverOpp.armorAbsorbed ?? 0,
            hpHealed: serverOpp.hpHealed ?? 0,
            junkSent: serverOpp.junkSent ?? 0,
            junkReceived: serverMy?.junkSent ?? 0,
            skillsUsed: serverOpp.skillsUsed ?? 0,
            opponentSkillsUsed: serverMy?.skillsUsed ?? 0,
          });
        }
      }
      const duration = gameStartAtRef.current > 0 ? Date.now() - gameStartAtRef.current : 60000;
      setGameDurationMs(duration);
      addLog(`Kết thúc! ${iWon ? '🏆 Thắng!' : isDr ? '🤝 Hoà' : '💀 Thua'}`);
      // Fetch post-game data
      const oppPlayer = data.players.find(p => p.userId !== myUserIdRef.current);
      if (oppPlayer?.userId) {
        pvpApi.getRating().then(r => setRatingAfter(r)).catch(() => { });
        pvpApi.getHeadToHead(oppPlayer.userId).then(res => {
          const s = res.stats as Record<string, string> | null;
          if (s) {
            setH2hData({
              total: Number(s.total ?? 0),
              myWins: Number(s.my_wins ?? 0),
              oppWins: Number(s.opp_wins ?? 0),
              draws: Number(s.draws ?? 0),
            });
          }
        }).catch(() => { });
      } else {
        pvpApi.getRating().then(r => setRatingAfter(r)).catch(() => { });
      }
    });

    r.onMessage('match_saved', (data: { matchId: string }) => {
      setMatchId(data.matchId);
      if (proofPollRef.current) clearInterval(proofPollRef.current);
      let attempts = 0;
      proofPollRef.current = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch(`${API_BASE}/api/pvp/proof/${data.matchId}`);
          const json = await res.json();
          if (json.txHash) {
            setProofData({
              merkleRoot: json.merkleRoot ?? null,
              ipfsHash: json.ipfsHash ?? null,
              txHash: json.txHash,
              moveCount: json.moveCount ?? null,
            });
            if (proofPollRef.current) clearInterval(proofPollRef.current);
          }
        } catch (e) {
          console.warn('[Proof poll] error:', e);
        }
        if (attempts >= 10 && proofPollRef.current) {
          clearInterval(proofPollRef.current);
        }
      }, 3000);
    });

    r.onMessage('sudden_death', () => {
      setIsSuddenDeath(true);
      setTimeLeft(15);
      addLog('SUDDEN DEATH! +15s, combo x1.5');
    });

    r.onMessage('timer_tick', (data: { timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
    });

    // ── Emoji Taunt messages ──
    r.onMessage('taunt_received', (data: { emoji: string }) => {
      const id = Date.now();
      setFloatingEmojis(prev => [...prev, { id, emoji: data.emoji }]);
      setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 2000);
    });

    r.onMessage('taunt_blocked', () => { /* cooldown handled by emojiCooldown state */ });

    r.onMessage('spam_warning', (data: { message: string }) => {
      setJunkAlert(data.message);
      setTimeout(() => setJunkAlert(''), 2500);
    });

    r.onMessage('debuff_applied', (data: { type: string; duration: number }) => {
      setActiveDebuff({ type: data.type, until: Date.now() + data.duration });
      setTimeout(() => setActiveDebuff(null), data.duration);
      statsRef.current.debuffReceived++;
      addLog(`🌀 Debuff: ${data.type} (${data.duration}ms)`);
    });

    r.onMessage('score_event', (data: { type: string; leaderId?: string; chaserId?: string }) => {
      if (data.type === 'overtake') {
        setScoreAlert({ text: 'OVERTAKE! 👑', color: '#f0c040' });
        setTimeout(() => setScoreAlert(null), 2000);
      } else if (data.type === 'comeback') {
        setScoreAlert({ text: 'COMEBACK! 🔥', color: '#fb923c' });
        setTimeout(() => setScoreAlert(null), 2000);
      } else if (data.type === 'danger_zone') {
        setIsDangerZone(true);
      }
    });

    r.onMessage('combo_event', (data: { combo: number }) => {
      const id = Date.now();
      setComboBlast({ combo: data.combo, id });
      setTimeout(() => setComboBlast(null), 1500);
      if (data.combo > statsRef.current.highestCombo) statsRef.current.highestCombo = data.combo;
    });

    // ── Skill messages ──
    r.onMessage('skill_used', (data: { skillId: string; isSelf: boolean; manaCost: number; cooldownMs: number }) => {
      if (data.isSelf) {
        statsRef.current.skillsUsed++;
        setSkillCooldowns(prev => ({
          ...prev,
          [data.skillId]: { remaining: data.cooldownMs, total: data.cooldownMs },
        }));
      } else {
        statsRef.current.opponentSkillsUsed++;
        // Opponent used skill → show BIG notification
        const groupA = SKILL_GROUPS.A.find(s => s.id === data.skillId);
        const groupB = SKILL_GROUPS.B.find(s => s.id === data.skillId);
        const groupC = SKILL_GROUPS.C.find(s => s.id === data.skillId);
        const skillDef = groupA || groupB || groupC;

        if (skillDef) {
          let targetText = '';
          if (groupA) targetText = '⚔️ Tấn công bạn!';
          else if (groupB) targetText = '⛓️ Kiểm soát bạn!';
          else if (groupC) targetText = '💚 Tự hỗ trợ';
          setOpponentSkillNotif({ icon: skillDef.icon, name: skillDef.name, target: targetText });
          setTimeout(() => setOpponentSkillNotif(null), 3000);
        }
        // Keep the small flash too
        setOpponentSkillFlash(skillDef ? `${skillDef.icon} ${skillDef.name}!` : data.skillId);
        setTimeout(() => setOpponentSkillFlash(null), 2000);
      }
    });

    r.onMessage('skill_effect', (data: {
      type: string; target: string; durationMs?: number; value?: number;
      zone?: number[]; junkPositions?: number[]; junkCount?: number;
    }) => {
      addEffect({
        type: data.type,
        target: data.target as 'self' | 'opponent',
        durationMs: data.durationMs,
        data: { zone: data.zone, junkPositions: data.junkPositions, value: data.value },
      });
      // Board shake for Hỗn Loạn
      if (data.type === 'hon_loan' && data.target === 'self') {
        setBoardShake(true);
        setTimeout(() => setBoardShake(false), 1000);
      }
      addLog(`Skill effect: ${data.type} target=${data.target}${data.value ? ` val=${data.value}` : ''}`);
    });

    r.onMessage('skill_ready', (data: { skillId: string }) => {
      console.log('[Skill Ready]', data.skillId);
    });

    r.onMessage('skill_error', (data: { error: string }) => {
      console.warn('[Skill Error]', data.error);
    });

    r.onMessage('reveal_board', (data: { tiles: number[]; durationMs: number }) => {
      setOpponentBoard(data.tiles);
      setOpponentBoardRevealed(true);
      setTimeout(() => setOpponentBoardRevealed(false), data.durationMs);
      addLog(`👁️ Thiên Nhãn — board đối thủ hiện ${data.durationMs / 1000}s`);
    });

    r.onMessage('reveal_board_end', () => {
      setOpponentBoardRevealed(false);
    });

    r.onMessage('debuff_expired', (data: { type: string }) => {
      setActiveEffects(prev => prev.filter(e => e.type !== data.type));
      addLog(`Debuff expired: ${data.type}`);
    });

    r.onMessage('debuff_expired_opponent', (data: { type: string }) => {
      setActiveEffects(prev => prev.filter(e => e.type !== data.type));
    });

    r.onMessage('swap_blocked', (data: { reason: string }) => {
      console.log('[Swap Blocked]', data.reason);
    });

    r.onMessage('mana_update', (data: { mana: number; maxMana: number }) => {
      setMyMana(data.mana);
      if (data.maxMana) setMyMaxMana(data.maxMana);
    });

    // Bot emoji taunt relay
    r.onMessage('emoji_taunt', (data: { emoji: string }) => {
      const id = Date.now();
      setFloatingEmojis(prev => [...prev, { id, emoji: data.emoji }]);
      setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 2000);
    });

    r.onMessage('tilted_event', (data: { attackerId: string; debuffType: string }) => {
      if (data.attackerId === mySessionId || data.attackerId === myUserIdRef.current) {
        statsRef.current.debuffSent++;
      }
      addLog(`🌀 Tilted by ${data.attackerId.slice(0, 6)} → ${data.debuffType}`);
    });

    r.onError((code, msg) => {
      addLog(`❌ Lỗi room: ${msg} (${code})`);
      setError(`${code}: ${msg}`);
    });

    r.onLeave((code) => {
      setInRoom(false);
      setRoomState(null);
      setRoomId('');
      setIsHost(false);
      setMySessionId('');
      setMyReady(false);
      setMyBoard([]);
      setOpponentBoard([]);
      setMyScore(0);
      setOpponentScore(0);
      setComboText('');
      setTimeLeft(90);
      setIsSuddenDeath(false);
      setWinnerId('');
      setWinnerSessionId('');
      setGameOverPlayers([]);
      setJunkAlert('');
      setFloatingEmojis([]);
      setActiveDebuff(null);
      setScoreAlert(null);
      setIsDangerZone(false);
      setComboBlast(null);
      if (code === 4001) {
        setOpponentLeft(false);
        setError(t('game.kicked'));
        addLog('⚠️ Bị kick khỏi phòng');
        const fromQueue = new URLSearchParams(window.location.search).get('fromQueue') === '1';
        if (fromQueue) {
          setTimeout(() => navigate('/pvp?requeue=1'), 1500);
        }
      } else if (code !== 1000) {
        setOpponentLeft(true);
        addLog(`Đối thủ rời phòng (code: ${code})`);
      } else {
        addLog('Đã rời phòng');
      }
    });

    setInRoom(true);
    setOpponentLeft(false);
    setMyReady(false);

    if (fromQueue) {
      r.send('ready');
      setMyReady(true);
      addLog('Đã tự động Sẵn sàng (Matchmaking)');
    }

    // Strip ?roomId= from URL only if it exists to avoid re-triggering auto-join useEffect
    if (urlRoomCode) {
      navigate('/pvp-test', { replace: true });
    }
  }, [addLog, navigate, urlRoomCode, fromQueue]);

  const handleCreate = async () => {
    if (!clientRef.current) return;
    setError('');
    setConnecting(true);
    try {
      const token = await fetchPvpToken();
      addLog('Đang tạo phòng...');
      // Use REST API to create room (registers pvp:open_room in Redis for invite links)
      const openRoom = await pvpApi.createOpenRoom(true);
      if (!openRoom.ok) throw new Error('Failed to create room');
      setRoomCode(openRoom.roomCode);
      addLog(`Phòng ${openRoom.roomCode} đã tạo, đang kết nối...`);
      const r = await clientRef.current.joinById(openRoom.roomId, { token, picture: auth?.user?.picture || '', role: isSpectator ? 'spectator' : 'player' });
      attachHandlers(r);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      addLog(`❌ Tạo phòng thất bại: ${msg}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleJoin = async (roomIdOverride?: string) => {
    if (!clientRef.current) return;
    const code = (roomIdOverride || inputCode).trim();
    if (!code) return;
    setError('');
    setConnecting(true);
    try {
      const token = await fetchPvpToken();
      addLog(`Join: ${code}...`);
      
      let targetId = code;
      // If code looks like a Room Code (short, no dashes), try to resolve it from the public rooms list
      if (!code.includes('-') && code.length <= 10) {
        try {
          const { rooms } = await pvpApi.getRooms();
          const match = rooms.find(r => r.roomCode === code);
          if (match) {
            targetId = match.roomId;
            addLog(`Mã ${code} → RoomId: ${targetId}`);
          }
        } catch (e) {
          console.warn('[handleJoin] Failed to fetch rooms for resolution:', e);
        }
      }

      const r = await clientRef.current.joinById(targetId, { token, picture: auth?.user?.picture || '', role: isSpectator ? 'spectator' : 'player' });
      attachHandlers(r);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('INVALID_TOKEN') || msg.includes('NO_TOKEN')) {
        setError(t('error.invalidToken'));
      } else if (msg.includes('not found') || msg.includes('404')) {
        setError(t('error.roomNotFound', { code }));
      } else if (msg.includes('full') || msg.includes('maxClients')) {
        setError(t('error.roomFull'));
      } else {
        setError(msg);
      }
      addLog(`❌ Join thất bại: ${msg}`);
      // Clear URL param so spinner disappears and user can retry
      if (urlRoomCode) navigate('/pvp-test', { replace: true });
    } finally {
      setConnecting(false);
    }
  };

  const handleLeave = () => {
    roomRef.current?.leave();
    setInRoom(false);
    setRoomState(null);
    setRoomId('');
    setIsHost(false);
    setMySessionId('');
    setMyReady(false);
    setMyBoard([]);
    setOpponentBoard([]);
    setMyScore(0);
    setOpponentScore(0);
    setComboText('');
    setTimeLeft(60);
    setIsSuddenDeath(false);
    setWinnerId('');
    setWinnerSessionId('');
    setGameOverPlayers([]);
    setJunkAlert('');
    setMyHp(1000);
    setFloatingEmojis([]);
    setActiveDebuff(null);
    setScoreAlert(null);
    setIsDangerZone(false);
    setComboBlast(null);
    setMyArmor(0);
    setMyMana(0);
    setOpponentHp(1000);
    setOpponentArmor(0);
    addLog('Đã rời phòng');
  };

  const handleRematch = () => {
    if (!roomRef.current) return;
    roomRef.current.send('rematch_request');
    setRematchState(prev => prev === 'ready' ? 'ready' : 'waiting');
    addLog('Gửi: Rematch request');
  };

  const handleSkipPostGame = () => {
    if (!roomRef.current) return;
    roomRef.current.send('skip_post_game');
    addLog('Gửi: Skip post game');
  };

  const handleReady = () => {
    if (!roomRef.current) return;
    roomRef.current.send('ready');
    setMyReady(true);
    addLog('Gửi: Sẵn sàng');
  };

  const handleUnready = () => {
    setMyReady(false);
    addLog('Hủy sẵn sàng (local)');
  };

  const handleStart = () => {
    if (!roomRef.current) return;
    roomRef.current.send('start');
    addLog('Gửi: Bắt Đầu');
  };

  const handleKick = (sessionId: string) => {
    if (!roomRef.current) return;
    roomRef.current.send('kick', { sessionId });
    addLog(`Gửi: Kick ${sessionId.slice(0, 6)}...`);
  };

  const showInviteToast = (msg: string) => {
    setInviteToast(msg);
    setTimeout(() => setInviteToast(''), 3000);
  };

  const handleInviteFriend = async () => {
    if (!roomCode) return;
    setShowFriendPicker(true);
    setFriendsLoading(true);
    try {
      const result = await socialApi.getFriends();
      setFriendList(result.friends);
    } catch {
      setFriendList([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleSendInviteToFriend = async (friendId: string) => {
    if (!roomCode) return;
    setSendingInviteTo(friendId);
    try {
      await pvpApi.sendInvite(friendId, roomCode);
      showInviteToast('✅ Đã gửi lời mời!');
      setShowFriendPicker(false);
    } catch (e) {
      showInviteToast(`❌ ${e instanceof Error ? e.message : 'Gửi lời mời thất bại'}`);
    } finally {
      setSendingInviteTo(null);
    }
  };

  const handleShare = async () => {
    if (!roomCode) return;
    setInviteLoading(true);
    try {
      let url = inviteUrl;
      if (!url || !inviteExpiry || Date.now() >= inviteExpiry - 30_000) {
        const data = await pvpApi.createInviteLink(roomCode);
        url = data.inviteUrl;
        setInviteUrl(url);
        setInviteExpiry(data.expiresAt);
      }
      const shareData = {
        title: '⚔️ Thách đấu PVP!',
        text: `${roomState?.players[mySessionId ?? '']?.name ?? 'Host'} đang chờ bạn vào trận! Lời mời hết hạn sau 5 phút.`,
        url: url!,
      };
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(url!)}&title=${encodeURIComponent(shareData.text)}`;
        window.open(zaloUrl, '_blank', 'noopener');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        showInviteToast('❌ Không thể chia sẻ');
      }
    } finally {
      setInviteLoading(false);
    }
  };

  // ── Auto-join khi có roomId trên URL ──
  useEffect(() => {
    // Nếu có roomId trên URL và khác với phòng hiện tại
    if (urlRoomCode && urlRoomCode !== roomId) {
      // Nếu đang kết nối thì đợi
      if (connecting) return;

      addLog(`Phát hiện yêu cầu vào phòng mới: ${urlRoomCode}`);
      // Nếu đang ở trong phòng cũ thì rời đi trước
      if (roomRef.current) {
        roomRef.current.leave();
      }
      
      const timer = setTimeout(() => {
        handleJoin(urlRoomCode);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [urlRoomCode, roomId, connecting]);

  // ── Auto-join khi có invite token trên URL ──
  useEffect(() => {
    const inviteToken = searchParams.get('invite');
    if (!inviteToken || inRoom || autoJoinedRef.current) return;
    autoJoinedRef.current = true;
    const handleInviteToken = async (token: string) => {
      try {
        const result = await pvpApi.validateInviteLink(token);
        window.history.replaceState({}, '', window.location.pathname);
        if (result.valid && result.roomCode) {
          showInviteToast(`Đang vào phòng của ${result.hostName ?? 'Host'}...`);
          setTimeout(() => handleJoin(result.roomCode!), 600);
        } else {
          showInviteToast(
            result.reason === 'expired' ? '❌ Lời mời đã hết hạn (5 phút)' : '❌ Link mời không hợp lệ',
          );
        }
      } catch {
        showInviteToast('❌ Không thể xác thực lời mời');
      }
    };
    void handleInviteToken(inviteToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived state ──
  const phase = roomState?.phase ?? 'waiting';

  // ── Post-game countdown (10s → 0, resets when leaving 'finished' phase) ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (phase !== 'finished') {
      setPostGameCountdown(10);
      return;
    }
    const interval = setInterval(() => {
      setPostGameCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const countdown = roomState?.countdown ?? -1;
  const lobbyMins = Math.floor(lobbyTimeLeft / 60).toString().padStart(2, '0');
  const lobbySecs = (lobbyTimeLeft % 60).toString().padStart(2, '0');
  const lobbyTimerColor = lobbyTimeLeft <= 60 ? '#f87171' : lobbyTimeLeft <= 300 ? '#fb923c' : '#34d399';
  const playersArr = roomState ? Object.entries(roomState.players) : [];
  const hostSessionId = roomState?.hostId ?? '';

  const opponentEntry = playersArr.find(([sid]) => sid !== mySessionId);
  const opponentPlayer = opponentEntry?.[1];
  const myPlayer = mySessionId ? roomState?.players[mySessionId] : undefined;

  const canStart = isHost && playersArr.length === 2 &&
    playersArr.every(([sid, p]) => sid === hostSessionId || p.ready);

  const isPlaying = phase === 'playing' || phase === 'sudden_death';
  const showBoard = isPlaying && myBoard.length === 64;
  const showCountdown = phase === 'playing' && countdown > 0;
  const showResult = phase === 'finished' && winnerId !== '' && playersArr.length > 1;
  const isWinner = winnerSessionId === mySessionId;
  const isDraw = winnerId === 'draw';

  return (
    <div style={{
      minHeight: '100dvh',
      background: "url('/assets/pvp/bg_pvp.png') no-repeat center center / 100% 100%",
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: showBoard ? 0 : '40px 16px 20px',
    }}>
      {/* Countdown overlay */}
      {showCountdown && <CountdownOverlay count={countdown} />}

      {/* Combo flash */}
      {comboText && (
        <div style={{
          position: 'fixed', top: '15%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: '#fff', padding: '6px 16px',
          borderRadius: 10, fontSize: 16, fontWeight: 900, zIndex: 100,
          animation: 'comboFlash 1.5s ease-out forwards',
          textShadow: '0 2px 4px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          {comboText}
        </div>
      )}

      {/* Invite toast */}
      {inviteToast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#1e3a5a', border: '1px solid #3b82f6',
          borderRadius: 10, padding: '10px 20px',
          color: '#e2e8f0', fontSize: 14, fontWeight: 600,
          zIndex: 400, whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }}>
          {inviteToast}
        </div>
      )}

      {/* Friend Picker Full Page Overlay */}
      {showFriendPicker && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1000,
            background: "url('/assets/pvp/bg_pvp.png') no-repeat center center / 100% 100%",
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            padding: '40px 16px 20px',
          }}
        >
          <div style={{ maxWidth: 335, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', marginBottom: 60, marginTop: 0, minHeight: 32,
            }}>
              <button
                onClick={() => setShowFriendPicker(false)}
                style={{
                  position: 'absolute', left: 0, top: 60,
                  background: "url('/assets/pvp_1vs1_arena/btn_back.png') no-repeat center center / contain",
                  border: 'none', width: 86, height: 38, cursor: 'pointer',
                  color: 'transparent', padding: 0, transition: 'transform 0.1s',
                }}
                onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Back
              </button>
              <h1 style={{
                margin: 0, fontSize: 24, fontWeight: 900, color: '#FFFEA3',
                textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1,
                fontFamily: "'Fredoka One', 'Nunito', sans-serif",
                textShadow: '2px 2px 0 #1a0a00, -2px 2px 0 #1a0a00, 2px -2px 0 #1a0a00, -2px -2px 0 #1a0a00, 3px 0 0 #1a0a00, -3px 0 0 #1a0a00, 0 3px 0 #1a0a00, 0 -3px 0 #1a0a00',
              }}>
                Mời Bạn Bè
              </h1>
            </div>

            {/* List Area */}
            <style>{`
              .pvp-invite-scroll::-webkit-scrollbar { display: none; }
              .pvp-invite-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div className="pvp-invite-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>
              <div style={{
                background: "url('/assets/guest_room/frame_wood_3.png') no-repeat center center / 100% 100%",
                minHeight: '80vh', padding: '30px 20px',
                display: 'flex', flexDirection: 'column',
              }}>
                {friendsLoading ? (
                  <div style={{ textAlign: 'center', color: '#FFFEA3', padding: 40, fontSize: 16, fontWeight: 700, textShadow: '1px 1px 0 #3b1e0a' }}>
                    Đang tải...
                  </div>
                ) : friendList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 16px' }}>
                    <div style={{ fontSize: 60, marginBottom: 12 }}>😔</div>
                    <div style={{ color: '#FFFEA3', fontSize: 16, fontWeight: 700, textShadow: '1px 1px 0 #3b1e0a' }}>
                      Chưa có bạn bè nào
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {friendList.map(f => (
                      <div
                        key={f.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px',
                          background: 'rgba(0,0,0,0.3)', borderRadius: 12,
                          border: '1px solid rgba(255, 254, 163, 0.2)',
                        }}
                      >
                        <div style={{
                          width: 48, height: 48, flexShrink: 0,
                          backgroundImage: "url('/assets/guest_room/frame_ava.png')",
                          backgroundSize: '100% 100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {f.avatar ? (
                            <img src={f.avatar} style={{ width: '86%', height: '86%', objectFit: 'cover', borderRadius: 2 }} alt="" />
                          ) : (
                            <div style={{ width: '86%', height: '86%', borderRadius: 2, background: '#1e4d78', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                              👤
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5 }}>{f.name}</div>
                          <div style={{ color: '#FFFEA3', fontSize: 12, fontWeight: 700 }}>Lv.{f.level}</div>
                        </div>
                        <button
                          onClick={() => void handleSendInviteToFriend(f.id)}
                          disabled={sendingInviteTo === f.id}
                          style={{
                            padding: '8px 20px', borderRadius: 12, border: '2px solid #5a1414',
                            background: sendingInviteTo === f.id ? '#64748b' : 'linear-gradient(180deg, #ef4444, #991b1b)',
                            color: '#fff', fontSize: 14, fontWeight: 900, fontFamily: "'Fredoka One', 'Nunito', sans-serif",
                            cursor: sendingInviteTo === f.id ? 'not-allowed' : 'pointer',
                            boxShadow: sendingInviteTo === f.id ? 'none' : '0 4px 0 #5a1414',
                            textShadow: '1px 1px 0 #000',
                            transition: 'transform 0.1s',
                          }}
                          onPointerDown={e => sendingInviteTo !== f.id && (e.currentTarget.style.transform = 'translateY(4px)', e.currentTarget.style.boxShadow = '0 0px 0 #5a1414')}
                          onPointerUp={e => sendingInviteTo !== f.id && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 0 #5a1414')}
                          onPointerLeave={e => sendingInviteTo !== f.id && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 0 #5a1414')}
                        >
                          {sendingInviteTo === f.id ? '...' : 'MỜI'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Junk alert */}
      {junkAlert && (
        <div style={{
          position: 'fixed', top: '22%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #6b7280, #374151)',
          color: '#fbbf24', padding: '6px 16px',
          borderRadius: 10, fontSize: 15, fontWeight: 900, zIndex: 101,
          animation: 'comboFlash 1.5s ease-out forwards',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          border: '1.5px solid #ef4444',
          whiteSpace: 'nowrap',
        }}>
          {junkAlert}
        </div>
      )}

      {/* Score alert — overtake / comeback */}
      {scoreAlert && (
        <div style={{
          position: 'fixed', top: '30%', left: '50%',
          fontSize: 26, fontWeight: 900, color: scoreAlert.color,
          textShadow: '0 2px 20px rgba(0,0,0,0.8)',
          animation: 'alertPop 2s ease forwards',
          zIndex: 102, pointerEvents: 'none',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}>
          {scoreAlert.text}
        </div>
      )}

      {/* Combo blast fullscreen (x5+) */}
      {comboBlast && (
        <div style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 103,
          animation: 'comboBlastAnim 1.5s ease forwards',
        }}>
          <div style={{
            fontSize: 52, fontWeight: 900, color: '#c084fc',
            textShadow: '0 0 40px rgba(192,132,252,0.9)',
            letterSpacing: '-0.02em',
          }}>
            COMBO ×{comboBlast.combo}!
          </div>
        </div>
      )}

      {/* Floating emojis from opponent taunts */}
      {floatingEmojis.map(({ id, emoji }) => (
        <div key={id} style={{
          position: 'fixed', top: '18%', right: '12%',
          fontSize: 38, animation: 'floatUp 2s ease-out forwards',
          pointerEvents: 'none', zIndex: 104,
        }}>
          {emoji}
        </div>
      ))}

      {/* Sudden Death overlay flash */}
      {isSuddenDeath && phase === 'sudden_death' && timeLeft >= 13 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: 'rgba(168, 85, 247, 0.15)',
          pointerEvents: 'none',
          animation: 'sdFlash 2s ease-out forwards',
        }} />
      )}

      {/* Damage flash overlay */}
      {damageFlash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 98,
          background: 'rgba(239, 68, 68, 0.2)',
          pointerEvents: 'none',
          animation: 'dmgFlash 0.3s ease-out forwards',
        }} />
      )}

      {/* Post-Game Screen */}
      {showResult && (
        <PostGameScreen
          isWinner={isWinner}
          isDraw={isDraw}
          isSuddenDeath={isSuddenDeath}
          myScore={myScore}
          opponentScore={opponentScore}
          myHp={myHp}
          myMaxHp={myMaxHp}
          opponentHp={opponentHp}
          myName={myPlayer?.name ?? auth?.user?.name ?? t('game.you')}
          opponentName={opponentPlayer?.name ?? t('game.opponent')}
          gameDurationMs={gameDurationMs}
          myStats={myStats}
          opponentStats={opponentStats}
          ratingBefore={ratingBefore}
          ratingAfter={ratingAfter}
          h2hData={h2hData}
          countdown={postGameCountdown}
          onSkip={handleSkipPostGame}
          onLeave={() => { handleLeave(); navigate('/pvp'); }}
          proofMerkleRoot={proofData.merkleRoot}
          proofTxHash={proofData.txHash}
          proofIpfsHash={proofData.ipfsHash}
          proofMoveCount={proofData.moveCount ?? undefined}
          myBuild={gameBuilds && mySessionId ? gameBuilds[mySessionId] : null}
          opponentBuild={gameBuilds ? Object.entries(gameBuilds).find(([sid]) => sid !== mySessionId)?.[1] ?? null : null}
        />
      )}

      <div style={{ maxWidth: 335, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: 60,
          marginTop: 0,
          minHeight: 32,
        }}>
          <button
            onClick={() => { handleLeave(); navigate('/pvp/arena'); }}
            style={{
              position: 'absolute',
              left: 0,
              top: 60,
              background: "url('/assets/pvp_1vs1_arena/btn_back.png') no-repeat center center / contain",
              border: 'none',
              width: 86,
              height: 38,
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
            1 vs 1 ARENA
          </h1>
        </div>

        {/* Status bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: "url('/assets/pvp_test/frame_wood_7.png') no-repeat center center / 100% 100%",
          borderRadius: 8, padding: '12px 20px', marginBottom: 12,
          minHeight: 64,
        }}>
          <span style={{ fontSize: 13, color: '#FFFEA3', fontWeight: 900, fontFamily: "'Fredoka One', 'Nunito', sans-serif", textShadow: '1px 1px 1px #000' }}>👤 {auth?.user?.name || '(guest)'}</span>
          <span style={{
            fontSize: 11, fontWeight: 900, padding: '3px 12px', borderRadius: 12,
            fontFamily: "'Fredoka One', 'Nunito', sans-serif",
            background: inRoom ? '#1a5c2a' : connecting ? '#5c4a1a' : '#3a1a1a',
            color: inRoom ? '#4caf50' : connecting ? '#ff9800' : '#f44336',
          }}>
            {inRoom ? '● Connected' : connecting ? '◌ ...' : ''}
          </span>
        </div>

        {/* Opponent left notice */}
        {opponentLeft && !inRoom && (
          <div style={{
            background: '#3a1a1a', border: '1px solid #c62828', borderRadius: 8,
            padding: '10px 14px', marginBottom: 12, color: '#ef9a9a', fontSize: 13, textAlign: 'center',
          }}>
            {t('room.opponentLeft')}
          </div>
        )}

        {/* ── BOARD VIEW — wood & forest theme matching mockup ── */}
        {inRoom && showBoard && (
          <div className="pvp-battle">
            <div className="pvp-battle__bg" />
            {/* Fireflies */}
            <div className="pvp-firefly" style={{ left: '12%', top: '20%', '--tx': '50px', '--ty': '-70px', animationDuration: '5s' } as React.CSSProperties} />
            <div className="pvp-firefly" style={{ left: '72%', top: '12%', background: '#ffe', boxShadow: '0 0 5px 2px rgba(255,255,200,.8)', '--tx': '-35px', '--ty': '55px', animationDuration: '6s', animationDelay: '1.2s' } as React.CSSProperties} />
            <div className="pvp-firefly" style={{ left: '88%', top: '38%', '--tx': '-55px', '--ty': '-40px', animationDuration: '7s', animationDelay: '2.5s' } as React.CSSProperties} />
            <div className="pvp-firefly" style={{ left: '28%', top: '65%', background: '#faf', boxShadow: '0 0 5px 2px rgba(255,200,255,.7)', '--tx': '25px', '--ty': '-85px', animationDuration: '4.5s', animationDelay: '0.7s' } as React.CSSProperties} />

            {/* ── PC layout container — centered max-width ── */}
            <div className="pvp-battle__container">

              {/* Floating emojis from opponent taunts */}
              {floatingEmojis.map(({ id, emoji }) => (
                <div key={id} className="pvp-float-emoji">{emoji}</div>
              ))}

              {/* ══════ TIMER — TOP CENTER ══════ */}
              <div className="pvp-timer-top">
                <div className={[
                  'pvp-timer',
                  timeLeft <= 10 && 'pvp-timer--urgent',
                  isSuddenDeath && timeLeft > 10 && 'pvp-timer--sudden',
                  activeDebuff?.type === 'hide_timer' && 'pvp-timer--hidden',
                ].filter(Boolean).join(' ')}>
                  {isSuddenDeath ? '☠️' : '⏱'} <span>{timeLeft}</span>s
                </div>
                {spectatorCount > 0 && (
                  <div style={{
                    fontSize: '11px', color: 'rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', marginTop: 4,
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#E24B4A', display: 'inline-block' }} />
                    {spectatorCount} đang xem
                  </div>
                )}
              </div>

              {/* ── Spectator banner ── */}
              {isSpectator && (
                <div style={{
                  background: 'rgba(226,75,74,0.15)', border: '0.5px solid rgba(226,75,74,0.3)',
                  borderRadius: '8px', padding: '6px 14px', textAlign: 'center',
                  fontSize: '12px', color: '#E24B4A', fontWeight: 500,
                  marginBottom: '8px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px',
                }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%', background: '#E24B4A',
                    display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                  Đang xem trực tiếp
                </div>
              )}

              {/* ── Opponent skill notification (BIG banner) ── */}
              {opponentSkillNotif && (
                <div className="pvp-opp-skill-notif">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{opponentSkillNotif.icon}</span>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                        {opponentSkillNotif.name}
                      </div>
                      <div style={{ color: '#fca5a5', fontSize: 11 }}>
                        {opponentName || opponentPlayer?.name || t('game.opponent')} dùng {opponentSkillNotif.target}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TOP: Opponent avatar + info + mini board ── */}
              <div className="pvp-top">
                <div className="pvp-top__avatar">
                  {opponentAvatar ? (
                    <img src={opponentAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <span>{(opponentName || opponentPlayer?.name || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="pvp-top__info">
                  <div className="pvp-top__name-row">
                    <span className="pvp-top__name">{opponentPlayer?.name ?? t('game.opponent')}</span>
                    <span className="pvp-top__score">{opponentScore.toLocaleString()}</span>
                  </div>
                  <div className={`pvp-hp${opponentHp < opponentMaxHp * 0.3 ? ' pvp-hp--danger' : ''}`}>
                    <div
                      className={`pvp-hp__fill${opponentHp < opponentMaxHp * 0.3 ? ' pvp-hp__fill--danger' : ''}`}
                      style={{ width: `${Math.max(0, (opponentHp / opponentMaxHp) * 100)}%` }}
                    />
                    <span className="pvp-hp__text">
                      {opponentHp}/{opponentMaxHp}{opponentArmor > 0 ? ` 🛡️${opponentArmor}` : ''}
                    </span>
                  </div>
                  <div className="pvp-hp" style={{ height: 5, marginTop: 2 }}>
                    <div
                      className="pvp-hp__fill"
                      style={{ width: `${Math.min(100, (opponentMana / opponentMaxMana) * 100)}%`, background: '#eab308' }}
                    />
                    <span className="pvp-hp__text" style={{ fontSize: 9 }}>
                      ⭐{opponentMana}/{opponentMaxMana}
                    </span>
                  </div>
                </div>
                <div className="pvp-mini-wrap" style={{ position: 'relative' }}>
                  <span className="pvp-mini-wrap__label">{t('game.opponentBoard')}</span>
                  <div style={{ position: 'relative' }}>
                    <MiniBoard tiles={opponentBoard} />
                    {/* Blur overlay — default hidden, revealed by Thiên Nhãn */}
                    {!opponentBoardRevealed && (
                      <div className="pvp-mini-blur">
                        <span style={{ fontSize: 16 }}>👁️</span>
                        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginTop: 1 }}>Thiên Nhãn</span>
                      </div>
                    )}
                    {opponentBoardRevealed && (
                      <div className="pvp-mini-revealed">👁️ Thiên Nhãn</div>
                    )}
                    {/* Skill effect overlays on opponent mini board */}
                    <PvpSkillOverlay effects={activeEffects.filter(e => e.target === 'opponent')} />
                  </div>
                </div>
              </div>

              {/* ── BOARD SECTION ── */}
              <div className="pvp-board-section">
                {/* ── MY SECTION ── */}
                <div className="pvp-my">
                  <div className="pvp-my__avatar">
                    {myAvatar ? (
                      <img src={myAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      <span>{(myName || myPlayer?.name || '?').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="pvp-my__stats">
                    <div className="pvp-my__top-row">
                      <span className="pvp-my__name">{myPlayer?.name ?? t('game.you')}</span>
                      <span className="pvp-my__score">{myScore.toLocaleString()}</span>
                    </div>
                    <div className={`pvp-bar pvp-bar--hp${myHp < myMaxHp * 0.3 ? ' pvp-bar--low' : ''}`}>
                      <div className="pvp-bar__fill" style={{ width: `${Math.max(0, (myHp / myMaxHp) * 100)}%` }} />
                      <span className="pvp-bar__label">❤️ HP</span>
                      <span className="pvp-bar__val">{myHp}/{myMaxHp}{myArmor > 0 ? ` 🛡️${myArmor}` : ''}</span>
                    </div>
                    <div className="pvp-bar pvp-bar--mp" style={{ position: 'relative' }}>
                      <div className="pvp-bar__fill" style={{ width: `${Math.min(100, (myMana / myMaxMana) * 100)}%` }} />
                      <span className="pvp-bar__label">⭐ Mana</span>
                      <span className="pvp-bar__val">{myMana}/{myMaxMana}</span>
                      {/* Skill cost markers */}
                      {mySkills.map(skill => {
                        const pct = (skill.manaCost / myMaxMana) * 100;
                        if (pct > 100) return null;
                        return (
                          <div key={skill.id} style={{
                            position: 'absolute', top: -9, left: `${pct}%`,
                            transform: 'translateX(-50%)',
                            fontSize: 7, lineHeight: 1, pointerEvents: 'none',
                            opacity: myMana >= skill.manaCost ? 1 : 0.35,
                            transition: 'opacity 0.3s',
                          }}>
                            {skill.icon}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── BOARD — wood frame + vine corners ── */}
                <div className={[
                  'pvp-board-wrap',
                  damageFlash && 'pvp-board-wrap--damage',
                  activeDebuff?.type === 'shake' && 'pvp-board-wrap--shake',
                  boardShake && 'pvp-board-wrap--skill-shake',
                  isDangerZone && !damageFlash && 'pvp-board-wrap--danger',
                ].filter(Boolean).join(' ')}>
                  <span className="pvp-vine pvp-vine--tl">🌿</span>
                  <span className="pvp-vine pvp-vine--tr">🍃</span>
                  <span className="pvp-vine pvp-vine--bl">🌿</span>
                  <span className="pvp-vine pvp-vine--br">🍃</span>
                  {myGems.length > 0 && (
                    <CampaignMatch3Board
                      grid={myGems}
                      selected={boardSelected}
                      matchedCells={matchedCells}
                      spawningGems={spawningGems}
                      lockedGems={new Set()}
                      highlightedGem={null}
                      isStunned={activeDebuff?.type === 'freeze'}
                      animating={boardAnimating}
                      handlePointerDown={isSpectator ? () => { } : handlePointerDown}
                      handlePointerMove={isSpectator ? () => { } : handlePointerMove}
                      handlePointerUp={isSpectator ? () => { } : handlePointerUp}
                      combo={pvpCombo}
                      showCombo={showCombo}
                      otHiemActive={false}
                      romBocActive={false}
                      GEM_META={PVP_GEM_META}
                    />
                  )}
                  {activeDebuff?.type === 'freeze' && (
                    <div className="pvp-freeze">&#10052;&#65039;</div>
                  )}
                  {/* Skill effect overlays on my board */}
                  <PvpSkillOverlay effects={activeEffects.filter(e => e.target === 'self')} />
                </div>
                {/* Timer moved to top center */}

                {/* ── SKILL BUTTONS ── */}
                {!isSpectator && mySkills.length > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 10, padding: '6px 0 2px',
                  }}>
                    {mySkills.map(skill => {
                      const cd = skillCooldowns[skill.id];
                      return (
                        <PvpSkillButton
                          key={skill.id}
                          skillId={skill.id}
                          icon={skill.icon}
                          name={skill.name}
                          manaCost={skill.manaCost}
                          currentMana={myMana}
                          cooldownTotal={cd?.total ?? skill.cooldownMs}
                          cooldownRemaining={cd?.remaining ?? 0}
                          disabled={phase !== 'playing' && phase !== 'sudden_death'}
                          onCast={() => handleCastSkill(skill.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Opponent skill flash */}
              {opponentSkillFlash && (
                <div style={{
                  position: 'absolute', top: '15%', left: '50%',
                  transform: 'translateX(-50%)', zIndex: 50,
                  background: 'rgba(239,68,68,0.9)', color: '#fff',
                  padding: '6px 16px', borderRadius: 12,
                  fontSize: 14, fontWeight: 700,
                  animation: 'comboFlash 2s ease-out forwards',
                  boxShadow: '0 4px 20px rgba(239,68,68,0.5)',
                  whiteSpace: 'nowrap', pointerEvents: 'none',
                }}>
                  {opponentSkillFlash}
                </div>
              )}

              {/* ── BOTTOM: Emoji bar + leave ── */}
              <div className="pvp-bottom">
                {!isSpectator && (['😂', '😤', '🔥', '💀', '👑', '🫵'] as const).map(emoji => (
                  <button
                    key={emoji}
                    className={`pvp-emoji-btn${emojiCooldown ? ' pvp-emoji-btn--disabled' : ''}`}
                    onClick={() => sendTaunt(emoji)}
                    disabled={emojiCooldown}
                  >
                    {emoji}
                  </button>
                ))}
                {!isSpectator && <div className="pvp-separator" />}
                <button className="pvp-leave-btn" onClick={handleLeave}>🚪</button>
              </div>

            </div>{/* close pvp-battle__container */}
          </div>
        )}

        {/* ── LOBBY VIEW ── */}
        {inRoom && !showBoard && roomState && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>

            {/* ── SECTION 1: Room code frame ── */}
            <div
              title="Click to copy"
              onClick={() => { navigator.clipboard?.writeText(roomCode || roomId); addLog('Copied room ID'); }}
              style={{
                backgroundImage: "url('/assets/guest_room/frame_index_2.png')",
                backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
                padding: '6px 20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{
                fontSize: 14, fontWeight: 900, letterSpacing: 2,
                color: '#fff', textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                fontFamily: "'Fredoka One', 'Nunito', sans-serif",
              }}>
                {roomCode || roomId}
              </span>
            </div>

            {/* ── SECTION 2: Players + Timer frame ── */}
            <div style={{
              background: "url('/assets/guest_room/frame_pvp_1vs1.png') no-repeat center center / 100% 100%",
              padding: '28px 16px 32px',
              position: 'relative',
            }}>

              {/* Host left — Guest right */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Host (left) */}
                {(() => {
                  const hostEntry = playersArr.find(([sid]) => sid === hostSessionId);
                  const hostP = hostEntry?.[1];
                  return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 72, height: 72,
                        backgroundImage: "url('/assets/guest_room/frame_ava.png')",
                        backgroundSize: '100% 100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {(hostP as (PlayerInfo & { avatar?: string }) | undefined)?.avatar ? (
                          <img src={(hostP as PlayerInfo & { avatar?: string }).avatar} alt="" style={{ width: '86%', height: '86%', objectFit: 'cover', borderRadius: 6 }} />
                        ) : (
                          <div style={{
                            width: '86%', height: '86%', borderRadius: 6,
                            background: 'linear-gradient(135deg,#e94560,#a01030)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26, fontWeight: 900, color: '#fff', textShadow: '1px 1px 2px #000',
                          }}>
                            {(hostP?.name ?? '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ textAlign: 'center', fontFamily: "'Fredoka One','Nunito',sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 72 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', textShadow: '1px 1px 2px #000', wordBreak: 'break-word', maxWidth: 100 }}>
                          {hostP ? `${hostP.name}${mySessionId === hostSessionId ? '(bạn)' : ''}` : t('game.waitingPlayer')}
                        </div>
                        <div style={{ fontSize: 11, color: '#fdd835', fontWeight: 700 }}>👑HOST</div>
                        <div style={{ flex: 1 }} />
                        <img src="/assets/guest_room/frame_ready.png" alt="Ready" style={{ width: 64, height: 'auto' }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Center: timer + subtitle */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 8 }}>
                  <img src="/assets/guest_room/icon_knife.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                  <div style={{
                    fontSize: 22, fontWeight: 900, color: lobbyTimerColor,
                    fontFamily: "'Fredoka One','Nunito',sans-serif",
                    textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                    transition: 'color 0.5s ease',
                    lineHeight: 1.1,
                  }}>
                    {lobbyMins}:{lobbySecs}
                  </div>
                  <span style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', maxWidth: 60, lineHeight: 1.2 }}>
                    {lobbyTimeLeft <= 60 ? t('game.lobbyClosingSoon') : t('game.lobbyCloseIn')}
                  </span>
                </div>

                {/* Guest (right) */}
                {(() => {
                  const guestEntry = playersArr.find(([sid]) => sid !== hostSessionId);
                  const guestP = guestEntry?.[1];
                  const guestSid = guestEntry?.[0];
                  const guestReady = guestP?.ready ?? false;
                  return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
                      {/* Avatar */}
                      <div style={{
                        width: 72, height: 72,
                        backgroundImage: "url('/assets/guest_room/frame_ava.png')",
                        backgroundSize: '100% 100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: guestP ? 1 : 0.5,
                      }}>
                        {guestP ? (
                          (guestP as PlayerInfo & { avatar?: string }).avatar ? (
                            <img src={(guestP as PlayerInfo & { avatar?: string }).avatar} alt="" style={{ width: '86%', height: '86%', objectFit: 'cover', borderRadius: 6 }} />
                          ) : (
                            <div style={{
                              width: '86%', height: '86%', borderRadius: 6,
                              background: 'linear-gradient(135deg,#1e88e5,#0d4080)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 26, fontWeight: 900, color: '#fff', textShadow: '1px 1px 2px #000',
                            }}>
                              {(guestP.name ?? '?').charAt(0).toUpperCase()}
                            </div>
                          )
                        ) : (
                          <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.3)' }}>?</div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ textAlign: 'center', fontFamily: "'Fredoka One','Nunito',sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 72 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', textShadow: '1px 1px 2px #000', wordBreak: 'break-word', maxWidth: 100 }}>
                          {guestP ? `${guestP.name}${mySessionId === guestSid ? '(bạn)' : ''}` : t('game.waitingPlayer')}
                        </div>
                        <div style={{ flex: 1 }} />
                        {guestP && (
                          <img
                            src={guestReady ? '/assets/guest_room/frame_ready.png' : '/assets/guest_room/frame_not_ready.png'}
                            alt={guestReady ? 'Sẵn sàng' : 'Chưa sẵn sàng'}
                            style={{ width: 64, height: 'auto' }}
                          />
                        )}
                      </div>
                      {/* Kick button */}
                      {isHost && guestP && guestSid && (
                        <button
                          onClick={() => handleKick(guestSid)}
                          style={{
                            position: 'absolute',
                            bottom: -40,
                            left: '50%',
                            marginLeft: '-32px', // Half of width (64)
                            background: 'none', border: 'none', padding: 0,
                            cursor: 'pointer', transition: 'transform 0.1s',
                            zIndex: 2,
                          }}
                          onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                          onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                          onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          <img src="/assets/guest_room/btn_drive_away.png" alt="Đuổi" style={{ width: 64, height: 'auto', display: 'block' }} />
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>




            {/* ── SECTION 3: Action buttons side-by-side ── */}
            <div style={{ display: 'flex', gap: 10 }}>
              {/* Ready / Start / Cancel */}
              {isHost ? (
                <button onClick={handleStart} disabled={!canStart} style={{
                  flex: 1, border: 'none', background: 'none', padding: 0,
                  cursor: canStart ? 'pointer' : 'not-allowed', opacity: canStart ? 1 : 0.5,
                }}>
                  <img
                    src={canStart ? '/assets/guest_room/btn_enter.png' : '/assets/guest_room/btn_ready.png'}
                    alt={canStart ? 'Vào' : 'Bắt đầu'}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </button>
              ) : (
                myReady ? (
                  <button type="button" onClick={handleUnready} style={{
                    flex: 1, border: 'none', background: 'none', padding: 0, cursor: 'pointer',
                  }}>
                    <img src="/assets/guest_room/btn_cancel.png" alt="Hủy" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </button>
                ) : (
                  <button onClick={handleReady} style={{
                    flex: 1, border: 'none', background: 'none', padding: 0, cursor: 'pointer',
                  }}>
                    <img src="/assets/guest_room/btn_ready.png" alt="Sẵn Sàng" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </button>
                )
              )}

              {/* Leave */}
              <button onClick={handleLeave} style={{
                flex: 1, border: 'none', background: 'none', padding: 0, cursor: 'pointer',
              }}>
                <img src="/assets/guest_room/btn_leave_the_room.png" alt="Rời Phòng" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </button>
            </div>

            {/* Host-only: Challenge + Invite row */}
            {isHost && (phase === 'waiting' || playersArr.length === 1) && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={async () => {
                    if (challengeSearching || !roomCode) return;
                    setChallengeSearching(true);
                    try {
                      await pvpApi.startChallenge(roomCode);
                      showInviteToast('✅ Đã gửi lời thách đấu!');
                    } catch (e) {
                      showInviteToast(`❌ Lỗi: ${e instanceof Error ? e.message : 'Không thể thách đấu'}`);
                    }
                    finally { setTimeout(() => setChallengeSearching(false), 10000); }
                  }}
                  disabled={challengeSearching}
                  style={{
                    flex: 1, border: 'none', background: 'none', padding: 0,
                    cursor: challengeSearching ? 'not-allowed' : 'pointer',
                    opacity: challengeSearching ? 0.6 : 1, transition: 'transform 0.1s'
                  }}
                  onPointerDown={e => !challengeSearching && (e.currentTarget.style.transform = 'scale(0.95)')}
                  onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {challengeSearching ? (
                    <div style={{
                      width: '100%', height: '100%', minHeight: 40,
                      background: '#333', borderRadius: 8, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: '#fff',
                      fontSize: 13, fontWeight: 700
                    }}>🔍 Đang tìm...</div>
                  ) : (
                    <img src="/assets/guest_room/btn_challenge.png" alt="Thách Đấu" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  )}
                </button>
                <button
                  onClick={() => void handleInviteFriend()}
                  disabled={inviteLoading}
                  style={{
                    flex: 1, border: 'none', background: 'none', padding: 0,
                    cursor: inviteLoading ? 'not-allowed' : 'pointer',
                    opacity: inviteLoading ? 0.7 : 1, transition: 'transform 0.1s'
                  }}
                  onPointerDown={e => !inviteLoading && (e.currentTarget.style.transform = 'scale(0.95)')}
                  onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <img src="/assets/guest_room/btn_invite_friends.png" alt="Mời Bạn Bè" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </button>
                <button
                  onClick={() => void handleShare()}
                  disabled={inviteLoading}
                  style={{
                    flex: 1, border: 'none', background: 'none', padding: 0,
                    cursor: inviteLoading ? 'not-allowed' : 'pointer',
                    opacity: inviteLoading ? 0.7 : 1, transition: 'transform 0.1s'
                  }}
                  onPointerDown={e => !inviteLoading && (e.currentTarget.style.transform = 'scale(0.95)')}
                  onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <img src="/assets/guest_room/btn_share.png" alt="Chia Sẻ" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ENTRY VIEW (not in room) ── */}
        {!inRoom && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {/* Khi có urlRoomCode → hiện loading, ẩn Create + manual Join */}
            {urlRoomCode ? (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                background: "url('/assets/pvp_test/frame_wood_3.png') no-repeat center center / 100% 100%",
                minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 18, color: '#FFFEA3', fontWeight: 900, fontFamily: "'Fredoka One', 'Nunito', sans-serif", textShadow: '1px 1px 2px #000' }}>
                  Đang vào phòng...
                </div>
                <div style={{ fontSize: 13, color: '#FFFEA3', fontWeight: 900, marginTop: 4, fontFamily: "'Fredoka One', 'Nunito', sans-serif", textShadow: '1px 1px 1px #000', opacity: 0.8 }}>
                  {urlRoomCode}
                </div>
              </div>
            ) : (
              <>
                <button onClick={handleCreate} disabled={connecting} style={{
                  padding: '14px', background: connecting ? '#333' : '#e94560',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 16, fontWeight: 700, cursor: connecting ? 'not-allowed' : 'pointer',
                  opacity: connecting ? 0.7 : 1,
                }}>
                  {connecting ? '⏳ ' + t('lobby.creating') : t('room.createNew')}
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={e => setInputCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    placeholder={t('room.inputPlaceholder')}
                    style={{
                      flex: 1, padding: '12px 14px', background: '#0d0d1a',
                      border: '1px solid #444', color: '#fff', borderRadius: 8,
                      fontSize: 13, outline: 'none',
                    }}
                  />
                  <button onClick={() => handleJoin()} disabled={connecting || !inputCode.trim()} style={{
                    padding: '12px 18px', background: inputCode.trim() && !connecting ? '#4fc3f7' : '#333',
                    color: '#000', border: 'none', borderRadius: 8,
                    fontSize: 13, fontWeight: 700,
                    cursor: !inputCode.trim() || connecting ? 'not-allowed' : 'pointer',
                    opacity: !inputCode.trim() || connecting ? 0.5 : 1, whiteSpace: 'nowrap',
                  }}>{t('room.join')}</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 10, padding: '10px 14px', background: '#2a0d0d',
            border: '1px solid #c62828', borderRadius: 8, color: '#ef9a9a', fontSize: 13,
          }}>
            ⚠️ {error}
            <button onClick={() => setError('')} style={{
              float: 'right', background: 'none', border: 'none', color: '#ef9a9a', cursor: 'pointer', fontSize: 14,
            }}>✕</button>
          </div>
        )}

        {/* Log hidden as requested */}
        <div style={{ display: 'none' }}>
          <div style={{ fontSize: 10, color: '#444', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Log</div>
          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {log.length === 0
              ? <div style={{ fontSize: 11, color: '#333' }}>{t('common.noActivity')}</div>
              : log.map((l, i) => (
                <div key={i} style={{
                  fontSize: 10, padding: '2px 0', borderBottom: '1px solid #0a0a1a',
                  color: l.includes('❌') || l.includes('⚠️') ? '#ef5350' : '#8bc34a',
                }}>{l}</div>
              ))
            }
          </div>
        </div>

        {/* Bottom Navigation removed as requested */}
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes comboFlash {
          0%   { transform: translateX(-50%) scale(0.5); opacity: 0; }
          20%  { transform: translateX(-50%) scale(1.1); opacity: 1; }
          80%  { transform: translateX(-50%) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) scale(0.8); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes sdFlash {
          0%   { opacity: 0.6; }
          100% { opacity: 0; }
        }
        @keyframes dmgFlash {
          0%   { opacity: 0.5; }
          100% { opacity: 0; }
        }
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          60%  { opacity: 1; transform: translateY(-44px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-80px) scale(0.8); }
        }
        @keyframes boardShake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px) rotate(-1deg); }
          30% { transform: translateX(8px) rotate(1deg); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
        }
        @keyframes dangerPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
          50% { box-shadow: 0 0 0 6px rgba(248,113,113,0.55), inset 0 0 16px rgba(248,113,113,0.08); }
        }
        @keyframes alertPop {
          0%   { opacity: 0; transform: translateX(-50%) scale(0.5); }
          20%  { opacity: 1; transform: translateX(-50%) scale(1.1); }
          80%  { opacity: 1; transform: translateX(-50%) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) scale(0.9); }
        }
        @keyframes comboBlastAnim {
          0%   { opacity: 0; transform: scale(0.5); }
          15%  { opacity: 1; transform: scale(1.15); }
          70%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }
        @keyframes ultPulse {
          0%,100% { box-shadow: 0 0 0 2px #7c3aed, 0 0 16px rgba(124,58,237,0.6); }
          50%      { box-shadow: 0 0 0 2px #a855f7, 0 0 28px rgba(168,85,247,0.8); }
        }
      `}</style>
    </div>
  );
}
