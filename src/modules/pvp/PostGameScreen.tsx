import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import type { PvpRating } from '@/shared/api/api-pvp';
import { SKILL_GROUPS, STAT_DEFS, getRankFromPoints } from '@/shared/api/api-pvp';
import { ProofBadge } from './components/ProofBadge';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientMvpStats = {
  highestCombo: number;
  fastestSwapMs: number;
  debuffSent: number;
  debuffReceived: number;
  tauntsTotal: number;
  validSwaps: number;
  totalSwaps: number;
};

export type H2HData = {
  total: number;
  myWins: number;
  oppWins: number;
  draws: number;
} | null;

interface PostGameProps {
  isWinner: boolean;
  isDraw: boolean;
  isSuddenDeath: boolean;
  myScore: number;
  opponentScore: number;
  myHp: number;
  myMaxHp: number;
  opponentHp: number;
  myName: string;
  opponentName: string;
  gameDurationMs: number;
  myStats: ClientMvpStats;
  ratingBefore: number;
  ratingAfter: PvpRating | null;
  h2hData: H2HData;
  rematchState: 'idle' | 'waiting' | 'ready';
  onRematch: () => void;
  onLeave: () => void;
  onQuit: () => void;
  // Proof-of-Play (optional — populated async after match)
  proofMerkleRoot?: string | null;
  proofTxHash?:     string | null;
  proofIpfsHash?:   string | null;
  proofMoveCount?:  number;
  // Build reveal (Prompt 8)
  myBuild?: BuildData | null;
  opponentBuild?: BuildData | null;
}

type BuildData = {
  str: number; vit: number; wis: number; arm: number; mana: number;
  skillA: string; skillB: string; skillC: string;
};

// ─── ResultHero ───────────────────────────────────────────────────────────────

