// ═══════════════════════════════════════════════════════════════
// CoopTauntFloat — Floating avatar + emoji animation for co-op cheers
// ═══════════════════════════════════════════════════════════════

export interface TauntFloat {
  id:         string;
  fromName:   string;
  fromAvatar: string;
  emoji:      string;
  xOffset:    number; // % from left
}

interface Props {
  floats: TauntFloat[];
}

export function CoopTauntFloat({ floats }: Props) {
  if (floats.length === 0) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
      <style>{`
        @keyframes tauntFloat {
          0%   { transform: translateY(0);      opacity: 1;   }
          70%  { transform: translateY(-100px);  opacity: 0.9; }
          100% { transform: translateY(-140px);  opacity: 0;   }
        }
      `}</style>
      {floats.map(f => (
        <div
          key={f.id}
          style={{
            position: 'absolute',
            bottom: 60,
            left: `${f.xOffset}%`,
            animation: 'tauntFloat 2.5s ease-out forwards',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <div style={{ position: 'relative' }}>
            {f.fromAvatar ? (
              <img
                src={f.fromAvatar}
                alt={f.fromName}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.6)',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: '#374151', border: '2px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}>
                🧑
              </div>
            )}
            <span style={{
              position: 'absolute', bottom: -13, left: 0,
              fontSize: 9, color: 'rgba(255,255,255,0.8)',
              whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}>
              {f.fromName.split(' ').pop()}
            </span>
          </div>
          <span style={{
            fontSize: 26,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          }}>
            {f.emoji}
          </span>
        </div>
      ))}
    </div>
  );
}
