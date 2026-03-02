interface Props {
  damage: number;
  isCrit: boolean;
}

export function DamageFloat({ damage, isCrit }: Props) {
  return (
    <div
      className="absolute top-[30%] left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-damage-float text-center"
      style={{ animationIterationCount: 1, animationFillMode: 'forwards' }}
    >
      {isCrit && (
        <div className="text-red-400 text-sm font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          CRIT!
        </div>
      )}
      <div
        className={`font-bold ${isCrit ? 'text-yellow-300 text-4xl' : 'text-white text-3xl'}`}
        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)' }}
      >
        -{damage.toLocaleString()}
      </div>
    </div>
  );
}