function ResultHero({ isWinner, isDraw }: { isWinner: boolean; isDraw: boolean }) {
  const { t } = useTranslation('pvp');
  const icon = isDraw ? '🤝' : isWinner ? '🏆' : '💀';
  const text = isDraw
    ? t('postGame.draw')
    : isWinner
    ? t('postGame.win')
    : t('postGame.lose');

  return (
    <div style={{ textAlign: 'center', padding: '28px 0 20px', position: 'relative' }}>
      <div style={{
        fontSize: 72,
        display: 'block',
        marginBottom: 8,
        animation: 'pgIconIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        {icon}
      </div>
      <div style={{
        fontFamily: "'Syne', -apple-system, sans-serif",
        fontSize: 30,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        animation: 'pgTextUp 0.5s 0.2s ease both',
        color: isDraw ? '#94a3b8' : isWinner ? '#f0c040' : '#6b6870',
        textShadow: isWinner && !isDraw ? '0 0 30px rgba(240,192,64,0.5)' : 'none',
      }}>
        {text}
      </div>
      {isWinner && !isDraw && (
        <>
          <span style={{
            position: 'absolute', top: 32, left: '30%',
            fontSize: 24, animation: 'pgConfettiL 1s 0.3s ease-out both', pointerEvents: 'none',
          }}>🎊</span>
          <span style={{
            position: 'absolute', top: 32, right: '30%',
            fontSize: 24, animation: 'pgConfettiR 1s 0.5s ease-out both', pointerEvents: 'none',
          }}>🎉</span>
        </>
      )}
    </div>
  );
}

// ─── ScoreSummary ─────────────────────────────────────────────────────────────

function ScoreSummary({
  myScore, opponentScore, myHp, myMaxHp, opponentHp,
  myName, opponentName, gameDurationMs, isSuddenDeath,
}: {
  myScore: number; opponentScore: number;
  myHp: number; myMaxHp: number; opponentHp: number;
  myName: string; opponentName: string;
  gameDurationMs: number; isSuddenDeath: boolean;
}) {
  const { t } = useTranslation('pvp');
  const mins = Math.floor(gameDurationMs / 60000);
  const secs = Math.floor((gameDurationMs % 60000) / 1000);
  const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div style={{
      margin: '0 16px 16px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '14px 16px',
    }}>
      {/* Scores */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{myName}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b', fontFamily: "'Syne', sans-serif" }}>
            {myScore.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>❤️ {myHp}/{myMaxHp}</div>
        </div>
        <div style={{ fontSize: 14, color: '#475569', fontWeight: 700 }}>VS</div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{opponentName}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#e94560', fontFamily: "'Syne', sans-serif" }}>
            {opponentScore.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>❤️ {opponentHp}</div>
        </div>
      </div>

      {/* Duration + Sudden Death */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, color: '#64748b' }}>
        <span>⏱ {t('postGame.duration')}: <strong style={{ color: '#94a3b8' }}>{durationStr}</strong></span>
        {isSuddenDeath && (
          <span style={{ color: '#a855f7', fontWeight: 700 }}>⚡ {t('postGame.suddenDeath')}</span>
        )}
      </div>
    </div>
  );
}

// ─── RatingChange ─────────────────────────────────────────────────────────────

function RatingChange({ ratingBefore, ratingAfter }: { ratingBefore: number; ratingAfter: PvpRating | null }) {
  const { t } = useTranslation('pvp');
  if (!ratingAfter) return null;

  const prevPoints = ratingBefore;
  const newPoints = ratingAfter.rankPoints ?? ratingAfter.rating;
  const delta = newPoints - prevPoints;
  const sign = delta >= 0 ? '+' : '';
  const color = delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#94a3b8';

  const prevRank = getRankFromPoints(prevPoints);
  const newRank = getRankFromPoints(newPoints);

  return (
    <div style={{
      margin: '0 16px 14px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '12px 16px',
    }}>
      {/* Tier icons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 24 }}>{prevRank.tier.icon}</span>
        {prevRank.tier.id !== newRank.tier.id && (
          <>
            <span style={{ color: '#475569', fontSize: 14 }}>→</span>
            <span style={{ fontSize: 24, animation: 'pgIconIn 0.6s ease both' }}>{newRank.tier.icon}</span>
          </>
        )}
      </div>
      <div style={{ textAlign: 'center', fontWeight: 700, color: newRank.tier.color, fontSize: 14, marginBottom: 6 }}>
        {newRank.tier.name} {newRank.subTierName}
      </div>

      {/* Points change */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>{prevPoints}</span>
        <span style={{ fontSize: 11, color: '#475569' }}>→</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', fontFamily: "'Syne', sans-serif" }}>
          {newPoints}
        </span>
        <span style={{
          fontSize: 13, fontWeight: 700, color,
          background: `${color}18`, borderRadius: 8, padding: '2px 8px',
        }}>
          {sign}{delta}
        </span>
      </div>
    </div>
  );
}

// ─── MVP Stats Grid ───────────────────────────────────────────────────────────

const STAT_CONFIG = [
  {
    key: 'highestCombo',
    labelKey: 'postGame.highestCombo',
    icon: '🔥',
    format: (v: number) => `×${v}`,
    higherIsBetter: true,
  },
  {
    key: 'fastestSwap',
    labelKey: 'postGame.fastestSwap',
    icon: '⚡',
    format: (v: number) => v >= 9999 ? '—' : `${(v / 1000).toFixed(2)}s`,
    higherIsBetter: false,
  },
  {
    key: 'debuffSent',
    labelKey: 'postGame.debuffSent',
    icon: '😤',
    format: (v: number) => `${v}`,
    higherIsBetter: true,
  },
  {
    key: 'debuffReceived',
    labelKey: 'postGame.debuffReceived',
    icon: '🛡️',
    format: (v: number) => `${v}`,
    higherIsBetter: false,
  },
  {
    key: 'accuracyRate',
    labelKey: 'postGame.accuracyRate',
    icon: '🎯',
    format: (v: number) => `${v}%`,
    higherIsBetter: true,
  },
  {
    key: 'tauntsTotal',
    labelKey: 'postGame.tauntsTotal',
    icon: '💬',
    format: (v: number) => `${v}`,
    higherIsBetter: true,
  },
] as const;

function MvpStatsGrid({ stats }: { stats: ClientMvpStats }) {
  const { t } = useTranslation('pvp');
  const accuracyRate = Math.round((stats.validSwaps / Math.max(stats.totalSwaps, 1)) * 100);

  const values: Record<string, number> = {
    highestCombo: stats.highestCombo,
    fastestSwap: stats.fastestSwapMs,
    debuffSent: stats.debuffSent,
    debuffReceived: stats.debuffReceived,
    accuracyRate,
    tauntsTotal: stats.tauntsTotal,
  };

  return (
    <div style={{ margin: '0 16px 14px' }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {t('postGame.mvpStats')}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
      }}>
        {STAT_CONFIG.map(({ key, labelKey, icon, format }, i) => {
          const val = values[key] ?? 0;
          return (
            <div
              key={key}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: '12px 8px',
                textAlign: 'center',
                position: 'relative',
                animation: `pgCardReveal 0.4s ${i * 0.08}s ease both`,
              }}
            >
              <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{icon}</span>
              <span style={{
                fontFamily: "'Syne', -apple-system, sans-serif",
                fontSize: 17,
                fontWeight: 700,
                display: 'block',
                color: '#e2e8f0',
              }}>
                {format(val as never)}
              </span>
              <span style={{ fontSize: 10, color: '#475569', display: 'block', marginTop: 2 }}>
                {t(labelKey)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Head-to-Head Banner ──────────────────────────────────────────────────────

function HeadToHeadBanner({ h2h, opponentName }: { h2h: H2HData; opponentName: string }) {
  const { t } = useTranslation('pvp');
  if (!h2h || h2h.total === 0) return null;

  const label =
    h2h.myWins > h2h.oppWins
      ? t('postGame.h2hLeading')
      : h2h.myWins < h2h.oppWins
      ? t('postGame.h2hTrailing', { name: opponentName })
      : t('postGame.h2hTie');

  return (
    <div style={{
      margin: '0 16px 14px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
    }}>
      <span style={{ fontSize: 11, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {t('postGame.h2hTitle')}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: '#22c55e' }}>
          {h2h.myWins}
        </span>
        <span style={{ fontSize: 18, color: '#475569' }}>—</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: '#ef4444' }}>
          {h2h.oppWins}
        </span>
      </div>
      <span style={{ fontSize: 12, color: '#64748b' }}>
        {h2h.draws > 0 && `${t('postGame.h2hDraws', { count: h2h.draws })} · `}
        {label}
      </span>
    </div>
  );
}

// ─── Share Button ─────────────────────────────────────────────────────────────

function ShareButton({ targetRef }: { targetRef: React.RefObject<HTMLDivElement> }) {
  const { t } = useTranslation('pvp');
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!targetRef.current || sharing) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#0a0a14',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], 'pvp-result.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          navigator.share({ files: [file], title: 'PVP Result - CDHC' }).catch(() => {});
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'pvp-result.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setSharing(false);
    }
  }, [sharing, targetRef]);

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      style={{
        width: '100%',
        padding: '13px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.06)',
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: 600,
        cursor: sharing ? 'not-allowed' : 'pointer',
        opacity: sharing ? 0.6 : 1,
      }}
    >
      {sharing ? t('postGame.sharing') : t('postGame.share')}
    </button>
  );
}

// ─── Rematch Area ─────────────────────────────────────────────────────────────

function RematchArea({
  rematchState,
  onRematch,
}: {
  rematchState: 'idle' | 'waiting' | 'ready';
  onRematch: () => void;
}) {
  const { t } = useTranslation('pvp');

  if (rematchState === 'waiting') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '13px', color: '#64748b', fontSize: 14, fontStyle: 'italic',
      }}>
        <span style={{ animation: 'pgSpin 1.2s linear infinite', display: 'inline-block' }}>⏳</span>
        {t('postGame.rematchWaiting')}
      </div>
    );
  }

  const isReady = rematchState === 'ready';
  return (
    <button
      onClick={onRematch}
      style={{
        width: '100%',
        padding: '14px',
        borderRadius: 12,
        border: 'none',
        background: isReady
          ? 'linear-gradient(135deg,#16a34a,#15803d)'
          : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
        color: '#fff',
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        animation: isReady ? 'pgRematchPulse 1s ease infinite' : 'none',
      }}
    >
      {isReady ? t('postGame.rematchConfirm') : t('postGame.rematch')}
    </button>
  );
}

