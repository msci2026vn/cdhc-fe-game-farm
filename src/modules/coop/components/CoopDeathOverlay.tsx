// ═══════════════════════════════════════════════════════════════
// CoopDeathOverlay — "Bạn Đã Chết" overlay with session stats
// Shows after player HP=0, offers Leave or Respawn
// ═══════════════════════════════════════════════════════════════

import type { CoopPlayer } from '@/modules/coop/types/coop.types';

export interface DeathStats {
  totalDamage:  number;
  hits:         number;
  maxCombo:     number;
  aliveTime:    number; // seconds
  multiplier:   number;
  bossHpPercent: number; // 0-1
}

interface Props {
  stats:      DeathStats;
  teammates:  CoopPlayer[];
  onLeave:    () => void;
  onRespawn:  () => void;
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const formatDamage = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

export function CoopDeathOverlay({ stats, teammates, onLeave, onRespawn }: Props) {
  const bossHpDisplay = Math.round(stats.bossHpPercent * 100);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 250,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 300ms ease-out',
    }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>

      {/* Header */}
      <div style={{ fontSize: 44, marginBottom: 4 }}>💀</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444', marginBottom: 16 }}>
        Bạn Đã Chết
      </div>

      {/* Stats card */}
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid #374151',
        borderRadius: 14, padding: '14px 20px',
        width: '100%', maxWidth: 300, marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          Thống Kê Trận Này
        </div>
        {[
          { icon: '⚔️', label: 'Tổng Dame', value: formatDamage(stats.totalDamage), color: '#f59e0b' },
          { icon: '💥', label: 'Số Đòn', value: String(stats.hits), color: '#60a5fa' },
          { icon: '🔥', label: 'Combo Cao Nhất', value: `${stats.maxCombo}x`, color: '#f97316' },
          { icon: '⏱️', label: 'Thời Gian Sống', value: formatTime(stats.aliveTime), color: '#a78bfa' },
          { icon: '👥', label: 'Hệ Số Nhóm', value: `×${stats.multiplier.toFixed(1)}`, color: '#34d399' },
          { icon: '👹', label: 'Boss HP còn', value: `${bossHpDisplay}%`, color: bossHpDisplay > 50 ? '#ef4444' : '#22c55e' },
        ].map(row => (
          <div key={row.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ fontSize: 13, color: '#d1d5db' }}>
              {row.icon} {row.label}
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: row.color }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Teammate status */}
      {teammates.length > 0 && (
        <div style={{
          display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {teammates.map(t => {
            const hpPct = t.maxHp > 0 ? t.hp / t.maxHp : 0;
            const icon = t.hp <= 0 ? '💀' : hpPct < 0.3 ? '🟡' : '❤️';
            return (
              <span key={t.userId} style={{
                fontSize: 11, color: t.hp <= 0 ? '#6b7280' : '#d1d5db',
                background: 'rgba(255,255,255,0.05)', borderRadius: 8,
                padding: '3px 8px',
              }}>
                {icon} {t.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Team still fighting notice */}
      <div style={{
        fontSize: 12, color: '#9ca3af', marginBottom: 20,
        animation: 'pulse 2s ease-in-out infinite',
      }}>
        Team vẫn đang chiến đấu...
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 300 }}>
        <button
          onClick={onLeave}
          style={{
            flex: 1, padding: '12px 0',
            background: 'rgba(239,68,68,0.15)', color: '#f87171',
            fontWeight: 700, fontSize: 14,
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          Thoát
        </button>
        <button
          onClick={onRespawn}
          style={{
            flex: 1.5, padding: '12px 0',
            background: '#22c55e', color: '#111',
            fontWeight: 800, fontSize: 15,
            border: 'none', borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          Chơi Tiếp
        </button>
      </div>
    </div>
  );
}
