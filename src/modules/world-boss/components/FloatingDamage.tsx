// ═══════════════════════════════════════════════════════════════
// FloatingDamage — Số damage bay lên khi người khác đánh boss
// Dùng framer-motion AnimatePresence để animate vào/ra
// Chỉ hiển thị damage của người KHÁC (mình đã có feedback từ match-3)
// ═══════════════════════════════════════════════════════════════

import { AnimatePresence, motion } from 'framer-motion';
import type { DamageFeedEntry } from '../hooks/useWorldBossSSE';

interface Props {
  entries: DamageFeedEntry[];
}

// Spread theo chiều ngang để không chồng lên nhau
const X_POSITIONS = ['20%', '40%', '60%', '75%', '50%'];

export function FloatingDamage({ entries }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
      <AnimatePresence>
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            className="absolute flex flex-col items-center"
            style={{ left: X_POSITIONS[i % X_POSITIONS.length], top: '28%' }}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -70 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            <span className="text-yellow-200 text-[10px] font-medium drop-shadow">
              {entry.attackerName}
            </span>
            <span className="text-red-400 text-base font-bold drop-shadow-lg">
              -{entry.damage.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