// ─── PostGameScreen (main export) ─────────────────────────────────────────────

export default function PostGameScreen({
  isWinner,
  isDraw,
  isSuddenDeath,
  myScore,
  opponentScore,
  myHp,
  myMaxHp,
  opponentHp,
  myName,
  opponentName,
  gameDurationMs,
  myStats,
  ratingBefore,
  ratingAfter,
  h2hData,
  rematchState,
  onRematch,
  onLeave,
  onQuit,
  proofMerkleRoot,
  proofTxHash,
  proofIpfsHash,
  proofMoveCount,
  myBuild,
  opponentBuild,
}: PostGameProps) {
  const { t } = useTranslation('pvp');
  const shareRef = useRef<HTMLDivElement>(null!);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(8,8,18,0.97)',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      {/* Shareable content area */}
      <div
        ref={shareRef}
        style={{
          maxWidth: 480,
          margin: '0 auto',
          paddingBottom: 24,
          background: 'linear-gradient(180deg,#0d0d1a 0%,#0a0a14 100%)',
          minHeight: '100dvh',
        }}
      >
        <ResultHero isWinner={isWinner} isDraw={isDraw} />

        <ScoreSummary
          myScore={myScore}
          opponentScore={opponentScore}
          myHp={myHp}
          myMaxHp={myMaxHp}
          opponentHp={opponentHp}
          myName={myName}
          opponentName={opponentName}
          gameDurationMs={gameDurationMs}
          isSuddenDeath={isSuddenDeath}
        />

        <RatingChange ratingBefore={ratingBefore} ratingAfter={ratingAfter} />

        <MvpStatsGrid stats={myStats} />

        <HeadToHeadBanner h2h={h2hData} opponentName={opponentName} />

        {/* Build reveal */}
        {(myBuild || opponentBuild) && (
          <div style={{ margin: '0 16px 14px' }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Build Chien Dau
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {myBuild && <BuildRevealCard label={myName} build={myBuild} isWinner={isWinner && !isDraw} />}
              {opponentBuild && <BuildRevealCard label={opponentName} build={opponentBuild} isWinner={!isWinner && !isDraw} />}
            </div>
          </div>
        )}

        {/* Tier change display */}
        <TierChangeDisplay ratingBefore={ratingBefore} ratingAfter={ratingAfter} />

        {/* On-chain proof badge */}
        <div style={{ margin: '0 16px 14px' }}>
          <ProofBadge
            merkleRoot={proofMerkleRoot}
            txHash={proofTxHash}
            ipfsHash={proofIpfsHash}
            moveCount={proofMoveCount}
          />
        </div>

        {/* Action buttons */}
        <div style={{ padding: '4px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <RematchArea rematchState={rematchState} onRematch={onRematch} />

          <ShareButton targetRef={shareRef} />

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onLeave}
              style={{
                flex: 2,
                padding: '13px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg,#1e4d78,#0f3460)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t('postGame.returnLobby')}
            </button>
            <button
              onClick={onQuit}
              style={{
                flex: 1,
                padding: '13px',
                borderRadius: 12,
                border: '1px solid #374151',
                background: 'transparent',
                color: '#4b5563',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('postGame.quit')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pgIconIn {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg);   opacity: 1; }
        }
        @keyframes pgTextUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes pgConfettiL {
          0%   { opacity: 1; transform: translate(0,0) rotate(0deg); }
          100% { opacity: 0; transform: translate(-50px,-80px) rotate(-360deg); }
        }
        @keyframes pgConfettiR {
          0%   { opacity: 1; transform: translate(0,0) rotate(0deg); }
          100% { opacity: 0; transform: translate(50px,-80px) rotate(360deg); }
        }
        @keyframes pgCardReveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pgSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pgRematchPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  );
}

// ─── TierChangeDisplay (using Cảnh Giới) ────────────────────────────────────

function TierChangeDisplay({ ratingBefore, ratingAfter }: { ratingBefore: number; ratingAfter: PvpRating | null }) {
  if (!ratingAfter) return null;

  const prevPoints = ratingBefore;
  const newPoints = ratingAfter.rankPoints ?? ratingAfter.rating;
  const prevRank = getRankFromPoints(prevPoints);
  const newRank = getRankFromPoints(newPoints);
  const tierChanged = prevRank.tier.id !== newRank.tier.id;
  const tierUp = newRank.tier.minPoints > prevRank.tier.minPoints;

  if (!tierChanged) return null;

  return (
    <div style={{
      margin: '0 16px 14px',
      background: tierUp ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
      border: `1px solid ${tierUp ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: 12, padding: '14px 16px',
      textAlign: 'center',
    }}>
      {tierUp ? (
        <>
          <div style={{
            fontSize: 14, fontWeight: 700,
            color: '#f59e0b', marginBottom: 6,
            animation: 'pgIconIn 0.6s ease both',
          }}>
            🎉 THĂNG CẢNH GIỚI!
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>{prevRank.tier.icon}</span>
            <span style={{ color: '#475569' }}>→</span>
            <span style={{ fontSize: 28, animation: 'pgIconIn 0.6s 0.2s ease both' }}>{newRank.tier.icon}</span>
          </div>
          <div style={{ fontWeight: 700, color: newRank.tier.color, fontSize: 16 }}>{newRank.tier.name}</div>
          <div style={{
            fontSize: 12, color: 'rgba(245,158,11,0.7)', fontStyle: 'italic',
            marginTop: 6, padding: '0 8px',
          }}>
            "{newRank.tier.mauKinh}"
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>
            Rớt Cảnh Giới
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{prevRank.tier.icon}</span>
            <span style={{ color: '#475569' }}>→</span>
            <span style={{ fontSize: 20 }}>{newRank.tier.icon}</span>
          </div>
          <div style={{ fontWeight: 600, color: newRank.tier.color, fontSize: 13, marginTop: 4 }}>{newRank.tier.name}</div>
        </>
      )}
    </div>
  );
}

// ─── BuildRevealCard ────────────────────────────────────────────────────────

function BuildRevealCard({
  label, build, isWinner,
}: {
  label: string;
  build: BuildData;
  isWinner: boolean;
}) {
  const allSkills = [...SKILL_GROUPS.A, ...SKILL_GROUPS.B, ...SKILL_GROUPS.C];
  const skills = [build.skillA, build.skillB, build.skillC]
    .filter(Boolean)
    .map(id => allSkills.find(s => s.id === id))
    .filter(Boolean);

  return (
    <div style={{
      background: 'rgba(30,40,60,0.6)', borderRadius: 12, padding: 10,
      border: isWinner ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
        {label} {isWinner && '\u{1F451}'}
      </div>
      {/* Stats mini bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
        {STAT_DEFS.map(stat => {
          const val = build[stat.key as keyof BuildData] as number;
          return (
            <div key={stat.key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 9, width: 14 }}>{stat.icon}</span>
              <div style={{ flex: 1, height: 3, background: '#374151', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${(val / 30) * 100}%`,
                  background: stat.color,
                }} />
              </div>
              <span style={{ fontSize: 9, color: '#94a3b8', width: 14, textAlign: 'right' }}>{val}</span>
            </div>
          );
        })}
      </div>
      {/* Skills */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {skills.map(skill => (
          <span key={skill!.id} style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: 6,
            padding: '1px 5px', fontSize: 9, display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <span>{skill!.icon}</span>
            <span style={{ color: '#d1d5db' }}>{skill!.name}</span>
          </span>
        ))}
        {skills.length === 0 && (
          <span style={{ fontSize: 9, color: '#6b7280' }}>No skills</span>
        )}
      </div>
    </div>
  );
}
