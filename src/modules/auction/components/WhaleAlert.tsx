import { useState, useEffect, useRef } from 'react';
import type { AuctionDetail } from '../types/auction.types';

interface Props {
  auction: AuctionDetail;
}

export function WhaleAlert({ auction }: Props) {
  const [visible, setVisible] = useState(false);
  const prevBidCount = useRef(auction.bidCount);
  const alertCount = useRef(0);

  // Detect large bid jumps (bidCount jumps by 3+ at once = whale)
  useEffect(() => {
    const jump = auction.bidCount - prevBidCount.current;
    prevBidCount.current = auction.bidCount;

    if (jump >= 3 && alertCount.current < 2) {
      alertCount.current++;
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
  }, [auction.bidCount]);

  if (!visible) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-[400px] animate-bounce">
      <div className="bg-gradient-to-r from-blue-900 to-cyan-900 border border-cyan-500 rounded-xl px-4 py-3 text-center shadow-lg shadow-cyan-900/30">
        <div className="text-lg font-black text-cyan-300">
          🐳 CA MAP VAO PHONG!
        </div>
        <p className="text-cyan-400/80 text-xs mt-1">
          Co nguoi vua dat nhieu luot bid lien tiep...
        </p>
      </div>
    </div>
  );
}
