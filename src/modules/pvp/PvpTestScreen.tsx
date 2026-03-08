import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Client, type Room } from '@colyseus/sdk';
import { useAuth } from '@/shared/hooks/useAuth';

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
  winnerId?: string;
}

async function fetchPvpToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/pvp-token`, { credentials: 'include' });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Chưa đăng nhập');
    throw new Error(`Lấy token thất bại: HTTP ${res.status}`);
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
  const [selected, setSelected] = useState<number | null>(null);
  const size = mini ? 20 : 44;

  const handleClick = (idx: number) => {
    if (!onSwap || mini) return;
    if (selected === null) {
      setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    onSwap(selected, idx);
    setSelected(null);
  };

  if (!tiles.length) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(8, ${size}px)`,
      gap: mini ? 1 : 2,
      background: mini ? '#111' : '#0d1b2a',
      padding: mini ? 0 : 4,
      borderRadius: mini ? 0 : 8,
      border: mini ? 'none' : '1px solid #1e4d78',
    }}>
      {tiles.map((gem, idx) => {
        const isSelected = selected === idx;
        const isEmpty = gem === -1;
        return (
          <div
            key={idx}
            onClick={() => handleClick(idx)}
            style={{
              width: size,
              height: size,
              borderRadius: mini ? 3 : 6,
              background: isEmpty ? '#1f2937' : (GEM_COLORS[gem] ?? '#333'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: mini ? 8 : 18,
              userSelect: 'none',
              cursor: onSwap && !mini ? 'pointer' : 'default',
              border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: isSelected
                ? '0 0 8px rgba(255,255,255,0.5)'
                : isEmpty ? 'none' : `0 2px 6px ${GEM_COLORS[gem] ?? '#000'}44`,
              transform: isSelected ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.12s, border 0.12s, box-shadow 0.12s',
              opacity: isEmpty ? 0.2 : 1,
            }}
          >
            {!mini && !isEmpty && GEM_LABELS[gem]}
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
    roomRef.current.send('swap', { from, to });
  }, []);

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

    r.onMessage('state_update', (data: RoomStateBroadcast) => {
      setRoomState(data);
      setOpponentLeft(false);
      if (data.timeLeft !== undefined) setTimeLeft(data.timeLeft);
      const names = Object.values(data.players).map(p => p.name).join(', ');
      addLog(`State: [${data.phase}] cd:${data.countdown} t:${data.timeLeft ?? '-'}s | ${names || '(trống)'}`);
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
      addLog(`Kết thúc! ${iWon ? '🏆 Thắng!' : isDr ? '🤝 Hoà' : '💀 Thua'}`);
    });

    r.onMessage('sudden_death', () => {
      setIsSuddenDeath(true);
      setTimeLeft(15);
      addLog('SUDDEN DEATH! +15s, combo x1.5');
    });

    r.onMessage('timer_tick', (data: { timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
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
      if (code === 4001) {
        setOpponentLeft(false);
        setError('Bạn đã bị đuổi khỏi phòng!');
        addLog('⚠️ Bị kick khỏi phòng');
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
        setError('Token không hợp lệ — thử đăng nhập lại');
      } else if (msg.includes('not found') || msg.includes('404')) {
        setError(`Không tìm thấy phòng: ${code}`);
      } else if (msg.includes('full') || msg.includes('maxClients')) {
        setError('Phòng đã đủ 2 người');
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
    setMyArmor(0);
    setMyMana(0);
    setOpponentHp(1000);
    setOpponentArmor(0);
    addLog('Đã rời phòng');
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
      background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
      color: '#e0e0e0',
      fontFamily: 'monospace',
      padding: 16,
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

      {/* Game Over / Result screen — HP-based */}
      {showResult && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div style={{
            fontSize: 40, marginBottom: 8,
            animation: 'cdPop 0.85s ease-out forwards',
          }}>
            {isWinner ? t('result.win') : isDraw ? t('result.draw') : t('result.lose')}
          </div>

          <div style={{ fontSize: 16, color: '#94a3b8', marginBottom: 4 }}>
            {t('result.hpRemaining')}{' '}
            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{myHp}/{myMaxHp}</span>
          </div>
          <div style={{ fontSize: 16, color: '#94a3b8', marginBottom: 16 }}>
            {t('result.totalDamage')}{' '}
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{myScore.toLocaleString()}</span>
          </div>

          {gameOverPlayers.map((p, i) => (
            <div key={i} style={{
              fontSize: i === 0 ? 20 : 18,
              color: i === 0 ? '#f59e0b' : '#94a3b8',
              marginBottom: 6,
            }}>
              {i === 0 ? '🥇' : '🥈'} {p.name}: HP {(p as { hp?: number }).hp ?? '?'} | DMG {p.score.toLocaleString()}
            </div>
          ))}

          {isSuddenDeath && (
            <div style={{ color: '#a855f7', fontSize: 14, marginTop: 8, marginBottom: 4 }}>
              Sudden Death
            </div>
          )}

          <div style={{
            color: isWinner ? '#22c55e' : isDraw ? '#94a3b8' : '#ef4444',
            fontSize: 16, marginTop: 12, marginBottom: 24,
          }}>
            {isWinner ? t('result.ratingWin') : isDraw ? t('result.ratingDraw') : t('result.ratingLoss')}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => { handleLeave(); navigate('/pvp'); }} style={{
              padding: '12px 24px', background: '#3b82f6',
              color: 'white', borderRadius: 8, fontSize: 15,
              border: 'none', cursor: 'pointer', fontWeight: 700,
            }}>
              {t('result.returnLobby')}
            </button>
            <button onClick={() => navigate('/')} style={{
              padding: '12px 24px', background: 'transparent',
              color: '#94a3b8', borderRadius: 8, fontSize: 15,
              border: '1px solid #4b5563', cursor: 'pointer', fontWeight: 700,
            }}>
              {t('result.quit')}
            </button>
          </div>
        </div>
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
            ⚠️ Đối thủ đã rời phòng
          </div>
        )}

        {/* ── BOARD VIEW (phase=playing, board loaded) ── */}
        {inRoom && showBoard && (
          <div style={{ marginBottom: 16 }}>
            {/* Timer */}
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <span style={{
                fontSize: timeLeft <= 10 ? 28 : 20,
                fontWeight: 900,
                color: timeLeft <= 10 ? '#ef4444' : isSuddenDeath ? '#a855f7' : '#f59e0b',
                animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none',
              }}>
                {timeLeft}s
              </span>
              {isSuddenDeath && (
                <span style={{ fontSize: 10, color: '#a855f7', marginLeft: 6, fontWeight: 700 }}>
                  SUDDEN DEATH
                </span>
              )}
            </div>

            {/* Player HUDs with HP/Mana — campaign-aligned */}
            <div style={{
              display: 'flex', gap: 12, marginBottom: 8,
              background: '#0d1b2a', borderRadius: 8, padding: '8px 12px',
              border: '1px solid #1e4d78',
            }}>
              {/* Me */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 'bold' }}>
                    ⚔️ {myPlayer?.name ?? 'Tôi'}
                  </span>
                  <span style={{ color: '#4caf50', fontSize: 11, fontWeight: 700 }}>
                    {myScore.toLocaleString()}
                  </span>
                </div>
                <HpBar current={myHp} max={myMaxHp} armor={myArmor} label="HP" />
                <ManaBar current={myMana} max={200} />
              </div>

              <div style={{ color: '#64748b', fontSize: 11, alignSelf: 'center' }}>VS</div>

              {/* Opponent */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>
                    🛡️ {opponentPlayer?.name ?? 'Đối thủ'}
                  </span>
                  <span style={{ color: '#e94560', fontSize: 11, fontWeight: 700 }}>
                    {opponentScore.toLocaleString()}
                  </span>
                </div>
                <HpBar current={opponentHp} max={opponentMaxHp} armor={opponentArmor}
                  color="#ef4444" label="HP" />
              </div>
            </div>

            {/* My board (interactive) */}
            <div style={{
              marginBottom: 10,
              border: damageFlash ? '3px solid #ef4444' : '2px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              transition: 'border 0.1s',
              padding: 2,
            }}>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 4, paddingLeft: 4 }}>BOARD CỦA BẠN — click 2 gem kề nhau để swap</div>
              <GameBoard tiles={myBoard} onSwap={handleSwap} />
            </div>

            {/* Opponent board (mini) */}
            <div>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>BOARD ĐỐI THỦ</div>
              <GameBoard tiles={opponentBoard} mini />
            </div>

            {/* Leave button */}
            <button onClick={handleLeave} style={{
              width: '100%', marginTop: 12, padding: '10px',
              background: 'transparent', border: '1px solid #555',
              color: '#999', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            }}>🚪 Rời Phòng</button>
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
                        {p ? p.name : 'Đang chờ...'}
                        {p && isThisHost && <span style={{ fontSize: 10, color: '#fdd835', marginLeft: 6 }}>👑HOST</span>}
                        {p && isMe && <span style={{ fontSize: 10, color: '#aaa', marginLeft: 4 }}>(bạn)</span>}
                      </div>
                      {p && (
                        <div style={{ fontSize: 11, color: (isThisHost || p.ready) ? '#4caf50' : '#ff9800' }}>
                          {isThisHost ? '✓ Host' : p.ready ? '✅ Sẵn sàng' : '○ Chưa sẵn sàng'}
                        </div>
                      )}
                    </div>
                    {p && isHost && sid !== mySessionId && (
                      <button onClick={() => handleKick(sid)} style={{
                        padding: '4px 10px', background: '#5c1a1a', border: '1px solid #c62828',
                        color: '#ef9a9a', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                      }}>Đuổi</button>
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
                  {myReady ? '✅ Đã sẵn sàng' : '🙌 Sẵn Sàng'}
                </button>
              )}

              {isHost && (
                <button onClick={handleStart} disabled={!canStart} style={{
                  padding: '11px', borderRadius: 6, fontSize: 14, fontWeight: 700,
                  cursor: canStart ? 'pointer' : 'not-allowed',
                  background: canStart ? '#e94560' : '#333',
                  color: '#fff', border: 'none', opacity: canStart ? 1 : 0.5,
                }}>
                  {canStart ? '🚀 Bắt Đầu!' : '⏳ Chờ đối thủ sẵn sàng...'}
                </button>
              )}

              <button onClick={handleLeave} style={{
                padding: '10px', background: 'transparent', border: '1px solid #e94560',
                color: '#e94560', borderRadius: 6, fontSize: 13, cursor: 'pointer',
              }}>🚪 Rời Phòng</button>
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
              ? <div style={{ fontSize: 11, color: '#333' }}>Chưa có activity...</div>
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
      `}</style>
    </div>
  );
}
