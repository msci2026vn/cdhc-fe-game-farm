// ═══════════════════════════════════════════════════════════════
// CoopResultScreen — Kết quả sau khi coop_ended
// Hiển thị: bảng xếp hạng damage nội bộ team, MVP, team bonus
// Reward thực tế lấy từ World Boss leaderboard toàn server (không hiện ở đây)
// ═══════════════════════════════════════════════════════════════

import type { CoopEndResult } from './types/coop.types';

interface Props {
  result:     CoopEndResult;
  roomCode:   string;
  multiplier: number;
  onPlayAgain: () => void;
  onExit:      () => void;
}

export default function CoopResultScreen({ result, roomCode, multiplier, onPlayAgain, onExit }: Props) {
  const isCompleted = result.reason === 'completed';

  return (
    <div style={{
      position:      'fixed',
      inset:         0,
      background:    'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
      color:         'white',
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      padding:       '32px 24px 24px',
      overflowY:     'auto',
      zIndex:        50,
    }}>
      {/* Tiêu đề kết quả */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {isCompleted ? '🏆' : '😔'}
        </div>
        <div style={{
          fontSize:   24,
          fontWeight: 900,
          color:      isCompleted ? '#fbbf24' : '#9ca3af',
        }}>
          {isCompleted ? 'BOSS DEFEATED!' : 'Trận đã kết thúc'}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          Phòng {roomCode}
        </div>
      </div>

      {/* Bảng xếp hạng damage nội bộ team */}
      <div style={{
        width:        '100%',
        maxWidth:     360,
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 10, textAlign: 'center', fontWeight: 600 }}>
          Thành tích cả team
        </div>

        {result.players.map((p, idx) => (
          <div
            key={`${p.name}-${idx}`}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          10,
              marginBottom: 10,
            }}
          >
            {/* Rank */}
            <div style={{
              width:      28,
              fontWeight: 900,
              fontSize:   16,
              textAlign:  'center',
              color:      idx === 0 ? '#fbbf24' : '#6b7280',
            }}>
              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : `#${idx + 1}`}
            </div>

            {/* Tên + bar */}
            <div style={{ flex: 1 }}>
              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                marginBottom:   4,
                fontSize:       13,
                fontWeight:     600,
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {p.name}
                  {/* MVP icon — người có damage cao nhất */}
                  {p.isMvp && (
                    <span style={{
                      fontSize:     10,
                      background:   '#fbbf24',
                      color:        '#111',
                      borderRadius: 4,
                      padding:      '1px 5px',
                      fontWeight:   700,
                    }}>MVP</span>
                  )}
                </span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>
                  {p.percent.toFixed(0)}%
                </span>
              </div>

              {/* Progress bar — width = percent% */}
              <div style={{ height: 8, background: '#1f2937', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width:      `${Math.min(100, p.percent)}%`,
                  height:     '100%',
                  background: p.isMvp
                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                    : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                  transition: 'width 0.5s ease',
                }} />
              </div>

              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                {p.damage.toLocaleString()} DMG
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Team bonus applied */}
      <div style={{
        background:   'rgba(34, 197, 94, 0.1)',
        border:       '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: 10,
        padding:      '10px 20px',
        marginBottom: 16,
        textAlign:    'center',
        fontSize:     13,
      }}>
        <span style={{ color: '#34d399', fontWeight: 700 }}>
          Team Bonus ×{multiplier.toFixed(1)} applied ✅
        </span>
      </div>

      {/* Chú thích reward */}
      <div style={{
        fontSize:     12,
        color:        '#6b7280',
        textAlign:    'center',
        marginBottom: 24,
        maxWidth:     280,
        lineHeight:   1.6,
      }}>
        {/* Reward tính theo damage thực tế đã nhân multiplier — phân phối từ WB leaderboard toàn server */}
        Reward được tính theo đóng góp damage trên bảng xếp hạng World Boss toàn server.
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        {isCompleted && (
          <button
            onClick={onPlayAgain}
            style={{
              padding:      '14px 0',
              background:   '#f59e0b',
              color:        '#111',
              fontWeight:   700,
              fontSize:     16,
              border:       'none',
              borderRadius: 10,
              cursor:       'pointer',
            }}
          >
            Đánh Tiếp ▶
          </button>
        )}
        <button
          onClick={onExit}
          style={{
            padding:      '12px 0',
            background:   'rgba(255,255,255,0.08)',
            color:        '#d1d5db',
            fontWeight:   600,
            fontSize:     14,
            border:       '1px solid #374151',
            borderRadius: 10,
            cursor:       'pointer',
          }}
        >
          Thoát
        </button>
      </div>
    </div>
  );
}
