import { useState } from 'react';
import BottomNav from '@/shared/components/BottomNav';
import BossList from '../components/BossList';
import BossFight from '../components/BossFight';
import { BossInfo } from '../data/bosses';

export default function BossScreen() {
  const [selectedBoss, setSelectedBoss] = useState<BossInfo | null>(null);

  if (selectedBoss) {
    return <BossFight boss={selectedBoss} onBack={() => setSelectedBoss(null)} />;
  }

  return (
    <>
      <BossList onSelect={setSelectedBoss} />
      <BottomNav />
    </>
  );
}
