/**
 * LevelUpOverlay — Fullscreen level-up celebration
 *
 * Listens for 'farmverse:levelup' custom event and shows
 * a fullscreen celebration animation.
 *
 * Auto-hides after 3 seconds.
 */
import { useState, useEffect } from 'react';
import { getLevelTitle } from '@/shared/stores/playerStore';

interface LevelUpEventDetail {
  oldLevel: number;
  newLevel: number;
}

export function LevelUpOverlay() {
  const [show, setShow] = useState(false);
  const [levelData, setLevelData] = useState<LevelUpEventDetail>({ oldLevel: 0, newLevel: 0 });

  useEffect(() => {
    const handler = (e: CustomEvent<LevelUpEventDetail>) => {
      setLevelData(e.detail);
      setShow(true);
      // Auto-hide after 3s
      setTimeout(() => setShow(false), 3000);
    };
    window.addEventListener('farmverse:levelup', handler as EventListener);
    return () => window.removeEventListener('farmverse:levelup', handler as EventListener);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
      <div className="text-center animate-bounce-in">
        <div className="text-6xl mb-4">🎉</div>
        <div className="text-3xl font-bold text-yellow-400 mb-2">
          LEVEL UP!
        </div>
        <div className="text-5xl font-black text-white mb-2">
          {levelData.newLevel}
        </div>
        <div className="text-lg text-yellow-200">
          {getLevelTitle(levelData.newLevel)}
        </div>
        <div className="text-sm text-gray-300 mt-4">
          {levelData.oldLevel} → {levelData.newLevel}
        </div>
      </div>
    </div>
  );
}
