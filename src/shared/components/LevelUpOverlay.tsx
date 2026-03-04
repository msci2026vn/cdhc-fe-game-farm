/**
 * LevelUpOverlay — Fullscreen level-up celebration
 *
 * Listens for 'farmverse:levelup' custom event and shows
 * a fullscreen celebration animation.
 *
 * After animation, shows stat allocation prompt if freePoints > 0.
 * If autoEnabled, shows auto-allocation message instead.
 */
import { useState, useEffect, useCallback } from 'react';
import { getLevelTitle } from '@/shared/stores/playerStore';
import { usePlayerStats, PLAYER_STATS_KEY } from '@/shared/hooks/usePlayerStats';
import { StatAllocationModal } from './StatAllocationModal';
import { useQueryClient } from '@tanstack/react-query';
import { playSound } from '@/shared/audio';

interface LevelUpEventDetail {
  oldLevel: number;
  newLevel: number;
}

export function LevelUpOverlay() {
  const [show, setShow] = useState(false);
  const [showStatPrompt, setShowStatPrompt] = useState(false);
  const [showStatModal, setShowStatModal] = useState(false);
  const [levelData, setLevelData] = useState<LevelUpEventDetail>({ oldLevel: 0, newLevel: 0 });
  const { data: statInfo } = usePlayerStats();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (e: CustomEvent<LevelUpEventDetail>) => {
      setLevelData(e.detail);
      setShow(true);
      setShowStatPrompt(false);
      playSound('level_up');

      // Invalidate player stats to get updated freePoints
      queryClient.invalidateQueries({ queryKey: PLAYER_STATS_KEY });

      // After 2s of celebration, check for stat prompt
      setTimeout(() => {
        setShowStatPrompt(true);
      }, 2000);
    };
    window.addEventListener('farmverse:levelup', handler as EventListener);
    return () => window.removeEventListener('farmverse:levelup', handler as EventListener);
  }, [queryClient]);

  // Auto-close after showing stat prompt for a while (if no free points or auto enabled)
  useEffect(() => {
    if (!showStatPrompt || !show) return;

    const freePoints = statInfo?.freePoints ?? 0;
    const autoEnabled = statInfo?.autoEnabled ?? false;

    if (freePoints === 0 || autoEnabled) {
      const timer = setTimeout(() => {
        setShow(false);
        setShowStatPrompt(false);
      }, autoEnabled && freePoints > 0 ? 2000 : 1000);
      return () => clearTimeout(timer);
    }
  }, [showStatPrompt, show, statInfo]);

  const handleAllocateNow = useCallback(() => {
    setShow(false);
    setShowStatPrompt(false);
    setShowStatModal(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setShow(false);
    setShowStatPrompt(false);
  }, []);

  const freePoints = statInfo?.freePoints ?? 0;
  const autoEnabled = statInfo?.autoEnabled ?? false;

  return (
    <>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in" onClick={handleDismiss}>
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
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
            <div className="text-sm text-gray-300 mt-2">
              {levelData.oldLevel} → {levelData.newLevel}
            </div>

            {/* Stat allocation prompt */}
            {showStatPrompt && freePoints > 0 && !autoEnabled && (
              <div className="mt-4 animate-fade-in">
                <p className="text-sm text-yellow-300 font-bold mb-2">
                  +{freePoints} điểm chỉ số mới!
                </p>
                <button
                  onClick={handleAllocateNow}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-amber-500 active:scale-95 shadow-lg"
                >
                  Phân bổ ngay
                </button>
              </div>
            )}

            {/* Auto-allocated message */}
            {showStatPrompt && freePoints > 0 && autoEnabled && (
              <div className="mt-4 animate-fade-in">
                <p className="text-sm text-green-300 font-bold">
                  🤖 Da tu dong phan bo theo{' '}
                  {statInfo?.autoPreset === 'attack' ? 'Tan cong' : statInfo?.autoPreset === 'defense' ? 'Phong thu' : 'Can bang'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stat allocation modal (after overlay closes) */}
      {showStatModal && statInfo && (
        <StatAllocationModal
          isOpen={showStatModal}
          onClose={() => setShowStatModal(false)}
          freePoints={statInfo.freePoints}
          currentStats={statInfo.stats}
          effectiveStats={statInfo.effectiveStats}
          nextMilestones={statInfo.milestones?.next ?? []}
          autoPreset={statInfo.autoPreset}
          autoEnabled={statInfo.autoEnabled}
        />
      )}
    </>
  );
}
