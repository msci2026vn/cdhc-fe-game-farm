import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RANK_TIERS, SUB_TIER_NAMES, getRankFromPoints } from '@/shared/api/api-pvp';
import { pvpApi } from '@/shared/api/api-pvp';

// Use a more robust font stack
const FONT = "'Fredoka One', 'Nunito', 'Segoe UI', Tahoma, sans-serif";

export default function RankInfoScreen() {
  const navigate = useNavigate();
  const [myRankPoints, setMyRankPoints] = useState<number | null>(null);

  useEffect(() => {
    pvpApi.getRating()
      .then(data => {
        setMyRankPoints(data.rankPoints ?? 0);
      })
      .catch(() => {
        setMyRankPoints(0); // Fallback to 0 if API fails
      });
  }, []);

  const myRank = getRankFromPoints(myRankPoints ?? 0);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      minHeight: '100dvh',
      background: '#0a1208',
    }}>
      {/* Mobile container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 430,
        height: '100dvh',
        overflow: 'hidden',
      }}>
        {/* Layer 0: Background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/assets/rank/background_rank.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }} />

        {/* Layer 1.5: Banner header */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '24%',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '0%',
          paddingLeft: '11%',
          paddingRight: '11%',
          boxSizing: 'border-box',
          pointerEvents: 'none',
        }}>
          {/* Back button */}
          <button
            onClick={() => navigate('/pvp')}
            style={{
              position: 'absolute',
              top: 15, left: 15,
              width: 32, height: 32,
              borderRadius: '50%',
              border: '2px solid rgba(139,94,42,0.4)',
              background: 'rgba(255,255,255,0.05)',
              color: '#4A2D12',
              fontSize: 16,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'auto',
            }}
          >←</button>

          <h2 style={{
            margin: '0 0 2px',
            position: 'relative',
            top: -12,
            fontFamily: FONT,
            fontSize: 18,
            color: '#348126',
            textTransform: 'uppercase',
            WebkitTextStroke: '1px #734F26',
            whiteSpace: 'nowrap',
          }}>🏔️ Thang Cảnh Giới</h2>

          <div style={{ textAlign: 'center', maxWidth: '85%' }}>
            <p style={{
              margin: 0, fontSize: 9, fontStyle: 'italic', fontWeight: 800, color: '#4A2D12', lineHeight: 1.3
            }}>
              "Một hạt giống giữ — ngàn đời còn ăn.<br />
              Một hạt giống mất — vạn năm khó tìm."
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 8, color: '#7C5233', fontWeight: 800 }}>
              — Mẫu Kinh, trang cuối
            </p>
          </div>
        </div>

        {/* ── Layer 2: Frame Rank Overlay ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/assets/rank/frame_rank.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          zIndex: 30,
        }} />

        {/* ── Layer 1.8: FIXED Current Rank Info (Split to match background frames) ── */}
        {myRank && (
          <div style={{
            position: 'absolute',
            top: '18%', left: '11%', right: '11%',
            height: '11%',
            zIndex: 35,
            display: 'flex', alignItems: 'stretch',
            boxSizing: 'border-box',
          }}>
            {/* LEFT SECTION (Large frame in background) */}
            <div style={{
              flex: '7.3 1 0',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center',
              paddingLeft: 40,
              position: 'relative',
            }}>
              {/* Label centered over the content area */}
              <div style={{
                position: 'absolute', top: 20, left: 27, right: 0,
                fontSize: 7, fontWeight: 950, color: '#FEF08A',
                textTransform: 'uppercase', letterSpacing: 0.8,
                textAlign: 'center',
                textShadow: '0 1.5px 3px #000',
                opacity: 0.95
              }}>Cảnh giới của bạn</div>

              <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
                {/* Icon with glow */}
                <div style={{
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'radial-gradient(circle, rgba(253,224,71,0.4) 0%, transparent 70%)',
                  borderRadius: '50%',
                  flexShrink: 0,
                  position: 'relative',
                  top: -7,
                  left: -10,
                }}>
                  <span style={{ fontSize: 24, filter: 'drop-shadow(0 2px 4px #000)' }}>{myRank.tier.icon}</span>
                </div>

                {/* Names */}
                <div style={{
                  flex: 1, paddingLeft: 12, marginTop: 10,
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <div style={{
                    fontFamily: "'Nunito', sans-serif", fontSize: 13,
                    fontWeight: 900,
                    color: '#FFF',
                    WebkitTextStroke: '0.5px #2D1A0A',
                    filter: 'drop-shadow(0 1px 2px #000)',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                  }}>{myRank.tier.name}</div>
                  <div style={{
                    fontFamily: "'Nunito', sans-serif", fontSize: 9.5, fontWeight: 900,
                    color: '#FFF',
                    WebkitTextStroke: '0.3px #2D1A0A',
                    filter: 'drop-shadow(0 1px 2px #000)',
                    marginTop: 1,
                    whiteSpace: 'nowrap',
                  }}>{myRank.subTierName}</div>
                </div>
              </div>
            </div>

            {/* RIGHT SECTION (Small frame in background) */}
            <div style={{
              flex: '2.7 1 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              paddingTop: 10,
            }}>
              <div style={{
                fontFamily: "'Nunito', sans-serif", fontSize: 14.5,
                fontWeight: 900,
                color: '#FFF',
                WebkitTextStroke: '0.6px #2D1A0A',
                filter: 'drop-shadow(0 2px 4px #000)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                position: 'relative',
                top: -5,
                left: -20,
              }}>
                {myRankPoints ?? 0} <span style={{ fontSize: 9, fontWeight: 900 }}>điểm</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Layer 1: Content Area (SCROLLABLE & CLIPPED) ── */}
        <div style={{
          position: 'absolute',
          top: '30.6%',
          bottom: '27.4%',
          left: '5.5%',
          right: '5.5%',
          overflowY: 'auto',
          paddingLeft: '4%',
          paddingRight: '5%',
          paddingTop: 8,
          paddingBottom: 15,
          boxSizing: 'border-box',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          zIndex: 25,
        }}>
          <style>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
          }}>
            {[...RANK_TIERS].reverse().map(tier => {
              const isMyTier = myRank?.tier.id === tier.id;
              return (
                <RankTierCard
                  key={tier.id}
                  tier={tier}
                  isMyTier={isMyTier}
                  isLegendary={tier.id === 'nong_thanh_ky'}
                  myProgress={isMyTier ? myRank?.progress ?? 0 : undefined}
                  myRankPoints={myRankPoints}
                />
              );
            })}
          </div>
        </div>

        {/* ── Layer 1.9: FIXED Rules Scroll (Pinned at the bottom) ── */}
        <div style={{
          position: 'absolute',
          bottom: '1.2%', left: '11%', right: '11%',
          height: '24%',
          zIndex: 35,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <h3 style={{
            fontFamily: FONT, fontSize: 14,
            textAlign: 'center', margin: '0 0 4px',
            textTransform: 'uppercase', letterSpacing: 1.5,
            color: '#4A2D12',
            opacity: 0.95,
          }}>📜 Quy Tắc</h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            width: '98%',
            paddingLeft: '6%',
          }}>
            <RuleItem icon="⚔️" text="Thắng: cộng điểm theo cảnh giới (18–35 điểm)" isFixed />
            <RuleItem icon="💔" text="Thua: trừ điểm theo cảnh giới (15–35 điểm)" isFixed />
            <RuleItem icon="🤝" text="Hoà (Sudden Death): ±0 điểm" isFixed />
            <RuleItem icon="🚪" text="Bỏ trận giữa chừng: trừ gấp đôi" isFixed />
            <RuleItem icon="🏔️" text="Mỗi cảnh giới có 3 giai đoạn: Sơ / Trung / Hậu Kỳ" isFixed />
            <RuleItem icon="📉" text="Rank cao không chơi 7–14 ngày: decay điểm/ngày" isFixed />
            <RuleItem icon="🔄" text="Season: 3 tháng/lần, soft reset (60% + 400 điểm)" isFixed />
          </div>
        </div>
      </div>
    </div>
  );
}

