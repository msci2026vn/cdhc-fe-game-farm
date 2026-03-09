import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { Client, type Room } from '@colyseus/sdk';
import { useAuth } from '@/shared/hooks/useAuth';
import { pvpApi } from '@/shared/api/api-pvp';
import type { PvpRating } from '@/shared/api/api-pvp';
import PostGameScreen from './PostGameScreen';
import type { ClientMvpStats, H2HData } from './PostGameScreen';

const WS_URL = import.meta.env.DEV
  ? 'ws://localhost:3001'
  : 'wss://sta.cdhc.vn/pvp-ws';

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

// ─── Interactive Board ─────────────────────────────────────────────────────────
interface GameBoardProps {
  tiles: number[];
  mini?: boolean;
  onSwap?: (from: number, to: number) => void;
}

function GameBoard({ tiles, mini = false, onSwap }: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{
    startIdx: number;
    startX: number;
    startY: number;
    fired: boolean;
  } | null>(null);
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null);

  const getIdxAtPoint = useCallback((clientX: number, clientY: number) => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const cellW = rect.width / 8;
    const cellH = rect.height / 8;
    const col = Math.floor((clientX - rect.left) / cellW);
    const row = Math.floor((clientY - rect.top) / cellH);
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
    return row * 8 + col;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!onSwap || mini) return;
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    const idx = getIdxAtPoint(e.clientX, e.clientY);
    if (idx === null) return;
    swipeRef.current = { startIdx: idx, startX: e.clientX, startY: e.clientY, fired: false };
    setHighlightedIdx(idx);
  }, [onSwap, mini, getIdxAtPoint]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeRef.current || swipeRef.current.fired) return;
    const dx = e.clientX - swipeRef.current.startX;
    const dy = e.clientY - swipeRef.current.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 14) return;
    const startIdx = swipeRef.current.startIdx;
    const startRow = Math.floor(startIdx / 8);
    const startCol = startIdx % 8;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    let toRow = startRow;
    let toCol = startCol;
    if (horizontal) { toCol = dx > 0 ? startCol + 1 : startCol - 1; }
    else             { toRow = dy > 0 ? startRow + 1 : startRow - 1; }
    if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) {
      swipeRef.current = null;
      setHighlightedIdx(null);
      return;
    }
    swipeRef.current.fired = true;
    setHighlightedIdx(null);
    onSwap!(startIdx, toRow * 8 + toCol);
    swipeRef.current = null;
  }, [onSwap]);

  const handlePointerUp = useCallback(() => {
    swipeRef.current = null;
    setHighlightedIdx(null);
  }, []);

  if (!tiles.length) return null;

  if (mini) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 20px)',
        gap: 1,
        background: '#111',
      }}>
        {tiles.map((gem, idx) => (
          <div key={idx} style={{
            width: 20, height: 20,
            borderRadius: 3,
            background: gem === -1 ? '#1f2937' : (GEM_COLORS[gem] ?? '#333'),
            opacity: gem === -1 ? 0.2 : 1,
          }} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={boardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        gap: 2,
        background: '#0d1b2a',
        padding: 4,
        borderRadius: 8,
        border: '1px solid #1e4d78',
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'grab',
        boxSizing: 'border-box',
      }}
    >
      {tiles.map((gem, idx) => {
        const isHighlighted = highlightedIdx === idx;
        const isEmpty = gem === -1;
        return (
          <div
            key={idx}
            style={{
              borderRadius: 6,
              background: isEmpty ? '#1f2937' : (GEM_COLORS[gem] ?? '#333'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(12px, 2.5vw, 18px)',
              userSelect: 'none',
              border: isHighlighted ? '2px solid #fff' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: isHighlighted
                ? '0 0 8px rgba(255,255,255,0.5)'
                : isEmpty ? 'none' : `0 2px 6px ${GEM_COLORS[gem] ?? '#000'}44`,
              transform: isHighlighted ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.12s, border 0.12s, box-shadow 0.12s',
              opacity: isEmpty ? 0.2 : 1,
              pointerEvents: 'none',
            }}
          >
            {!isEmpty && GEM_LABELS[gem]}
          </div>
        );
      })}
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

// ─── Mana Bar ──────────────────────────────────────────────────────────────────
function ManaBar({ current, max }: { current: number; max: number }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
        <span>⭐ Mana</span><span>{current}/{max}</span>
      </div>
      <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${(current / max) * 100}%`, height: '100%',
          background: '#eab308', transition: 'width 0.3s',
        }} />
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
  const urlRoomCode = searchParams.get('roomId') ?? '';
  const clientRef = useRef<Client | null>(null);
  const roomRef = useRef<Room | null>(null);
  const autoJoinedRef = useRef(false);
  const myUserIdRef = useRef('');

  const [inRoom, setInRoom] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [inputCode, setInputCode] = useState(() => searchParams.get('roomId') ?? '');
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
  const [timeLeft, setTimeLeft] = useState(60);
  const [lobbyTimeLeft, setLobbyTimeLeft] = useState(900);
  const [isSuddenDeath, setIsSuddenDeath] = useState(false);
  const [winnerId, setWinnerId] = useState('');
  const [winnerSessionId, setWinnerSessionId] = useState('');
  const [gameOverPlayers, setGameOverPlayers] = useState<Array<{ userId: string; name: string; score: number }>>([]);
  const [junkAlert, setJunkAlert] = useState('');
  // Combat stats — aligned with campaign BossState
  const [myHp, setMyHp] = useState(1000);
  const [myMaxHp] = useState(1000);
  const [myArmor, setMyArmor] = useState(0);
  const [myMana, setMyMana] = useState(0);
  const [opponentHp, setOpponentHp] = useState(1000);
  const [opponentMaxHp] = useState(1000);
  const [opponentArmor, setOpponentArmor] = useState(0);
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

  // ── Post-game data ──
  const [myStats, setMyStats] = useState<ClientMvpStats>({
    highestCombo: 0, fastestSwapMs: 9999,
    debuffSent: 0, debuffReceived: 0,
    tauntsTotal: 0, validSwaps: 0, totalSwaps: 0,
  });
  const statsRef = useRef<ClientMvpStats>({
    highestCombo: 0, fastestSwapMs: 9999,
    debuffSent: 0, debuffReceived: 0,
    tauntsTotal: 0, validSwaps: 0, totalSwaps: 0,
  });
  const lastSwapAtRef = useRef(0);
  const gameStartAtRef = useRef(0);
  const [gameDurationMs, setGameDurationMs] = useState(0);
  const [ratingBefore, setRatingBefore] = useState(1000);
  const [ratingAfter, setRatingAfter] = useState<PvpRating | null>(null);
  const [h2hData, setH2hData] = useState<H2HData>(null);
  const [rematchState, setRematchState] = useState<'idle' | 'waiting' | 'ready'>('idle');

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

  // ── Swap handler ──
  const handleSwap = useCallback((from: number, to: number) => {
    if (!roomRef.current) return;
    statsRef.current.totalSwaps++;
    roomRef.current.send('swap', { from, to });
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
      setIsHost(data.isHost);
      setMySessionId(data.mySessionId);
      addLog(`Vào phòng | id: ${data.roomId} | host: ${data.isHost}`);
    });

    r.onMessage('rematch_request', (_data: { fromId: string }) => {
      setRematchState('ready');
    });

    r.onMessage('rematch_start', (data: { newRoomId: string; newRoomCode: string }) => {
      navigate(`/pvp-test?roomId=${data.newRoomId}`);
    });

    r.onMessage('state_update', (data: RoomStateBroadcast) => {
      setRoomState(data);
      setOpponentLeft(false);
      if (data.timeLeft !== undefined) setTimeLeft(data.timeLeft);
      if (data.lobbyTimeLeft !== undefined) setLobbyTimeLeft(data.lobbyTimeLeft);
      const names = Object.values(data.players).map(p => p.name).join(', ');
      addLog(`State: [${data.phase}] cd:${data.countdown} t:${data.timeLeft ?? '-'}s | ${names || '(trống)'}`);
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

    r.onMessage('game_start', (data: { myBoard: number[]; opponentBoard: number[] }) => {
      setMyBoard(data.myBoard);
      setOpponentBoard(data.opponentBoard);
      setMyScore(0);
      setOpponentScore(0);
      setComboText('');
      setTimeLeft(60);
      setIsSuddenDeath(false);
      setWinnerId('');
      setWinnerSessionId('');
      setGameOverPlayers([]);
      setJunkAlert('');
      // Reset combat stats
      setMyHp(1000);
      setMyArmor(0);
      setMyMana(0);
      setOpponentHp(1000);
      setOpponentArmor(0);
      // Reset taunt/debuff state
      setFloatingEmojis([]);
      setActiveDebuff(null);
      setScoreAlert(null);
      setIsDangerZone(false);
      setComboBlast(null);
      // Reset post-game tracking
      const freshStats: ClientMvpStats = {
        highestCombo: 0, fastestSwapMs: 9999,
        debuffSent: 0, debuffReceived: 0,
        tauntsTotal: 0, validSwaps: 0, totalSwaps: 0,
      };
      statsRef.current = freshStats;
      setMyStats(freshStats);
      lastSwapAtRef.current = 0;
      gameStartAtRef.current = Date.now();
      setRatingAfter(null);
      setH2hData(null);
      setRematchState('idle');
      // Capture rating before game
      pvpApi.getRating().then(r => setRatingBefore(r.rating)).catch(() => {});
      addLog('Board nhận thành công → Game bắt đầu!');
    });

    r.onMessage('board_update', (data: {
      tiles: number[]; score: number; combo: number; gained: number;
      junkReceived?: number; hp?: number; armor?: number; mana?: number;
      damageDealt?: number;
      effects?: { atk: number; hp: number; def: number; star: number };
      junkSent?: number;
    }) => {
      setMyBoard(data.tiles);
      setMyScore(data.score);
      if (data.hp !== undefined) setMyHp(data.hp);
      if (data.armor !== undefined) setMyArmor(data.armor);
      if (data.mana !== undefined) setMyMana(data.mana);
      // Track valid swap + fastest swap
      statsRef.current.validSwaps++;
      const now = Date.now();
      if (lastSwapAtRef.current > 0) {
        const ms = now - lastSwapAtRef.current;
        if (ms < statsRef.current.fastestSwapMs) statsRef.current.fastestSwapMs = ms;
      }
      lastSwapAtRef.current = now;

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
      if (data.opponentArmor !== undefined) setOpponentArmor(data.opponentArmor);
      // Update own stats (may have taken damage from opponent)
      if (data.myHp !== undefined) setMyHp(data.myHp);
      if (data.myArmor !== undefined) setMyArmor(data.myArmor);
      if (data.myMana !== undefined) setMyMana(data.myMana);
    });

    // combat_hit — mình bị đánh
    r.onMessage('combat_hit', (data: {
      damage: number; absorbed: number; remainingHp: number; remainingArmor: number;
    }) => {
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 300);
      setMyHp(data.remainingHp);
      setMyArmor(data.remainingArmor);
      addLog(`💥 Nhận ${data.damage} damage${data.absorbed > 0 ? ` (🛡️${data.absorbed} absorbed)` : ''}! HP: ${data.remainingHp}`);
    });

    r.onMessage('game_over', (data: { winnerId: string; winnerSessionId: string; players: Array<{ userId: string; name: string; score: number; hp?: number }>; isSuddenDeath: boolean }) => {
      setWinnerId(data.winnerId);
      setWinnerSessionId(data.winnerSessionId);
      setGameOverPlayers(data.players);
      setIsSuddenDeath(data.isSuddenDeath);
      const iWon = data.winnerSessionId === mySessionId;
      const isDr = data.winnerId === 'draw';
      // Snapshot stats
      const snap = { ...statsRef.current };
      setMyStats(snap);
      const duration = gameStartAtRef.current > 0 ? Date.now() - gameStartAtRef.current : 60000;
      setGameDurationMs(duration);
      addLog(`Kết thúc! ${iWon ? '🏆 Thắng!' : isDr ? '🤝 Hoà' : '💀 Thua'}`);
      // Fetch post-game data
      const oppPlayer = data.players.find(p => p.userId !== myUserIdRef.current);
      if (oppPlayer?.userId) {
        pvpApi.getRating().then(r => setRatingAfter(r)).catch(() => {});
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
        }).catch(() => {});
      } else {
        pvpApi.getRating().then(r => setRatingAfter(r)).catch(() => {});
      }
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
      setTimeLeft(60);
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
    // Strip ?roomId= from URL to prevent "Đang vào phòng..." spinner after game ends
    navigate('/pvp-test', { replace: true });
  }, [addLog, navigate]);

  const handleCreate = async () => {
    if (!clientRef.current) return;
    setError('');
    setConnecting(true);
    try {
      const token = await fetchPvpToken();
      addLog('Đang tạo phòng...');
      const r = await clientRef.current.create('pvp_room', { token });
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
      const r = await clientRef.current.joinById(code, { token });
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

  const handleReady = () => {
    if (!roomRef.current) return;
    roomRef.current.send('ready');
    setMyReady(true);
    addLog('Gửi: Sẵn sàng');
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

  // ── Auto-join khi có roomId trên URL ──
  useEffect(() => {
    if (urlRoomCode && !inRoom && !autoJoinedRef.current) {
      autoJoinedRef.current = true;
      const timer = setTimeout(() => {
        handleJoin(urlRoomCode);
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlRoomCode]);

  // ── Derived state ──
  const phase = roomState?.phase ?? 'waiting';
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
  const showResult = phase === 'finished' && winnerId !== '';
  const isWinner = winnerSessionId === mySessionId;
  const isDraw = winnerId === 'draw';

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0f1624',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: showBoard ? 0 : 16,
    }}>
      {/* Countdown overlay */}
      {showCountdown && <CountdownOverlay count={countdown} />}

      {/* Combo flash */}
      {comboText && (
        <div style={{
          position: 'fixed', top: '30%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: '#fff', padding: '12px 28px',
          borderRadius: 14, fontSize: 24, fontWeight: 900, zIndex: 100,
          animation: 'comboFlash 1.5s ease-out forwards',
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }}>
          {comboText}
        </div>
      )}

      {/* Junk alert */}
      {junkAlert && (
        <div style={{
          position: 'fixed', top: '40%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #6b7280, #374151)',
          color: '#fbbf24', padding: '10px 24px',
          borderRadius: 12, fontSize: 20, fontWeight: 900, zIndex: 101,
          animation: 'comboFlash 1.5s ease-out forwards',
          textShadow: '0 2px 6px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          border: '2px solid #ef4444',
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
          ratingBefore={ratingBefore}
          ratingAfter={ratingAfter}
          h2hData={h2hData}
          rematchState={rematchState}
          onRematch={handleRematch}
          onLeave={() => { handleLeave(); navigate('/pvp'); }}
          onQuit={() => navigate('/')}
        />
      )}

      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e94560', margin: 0 }}>🎮 PVP Arena</h1>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: '#555' }}>{WS_URL}</p>
        </div>

        {/* Status bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#0d0d1a', borderRadius: 8, padding: '8px 14px', marginBottom: 12,
          border: '1px solid #222',
        }}>
          <span style={{ fontSize: 12, color: '#aaa' }}>👤 {auth?.user?.name || '(guest)'}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
            background: inRoom ? '#1a5c2a' : connecting ? '#5c4a1a' : '#3a1a1a',
            color: inRoom ? '#4caf50' : connecting ? '#ff9800' : '#f44336',
          }}>
            {inRoom ? '● Connected' : connecting ? '◌ ...' : '○ Off'}
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

        {/* ── BOARD VIEW — campaign-style full-screen layout ── */}
        {inRoom && showBoard && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 10,
            background: 'linear-gradient(180deg,#0a1a0a 0%,#0d1a0d 40%,#0a1205 100%)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            paddingTop: 'env(safe-area-inset-top)',
          }}>
            {/* ── TOP: Opponent name + HP bar ── */}
            <div style={{
              padding: '10px 16px 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'rgba(0,0,0,0.35)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#f0ece4', letterSpacing: '0.02em' }}>
                  {opponentPlayer?.name ?? t('game.opponent')}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: opponentScore > myScore ? '#fbbf24' : '#94a3b8',
                }}>
                  {opponentScore.toLocaleString()}
                </span>
              </div>
              {/* Opponent HP bar — thick */}
              <div style={{
                width: '78%', height: 20,
                background: 'rgba(0,0,0,0.55)',
                borderRadius: 10,
                border: `2px solid ${opponentHp < opponentMaxHp * 0.3 ? 'rgba(239,68,68,0.5)' : 'rgba(74,222,128,0.35)'}`,
                overflow: 'hidden', position: 'relative',
              }}>
                <div style={{
                  width: `${Math.max(0, (opponentHp / opponentMaxHp) * 100)}%`,
                  height: '100%',
                  background: opponentHp < opponentMaxHp * 0.3
                    ? 'linear-gradient(90deg,#dc2626,#f87171)'
                    : 'linear-gradient(90deg,#16a34a,#4ade80,#86efac)',
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 8px rgba(74,222,128,0.4)',
                }} />
                <span style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                }}>
                  {opponentHp}/{opponentMaxHp}{opponentArmor > 0 ? ` 🛡️${opponentArmor}` : ''}
                </span>
              </div>
            </div>

            {/* ── AVATAR ROW: me (left) + opp (right) ── */}
            <div style={{
              padding: '4px 14px',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              {/* My avatar + HP/MP bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flex: 1 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  border: '3px solid #854d0e',
                  boxShadow: '0 0 0 2px #a16207, 0 4px 10px rgba(0,0,0,0.6)',
                  background: '#1a2e1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  👤
                </div>
                <div style={{ flex: 1, maxWidth: 140 }}>
                  <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, marginBottom: 3 }}>
                    {myPlayer?.name ?? t('game.you')} · <span style={{ color: myScore > opponentScore ? '#4ade80' : '#94a3b8' }}>{myScore.toLocaleString()}</span>
                  </div>
                  <HpBar current={myHp} max={myMaxHp} armor={myArmor} label="HP" />
                  <ManaBar current={myMana} max={200} />
                </div>
              </div>
              {/* Opponent avatar — bigger */}
              <div style={{
                width: 68, height: 68, borderRadius: '50%', flexShrink: 0,
                border: '3px solid #7f1d1d',
                boxShadow: '0 0 0 2px #991b1b, 0 4px 14px rgba(0,0,0,0.7)',
                background: '#2e1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              }}>
                👹
              </div>
            </div>

            {/* ── BOARD — wood-frame, fills remaining space ── */}
            <div style={{
              flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '2px 8px', overflow: 'hidden',
            }}>
              <div style={{
                width: '100%', aspectRatio: '1 / 1', maxHeight: '100%',
                borderRadius: 14, padding: 6,
                background: '#1a2e0a',
                boxShadow: `
                  0 0 0 3px #3d2b0a,
                  0 0 0 6px #5c3d0a,
                  0 0 0 8px #3d2b0a,
                  0 8px 32px rgba(0,0,0,0.7)
                `,
                position: 'relative',
                border: damageFlash ? '2px solid #ef4444'
                  : isDangerZone ? '2px solid #f87171'
                  : '2px solid transparent',
                transition: 'border 0.1s',
                animation: activeDebuff?.type === 'shake'
                  ? 'boardShake 0.4s ease-in-out 5'
                  : isDangerZone
                  ? 'dangerPulse 0.8s ease-in-out infinite'
                  : 'none',
              }}>
                <GameBoard tiles={myBoard} onSwap={handleSwap} />
                {/* Freeze overlay */}
                {activeDebuff?.type === 'freeze' && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(147,210,255,0.18)',
                    backdropFilter: 'blur(1px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 48, borderRadius: 14,
                    pointerEvents: 'none', zIndex: 5,
                  }}>❄️</div>
                )}
              </div>
            </div>

            {/* ── TIMER + mini opponent board ── */}
            <div style={{
              padding: '2px 14px 4px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              {/* Mini opponent board */}
              <div>
                <div style={{ fontSize: 9, color: '#4a5568', marginBottom: 2 }}>{t('game.opponentBoard')}</div>
                <GameBoard tiles={opponentBoard} mini />
              </div>
              {/* Timer */}
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: timeLeft <= 10 ? 24 : 18, fontWeight: 900,
                  color: timeLeft <= 10 ? '#f87171' : isSuddenDeath ? '#a855f7' : '#86efac',
                  padding: '3px 12px',
                  background: 'rgba(0,0,0,0.45)',
                  borderRadius: 20,
                  border: `1px solid ${timeLeft <= 10 ? 'rgba(248,113,113,0.45)' : 'rgba(74,222,128,0.25)'}`,
                  animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none',
                  opacity: activeDebuff?.type === 'hide_timer' ? 0 : 1,
                  transition: 'opacity 0.2s',
                  display: 'inline-block',
                }}>
                  {isSuddenDeath ? `☠️ ${timeLeft}s` : `⏱ ${timeLeft}s`}
                </span>
                {isSuddenDeath && (
                  <div style={{ fontSize: 9, color: '#a855f7', fontWeight: 700, marginTop: 2 }}>SUDDEN DEATH</div>
                )}
              </div>
            </div>

            {/* ── BOTTOM: Emoji bar + leave ── */}
            <div style={{
              padding: '6px 10px',
              paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
              background: 'rgba(40,22,5,0.75)',
              borderTop: '2px solid #4a2d08',
              flexShrink: 0,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
              }}>
                {(['😂', '😤', '🔥', '💀', '👑', '🫵'] as const).map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => sendTaunt(emoji)}
                    disabled={emojiCooldown}
                    style={{
                      fontSize: 22, background: 'none', border: 'none',
                      padding: '6px 4px', borderRadius: 8,
                      cursor: emojiCooldown ? 'not-allowed' : 'pointer',
                      opacity: emojiCooldown ? 0.3 : 1,
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'scale(1.35)'; }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={handleLeave}
                  style={{
                    padding: '6px 12px', background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.5)',
                    color: '#f87171', borderRadius: 20,
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  🚪
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LOBBY VIEW ── */}
        {inRoom && !showBoard && roomState && (
          <div style={{ background: '#0d1b2a', border: '1px solid #1e4d78', borderRadius: 8, padding: 14, marginBottom: 12 }}>

            {/* Room header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>MÃ PHÒNG (join)</div>
                <div style={{
                  fontSize: 13, fontWeight: 800, letterSpacing: 1, color: '#e94560',
                  cursor: 'pointer', wordBreak: 'break-all',
                }} title="Click copy" onClick={() => { navigator.clipboard?.writeText(roomId); addLog('Copied room ID'); }}>
                  {roomId}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>PHASE</div>
                <div style={{
                  fontSize: 15, fontWeight: 700, textTransform: 'uppercase',
                  color: phase === 'ready' ? '#4caf50' : phase === 'waiting' ? '#ff9800' : '#4fc3f7',
                }}>{phase}</div>
              </div>
            </div>

            {/* Lobby countdown timer — only visible in waiting phase */}
            {(phase === 'waiting' || phase === 'ready') && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '8px 0', borderTop: '1px solid #1e3a5a',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 26, fontWeight: 800, color: lobbyTimerColor,
                  transition: 'color 0.5s ease',
                  animation: lobbyTimeLeft <= 60 ? 'pulse 1s infinite' : 'none',
                }}>
                  <span style={{ fontSize: 18 }}>⏱</span>
                  <span>{lobbyMins}:{lobbySecs}</span>
                </div>
                <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {lobbyTimeLeft <= 60 ? t('game.lobbyClosingSoon') : t('game.lobbyCloseIn')}
                </span>
              </div>
            )}

            {/* Player slots */}
            <div style={{ borderTop: '1px solid #1e3a5a', paddingTop: 10, marginBottom: 10 }}>
              {[0, 1].map(i => {
                const [sid, p] = playersArr[i] ?? ['', undefined];
                const isThisHost = sid === hostSessionId;
                const isMe = sid === mySessionId;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 0', opacity: p ? 1 : 0.35,
                    borderBottom: i === 0 ? '1px solid #1e3a5a' : 'none',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? '#e94560' : '#4fc3f7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>P{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {p ? p.name : t('game.waitingPlayer')}
                        {p && isThisHost && <span style={{ fontSize: 10, color: '#fdd835', marginLeft: 6 }}>👑HOST</span>}
                        {p && isMe && <span style={{ fontSize: 10, color: '#aaa', marginLeft: 4 }}>{t('game.youLabel')}</span>}
                      </div>
                      {p && (
                        <div style={{ fontSize: 11, color: (isThisHost || p.ready) ? '#4caf50' : '#ff9800' }}>
                          {isThisHost ? '✓ Host' : p.ready ? `✅ ${t('game.ready')}` : `○ ${t('game.notReady')}`}
                        </div>
                      )}
                    </div>
                    {p && isHost && sid !== mySessionId && (
                      <button onClick={() => handleKick(sid)} style={{
                        padding: '4px 10px', background: '#5c1a1a', border: '1px solid #c62828',
                        color: '#ef9a9a', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                      }}>{t('game.kick')}</button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!isHost && (
                <button onClick={handleReady} disabled={myReady} style={{
                  padding: '11px', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: myReady ? 'default' : 'pointer',
                  background: myReady ? '#1a5c2a' : '#1e88e5',
                  color: '#fff', border: 'none', opacity: myReady ? 0.7 : 1,
                }}>
                  {myReady ? `✅ ${t('game.ready')}` : `🙌 ${t('game.setReady')}`}
                </button>
              )}

              {isHost && (
                <button onClick={handleStart} disabled={!canStart} style={{
                  padding: '11px', borderRadius: 6, fontSize: 14, fontWeight: 700,
                  cursor: canStart ? 'pointer' : 'not-allowed',
                  background: canStart ? '#e94560' : '#333',
                  color: '#fff', border: 'none', opacity: canStart ? 1 : 0.5,
                }}>
                  {canStart ? `🚀 ${t('game.startGame')}` : `⏳ ${t('game.waitingOpponent')}`}
                </button>
              )}

              <button onClick={handleLeave} style={{
                padding: '10px', background: 'transparent', border: '1px solid #e94560',
                color: '#e94560', borderRadius: 6, fontSize: 13, cursor: 'pointer',
              }}>🚪 {t('game.leave')}</button>
            </div>
          </div>
        )}

        {/* ── ENTRY VIEW (not in room) ── */}
        {!inRoom && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {/* Khi có urlRoomCode → hiện loading, ẩn Create + manual Join */}
            {urlRoomCode ? (
              <div style={{
                textAlign: 'center', padding: '24px 16px',
                background: '#0d1b2a', borderRadius: 8, border: '1px solid #1e4d78',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 15, color: '#4fc3f7', fontWeight: 700 }}>
                  {t('room.joining')}
                </div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
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

        {/* Log */}
        <div style={{ background: '#050510', border: '1px solid #1a1a2e', borderRadius: 8, padding: '8px 12px' }}>
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
