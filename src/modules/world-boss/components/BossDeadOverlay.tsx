export function BossDeadOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-sm mx-4">
        <div className="text-5xl mb-4">💀</div>
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">Boss da bi ha guc!</h2>
        <p className="text-gray-300 mb-4">Dang tinh toan phan thuong...</p>
        <div className="animate-spin w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto" />
      </div>
    </div>
  );
}
