import type { AttackState } from '../hooks/useWorldBossAttack';

interface Props {
  state: AttackState;
  cooldownRemaining: number;
  cooldownTotal: number;
  onPress: () => void;
  error: string | null;
  onDismissError: () => void;
}

export function AttackButton({ state, cooldownRemaining, cooldownTotal, onPress, error, onDismissError }: Props) {
  if (state === 'boss_dead') {
    return (
      <div className="w-full py-4 bg-yellow-600 text-white text-xl font-bold rounded-xl text-center" style={{ minHeight: 56 }}>
        Boss đã bị hạ!
      </div>
    );
  }

  if (state === 'error') {
    return (
      <button
        className="w-full py-4 bg-red-800 text-white text-lg font-bold rounded-xl"
        style={{ minHeight: 56 }}
        onClick={onDismissError}
      >
        <div>{error || 'Lỗi'}</div>
        <div className="text-sm text-red-200">Bấm để thử lại</div>
      </button>
    );
  }

  if (state === 'submitting') {
    return (
      <button className="w-full py-4 bg-gray-500 text-gray-200 text-xl font-bold rounded-xl" style={{ minHeight: 56 }} disabled>
        Đang gửi...
      </button>
    );
  }

  if (state === 'cooldown') {
    const pct = cooldownTotal > 0 ? ((cooldownTotal - cooldownRemaining) / cooldownTotal) * 100 : 0;
    return (
      <button className="w-full relative overflow-hidden bg-gray-600 text-gray-200 text-xl font-bold rounded-xl" style={{ minHeight: 56 }} disabled>
        <div
          className="absolute inset-y-0 left-0 bg-gray-500 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
        <span className="relative z-10">Chờ {cooldownRemaining}s</span>
      </button>
    );
  }

  if (state === 'result' || state === 'match3') {
    return (
      <button className="w-full py-4 bg-gray-500 text-gray-200 text-xl font-bold rounded-xl" style={{ minHeight: 56 }} disabled>
        Tấn Công
      </button>
    );
  }

  // IDLE
  return (
    <button
      className="w-full py-4 bg-red-600 active:bg-red-700 text-white text-xl font-bold rounded-xl"
      style={{ minHeight: 56 }}
      onClick={onPress}
    >
      Tấn Công
    </button>
  );
}
