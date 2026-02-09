import { useState } from 'react';
import BottomNav from '@/shared/components/BottomNav';
import BossList from '../components/BossList';
import BossFightM3 from '../components/BossFightM3';
import { BossInfo } from '../data/bosses';

export default function BossScreen() {
  const [selectedBoss, setSelectedBoss] = useState<BossInfo | null>(null);

  if (selectedBoss) {
    return <BossFightM3 boss={selectedBoss} onBack={() => setSelectedBoss(null)} />;
  }

  return (
    <>
      <BossList onSelect={setSelectedBoss} />
      <BottomNav />
    </>
  );
}
