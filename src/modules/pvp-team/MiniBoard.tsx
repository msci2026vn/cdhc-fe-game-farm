// MiniBoard.tsx — Compact readonly board (đồng đội / địch)
// Reuse .pvp-mini-board CSS classes từ pvp-battle.css (pattern PvpTestScreen)
import '../pvp/pvp-battle.css';

interface MiniBoardProps {
  tiles: number[];     // raw tile numbers từ server
  username: string;
  isEnemy?: boolean;
  hpPercent?: number;  // 0-100
}

export function MiniBoard({
  tiles,
  username,
  isEnemy = false,
  hpPercent = 100,
}: MiniBoardProps) {
  const fillColor = hpPercent > 50 ? '#4ade80'
    : hpPercent > 25 ? '#facc15'
    : '#f87171';

  const borderColor = isEnemy
    ? 'rgba(239,68,68,0.5)'
    : 'rgba(59,130,246,0.5)';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
    }}>
      {/* Username + HP mini bar */}
      <div style={{
        width: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          color: isEnemy ? '#fca5a5' : '#93c5fd',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 80,
        }}>
          {username}
        </span>
        <div style={{
          height: 4,
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${hpPercent}%`,
            background: fillColor,
            transition: 'width 0.3s ease',
            borderRadius: 2,
          }} />
        </div>
      </div>

      {/* Board 8×8 thu nhỏ — reuse pvp-mini-board CSS */}
      <div
        className="pvp-mini-board"
        style={{ outline: `1.5px solid ${borderColor}` }}
      >
        {tiles.map((gem, idx) => (
          <div
            key={idx}
            className={`pvp-mini-gem ${
              gem === -1 ? 'pvp-mini-gem--empty' : `pvp-mini-gem--${gem}`
            }`}
          />
        ))}
      </div>
    </div>
  );
}
