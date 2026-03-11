// ═══════════════════════════════════════════════════════════════
// TeamMultiplierBadge — Hiển thị hệ số multiplier của team
// Chỉ hiện khi teamSize >= 2 (co-op active)
// Animate khi player_joined (scale up) hoặc player_left (shake)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';

interface Props {
  multiplier: number;
  teamSize:   number;
}

type AnimState = 'idle' | 'join' | 'leave';

// Màu sắc theo mức multiplier
function getMultiplierColor(m: number): string {
  if (m >= 1.5) return '#eab308'; // yellow — tối đa, glow effect
  if (m >= 1.4) return '#a855f7'; // purple
  if (m >= 1.3) return '#3b82f6'; // blue
  if (m >= 1.2) return '#22c55e'; // green
  return '#9ca3af';               // gray — 1.0-1.1
}

function getGlowStyle(m: number): React.CSSProperties {
  if (m >= 1.5) return { filter: 'drop-shadow(0 0 6px #eab30880)' };
  return {};
}

export function TeamMultiplierBadge({ multiplier, teamSize }: Props) {
  const [animState, setAnimState] = useState<AnimState>('idle');
  const prevTeamSizeRef = useRef(teamSize);

  // Detect teamSize change → animate accordingly
  useEffect(() => {
    const prev = prevTeamSizeRef.current;
    if (prev === teamSize) return;

    if (teamSize > prev) {
      // player_joined → scale-up pulse
      setAnimState('join');
      setTimeout(() => setAnimState('idle'), 400);
    } else {
      // player_left → shake
      setAnimState('leave');
      setTimeout(() => setAnimState('idle'), 400);
    }

    prevTeamSizeRef.current = teamSize;
  }, [teamSize]);

  // Badge chỉ hiện khi có ít nhất 2 người (co-op active)
  if (teamSize < 2) return null;

  const color = getMultiplierColor(multiplier);
  // Số ngọn lửa = teamSize - 1 (1 người thêm = 1 ngọn lửa thêm)
  const flames = '🔥'.repeat(teamSize - 1);

  const animStyle: React.CSSProperties =
    animState === 'join'
      ? { transform: 'scale(1.2)', transition: 'transform 200ms ease-out' }
      : animState === 'leave'
      ? { animation: 'shake 400ms ease' }
      : { transform: 'scale(1)', transition: 'transform 200ms ease-out' };

  return (
    <div
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            4,
        padding:        '3px 8px',
        borderRadius:   20,
        background:     'rgba(0,0,0,0.55)',
        border:         `1px solid ${color}55`,
        color,
        fontWeight:     700,
        fontSize:       13,
        ...animStyle,
        ...getGlowStyle(multiplier),
      }}
    >
      <span>👥</span>
      <span>×{multiplier.toFixed(1)}</span>
      {flames && <span>{flames}</span>}
      <span style={{ color: '#d1d5db', fontWeight: 400, fontSize: 11 }}>
        {teamSize} người
      </span>

      {/* Shake keyframes — inline style fallback */}
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-4px); }
          40%      { transform: translateX(4px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
