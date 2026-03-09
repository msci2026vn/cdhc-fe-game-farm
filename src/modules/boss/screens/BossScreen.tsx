import { useState } from 'react';
import BossList from '../components/BossList';
import BossFightM3 from '../components/BossFightM3';
import { BossInfo } from '../data/bosses';

export default function BossScreen() {
  const [selectedBoss, setSelectedBoss] = useState<BossInfo | null>(null);

  // Weekly boss mode: list → select → combat
  if (selectedBoss) {
    return <BossFightM3 boss={selectedBoss} onBack={() => setSelectedBoss(null)} />;
  }

  return (
    <>
      <BossList onSelect={setSelectedBoss} />
          </>
  );
}
