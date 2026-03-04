interface Props {
  battleState: 'idle' | 'fighting' | 'ended';
  onAttack: () => void;
}

export function AttackButton({ battleState, onAttack }: Props) {
  if (battleState === 'fighting') {
    return (
      <button className="w-full py-4 bg-gray-500 text-gray-200 text-xl font-bold rounded-xl" style={{ minHeight: 56 }} disabled>
        Đang chiến đấu...
      </button>
    );
  }

  return (
    <button
      className="w-full py-4 bg-red-600 active:bg-red-700 text-white text-xl font-bold rounded-xl"
      style={{ minHeight: 56 }}
      onClick={onAttack}
    >
      Tấn Công
    </button>
  );
}
