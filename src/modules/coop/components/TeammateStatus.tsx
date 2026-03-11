// ═══════════════════════════════════════════════════════════════
// TeammateStatus — Hiển thị compact HP của đồng đội
// Lọc ra myUserId — chỉ hiện đồng đội
// ═══════════════════════════════════════════════════════════════

import type { CoopPlayer } from '@/modules/coop/types/coop.types';

interface Props {
  players:   CoopPlayer[];
  myUserId:  string;
}

// HP visualization theo ngưỡng
function hpIcon(hp: number, maxHp: number): string {
  if (maxHp === 0) return '💀';
  const pct = hp / maxHp;
  if (pct > 0.66) return '❤️';   // > 66%: đầy máu
  if (pct > 0.33) return '🟡';   // 33-66%: nguy hiểm
  return '💀';                    // < 33%: cực kỳ nguy hiểm
}

export function TeammateStatus({ players, myUserId }: Props) {
  const teammates = players.filter(p => p.userId !== myUserId);

  if (teammates.length === 0) return null;

  return (
    <div style={{
      display:     'flex',
      alignItems:  'center',
      gap:         8,
      padding:     '4px 8px',
      background:  'rgba(0,0,0,0.45)',
      borderRadius: 12,
    }}>
      <span style={{ fontSize: 12, color: '#9ca3af' }}>🤝</span>

      {teammates.map(p => (
        <div
          key={p.userId}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        3,
            opacity:    p.isOnline ? 1 : 0.45,  // mờ khi offline
          }}
        >
          <span style={{ fontSize: 11, color: '#e5e7eb', fontWeight: 600 }}>
            {p.name}
          </span>

          {/* Icon ⚡ khi đang reconnect */}
          {!p.isOnline && (
            <span style={{ fontSize: 10 }} title="Đang kết nối lại...">⚡</span>
          )}

          {/* HP icons */}
          <span style={{ fontSize: 11 }}>
            {hpIcon(p.hp, p.maxHp)}
          </span>
        </div>
      ))}
    </div>
  );
}