function RankTierCard({ tier, isMyTier, isLegendary, myProgress, myRankPoints }: any) {
  const [expanded, setExpanded] = useState(isMyTier);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      filter: isMyTier ? 'drop-shadow(0 4px 10px rgba(253,224,71,0.3))' : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, height: 38 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            flex: '6.5 1 0',
            backgroundImage: 'url(/assets/rank/frame_wood_5.png)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            gap: 5, paddingLeft: 6, paddingRight: 3,
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{
            width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 18, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{tier.icon}</span>
          </div>
          <div style={{ flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
              fontFamily: FONT,
              fontSize: 10,
              color: isMyTier ? '#FFF' : '#FFE4C4',
              WebkitTextStroke: isMyTier ? '0.5px #3B2412' : '0.3px #3B2412',
              filter: 'drop-shadow(0 1px 1.2px #000)',
              lineHeight: 1,
            }}>{tier.name}</div>
            <div style={{ fontSize: 6.5, fontWeight: 900, color: '#FEF9C3', opacity: 0.8, textShadow: '0 0.8px 1px #000' }}>
              {tier.minPoints} - {isLegendary ? '∞' : tier.maxPoints}
            </div>
          </div>
        </button>

        <div style={{
          flex: 'auto',
          minWidth: 42,
          backgroundImage: 'url(/assets/rank/frame_index.png)',
          backgroundSize: '100% 100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 1, padding: '0 3px',
        }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#4ADE80', textShadow: '0 0.8px 1px #000' }}>+{tier.winPoints}</span>
          <span style={{ fontSize: 8, fontWeight: 900, color: '#999', opacity: 0.6 }}>/</span>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F87171', textShadow: '0 0.8px 1px #000' }}>-{tier.losePoints}</span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: 38,
            backgroundImage: 'url(/assets/rank/btn_scroll.png)',
            backgroundSize: '100% 100%',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.4s',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            padding: 0,
          }}
        />
      </div>

      {expanded && (
        <div style={{
          marginTop: 4,
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 8,
          border: '1px solid rgba(139,94,42,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {!isLegendary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {SUB_TIER_NAMES.map((sub, idx) => {
                const subSize = (tier.maxPoints - tier.minPoints + 1) / 3;
                const subMin = Math.round(tier.minPoints + idx * subSize);
                const subMax = Math.round(tier.minPoints + (idx + 1) * subSize - 1);
                const isActiveSub = isMyTier && myRankPoints !== null && myRankPoints >= subMin && myRankPoints <= subMax;
                return (
                  <div key={sub} style={{
                    borderRadius: 10, padding: '6px 2px', textAlign: 'center',
                    border: `1.5px solid ${isActiveSub ? '#FEF08A' : 'rgba(255,255,255,0.06)'}`,
                    background: isActiveSub ? 'linear-gradient(to bottom, #B45309, #451A03)' : 'rgba(0,0,0,0.45)',
                  }}>
                    <div style={{ fontFamily: FONT, fontSize: 11, color: isActiveSub ? '#FEF08A' : '#9CA3AF' }}>{sub}</div>
                    <div style={{ fontSize: 9, marginTop: 2, fontWeight: 700, color: isActiveSub ? '#fff' : '#6B7280' }}>{subMin}–{subMax}</div>
                  </div>
                );
              })}
            </div>
          )}
          {isMyTier && myProgress !== undefined && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 950, color: '#FDE68A' }}>TIẾN ĐỘ TU LUYỆN</span>
                <span style={{ fontFamily: FONT, fontSize: 13, color: '#FEF08A' }}>{myProgress}%</span>
              </div>
              <div style={{ height: 12, background: 'rgba(0,0,0,0.75)', borderRadius: 6, padding: 2, border: '1.5px solid rgba(139,94,42,0.5)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${myProgress}%`, background: `linear-gradient(to right, #451A03, #B45309, #FDE68A)` }} />
              </div>
            </div>
          )}

          {/* Mau Kinh (Quote) Section */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 10,
            padding: '10px 12px',
            border: '1px solid rgba(139,94,42,0.1)',
            marginTop: 2,
          }}>
            <p style={{
              margin: 0,
              fontSize: 10.5,
              fontStyle: 'italic',
              color: '#D1D5DB',
              textAlign: 'center',
              lineHeight: 1.4,
              fontWeight: 500,
            }}>"{tier.mauKinh}"</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RuleItem({ icon, text, isFixed }: any) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isFixed ? 6 : 12,
      justifyContent: 'flex-start'
    }}>
      <div style={{
        width: isFixed ? 14 : 22,
        height: isFixed ? 14 : 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isFixed ? 'transparent' : 'rgba(109,66,35,0.15)',
        borderRadius: '50%',
        fontSize: isFixed ? 9 : 14
      }}>{icon}</div>
      <span style={{
        fontSize: isFixed ? 8 : 13,
        fontWeight: 950,
        color: '#4A2D12',
        whiteSpace: 'nowrap'
      }}>{text}</span>
    </div>
  );
}
