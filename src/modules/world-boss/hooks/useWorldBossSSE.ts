// ═══════════════════════════════════════════════════════════════
// useWorldBossSSE — SSE listener cho World Boss HP realtime
// Pattern: follow useCoopSSE.ts (EventSource + addEventListener)
// Channel: worldboss:events:{eventId} — broadcast qua Redis Pub/Sub
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/shared/api/api-utils';

export interface DamageFeedEntry {
  id: string;
  damage: number;
  attackerName: string;
  attackerId: string;
  timestamp: number;
}

interface UseWorldBossSSEResult {
  sseHpPercent: number | null;     // HP từ SSE — null nếu chưa nhận được lần đầu
  damageFeed: DamageFeedEntry[];   // Damage gần nhất của người khác để render floating
}

// EventSource không support custom headers → auth dùng cookie (same-origin) → OK
export function useWorldBossSSE(
  eventId: string | null,
  myUserId: string | undefined,
): UseWorldBossSSEResult {
  const [sseHpPercent, setSseHpPercent] = useState<number | null>(null);
  const [damageFeed, setDamageFeed] = useState<DamageFeedEntry[]>([]);
  const myUserIdRef = useRef(myUserId);
  myUserIdRef.current = myUserId;

  useEffect(() => {
    if (!eventId) return;

    const es = new EventSource(`${API_BASE_URL}/api/world-boss/${eventId}/events`, {
      withCredentials: true,
    });

    // hp_update: cập nhật HP bar + thêm damage feed nếu là người khác đánh
    es.addEventListener('hp_update', (e) => {
      try {
        const data = JSON.parse(e.data) as {
          hpPercent?: number;
          damage?: number;
          attackerId?: string;
          attackerName?: string;
        };

        if (data.hpPercent !== undefined) {
          setSseHpPercent(data.hpPercent);
        }

        // Chỉ thêm feed nếu là người khác đánh — mình đánh đã có feedback từ POST response
        if (data.damage && data.attackerId && data.attackerId !== myUserIdRef.current) {
          const entry: DamageFeedEntry = {
            id: `${data.attackerId}-${Date.now()}`,
            damage: data.damage,
            attackerName: data.attackerName ?? 'Player',
            attackerId: data.attackerId,
            timestamp: Date.now(),
          };
          setDamageFeed((prev) => [...prev.slice(-4), entry]); // max 5 entries
        }
      } catch {
        // ignore malformed
      }
    });

    // boss_dead: HP về 0 ngay lập tức (không cần chờ poll)
    es.addEventListener('boss_dead', (e) => {
      try {
        const data = JSON.parse(e.data) as { hpPercent?: number };
        setSseHpPercent(data.hpPercent ?? 0);
      } catch {
        setSseHpPercent(0);
      }
    });

    es.onerror = () => {
      // EventSource tự reconnect sau lỗi — không cần xử lý thêm
    };

    return () => es.close();
  }, [eventId]);

  // Auto-cleanup damage feed entries sau 3s để không bị stale
  useEffect(() => {
    if (damageFeed.length === 0) return;
    const timer = setTimeout(() => {
      const cutoff = Date.now() - 3000;
      setDamageFeed((prev) => prev.filter((e) => e.timestamp > cutoff));
    }, 3000);
    return () => clearTimeout(timer);
  }, [damageFeed]);

  return { sseHpPercent, damageFeed };
}
