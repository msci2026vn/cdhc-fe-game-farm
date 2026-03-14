import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RANK_TIERS, SUB_TIER_NAMES, getRankFromPoints } from '@/shared/api/api-pvp';
import type { RankTier } from '@/shared/api/api-pvp';
import { pvpApi } from '@/shared/api/api-pvp';

export default function RankInfoScreen() {
  const navigate = useNavigate();
  const [myRankPoints, setMyRankPoints] = useState<number | null>(null);

  useEffect(() => {
    pvpApi.getRating()
      .then(data => setMyRankPoints(data.rankPoints ?? 0))
      .catch(() => {});
  }, []);

  const myRank = myRankPoints !== null ? getRankFromPoints(myRankPoints) : null;

  return (
    <div style={{
      minHeight: '100dvh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0f3460 100%)',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      paddingBottom: 40,
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1e3a5a',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => navigate('/pvp')}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: 4 }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>🏔️ Thang Cảnh Giới</h1>
      </div>

      {/* Intro quote */}
      <div style={{ padding: '16px 16px 8px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
          "Một hạt giống giữ — ngàn đời còn ăn. Một hạt giống mất — vạn năm khó tìm."
        </p>
        <p style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>— Mẫu Kinh, trang cuối</p>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Player current rank */}
        {myRank && (
          <div style={{
            margin: '0 16px 16px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid #1e4d78',
            borderRadius: 12, padding: 12,
          }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Cảnh giới hiện tại của bạn</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28 }}>{myRank.tier.icon}</span>
              <div>
                <span style={{ fontWeight: 700, color: myRank.tier.color, fontSize: 15 }}>
                  {myRank.tier.name}
                </span>
                <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 6 }}>{myRank.subTierName}</span>
              </div>
              <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#fff', fontSize: 16 }}>
                {myRankPoints} điểm
              </span>
            </div>
          </div>
        )}

        {/* Tier list — top to bottom */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...RANK_TIERS].reverse().map(tier => {
            const isMyTier = myRank?.tier.id === tier.id;
            const isLegendary = tier.id === 'nong_thanh_ky';

            return (
              <RankTierCard
                key={tier.id}
                tier={tier}
                isMyTier={isMyTier}
                isLegendary={isLegendary}
                myProgress={isMyTier ? myRank?.progress ?? 0 : undefined}
              />
            );
          })}
        </div>

        {/* Rules section */}
        <div style={{ padding: '24px 16px 0' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 12, margin: '0 0 12px' }}>
            📜 Quy Tắc
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <RuleItem icon="⚔️" text="Thắng: cộng điểm theo cảnh giới (18–35 điểm)" />
            <RuleItem icon="💔" text="Thua: trừ điểm theo cảnh giới (15–35 điểm)" />
            <RuleItem icon="🤝" text="Hoà (Sudden Death): ±0 điểm" />
            <RuleItem icon="🚪" text="Bỏ trận giữa chừng: trừ gấp đôi" />
            <RuleItem icon="🏔️" text="Mỗi cảnh giới có 3 giai đoạn: Sơ / Trung / Hậu Kỳ" />
            <RuleItem icon="📉" text="Rank cao không chơi 7–14 ngày: decay điểm/ngày" />
            <RuleItem icon="🔄" text="Season: 3 tháng/lần, soft reset (60% + 400 điểm)" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function RankTierCard({
  tier,
  isMyTier,
  isLegendary,
  myProgress,
}: {
  tier: RankTier;
  isMyTier: boolean;
  isLegendary: boolean;
  myProgress?: number;
}) {
  const [expanded, setExpanded] = useState(isMyTier);

  return (
    <div style={{
      borderRadius: 12,
      border: isMyTier
        ? '1px solid rgba(245,158,11,0.5)'
        : isLegendary
          ? '1px solid rgba(255,215,0,0.3)'
          : '1px solid rgba(255,255,255,0.07)',
      background: isMyTier
        ? 'rgba(255,255,255,0.06)'
        : isLegendary
          ? 'linear-gradient(135deg,rgba(30,30,50,0.6),rgba(100,80,0,0.15))'
          : 'rgba(255,255,255,0.03)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          textAlign: 'left', background: 'none', border: 'none',
          color: '#e0e0e0', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 24 }}>{tier.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: tier.color, fontSize: 14 }}>
            {tier.name}
            {isMyTier && <span style={{ fontSize: 11, marginLeft: 6, color: '#f59e0b' }}>← Bạn</span>}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {tier.minPoints} – {isLegendary ? '∞' : tier.maxPoints} điểm
          </div>
        </div>

        {/* Win/Lose badge */}
        <div style={{ textAlign: 'right', fontSize: 12 }}>
          <span style={{ color: '#22c55e' }}>+{tier.winPoints}</span>
          <span style={{ color: '#475569', margin: '0 3px' }}>/</span>
          <span style={{ color: '#ef4444' }}>-{tier.losePoints}</span>
        </div>

        <span style={{
          color: '#64748b', fontSize: 10,
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▼
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          padding: '0 14px 12px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {/* Sub-tiers */}
          {!isLegendary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 10, marginBottom: 8 }}>
              {SUB_TIER_NAMES.map((sub, idx) => {
                const subSize = (tier.maxPoints - tier.minPoints + 1) / 3;
                const subMin = Math.round(tier.minPoints + idx * subSize);
                const subMax = Math.round(tier.minPoints + (idx + 1) * subSize - 1);

                return (
                  <div
                    key={sub}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 8, padding: '6px 4px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#d1d5db' }}>{sub}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{subMin}–{subMax}</div>
                  </div>
                );
              })}
            </div>
          )}

          {isLegendary && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,215,0,0.7)', textAlign: 'center' }}>
              Top 500 server — Không có Sơ/Trung/Hậu Kỳ
            </div>
          )}

          {/* Progress bar (my tier) */}
          {isMyTier && myProgress !== undefined && (
            <div style={{ marginTop: 8 }}>
              <div style={{
                height: 5, background: '#374151', borderRadius: 3, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${myProgress}%`,
                  backgroundColor: tier.color,
                  transition: 'width 0.5s',
                }} />
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'right' }}>{myProgress}%</div>
            </div>
          )}

          {/* Mẫu Kinh quote */}
          <div style={{
            marginTop: 8,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8, padding: '8px 10px',
          }}>
            <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
              "{tier.mauKinh}"
            </p>
            <p style={{ fontSize: 10, color: '#475569', marginTop: 2, margin: '2px 0 0' }}>— Mẫu Kinh</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RuleItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#94a3b8' }}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
