// ═══════════════════════════════════════════════════════════════
// useWorldBossSSE — SSE listener cho World Boss HP realtime
// Pattern: follow useCoopSSE.ts (EventSource + addEventListener)
// Channel: worldboss:events:{eventId} — broadcast qua Redis Pub/Sub
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/shared/api/api-utils';
import type { ActiveBossSkill, BossSkillEvent, BossSkillEndEvent } from '../types/world-boss.types';

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
  activeSkills: ActiveBossSkill[]; // Boss skills đang active (có countdown)
  boardVisible: boolean;           // false khi darkness đang active
  isBossStunned: boolean;          // true khi stun (swap disabled)
}

// EventSource không support custom headers → auth dùng cookie (same-origin) → OK
export function useWorldBossSSE(
  eventId: string | null,
  myUserId: string | undefined,
): UseWorldBossSSEResult {
  const [sseHpPercent, setSseHpPercent] = useState<number | null>(null);
  const [damageFeed, setDamageFeed] = useState<DamageFeedEntry[]>([]);
  const [activeSkills, setActiveSkills] = useState<ActiveBossSkill[]>([]);
  const [boardVisible, setBoardVisible] = useState(true);
  const [isBossStunned, setIsBossStunned] = useState(false);
  const myUserIdRef = useRef(myUserId);
  myUserIdRef.current = myUserId;

  // Cleanup stale activeSkills — remove expired entries every 500ms
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setActiveSkills((prev) => prev.filter((s) => s.endTime > now));
    }, 500);
    return () => clearInterval(t);
  }, []);

  const handleBossSkill = useCallback((event: BossSkillEvent) => {
    const { skillId, duration } = event;

    // Track active skill for badge display
    if (duration) {
      setActiveSkills((prev) => [
        ...prev.filter((s) => s.skillId !== skillId),
        { skillId, endTime: Date.now() + duration * 1000 },
      ]);
    }

    switch (skillId) {
      case 'darkness': {
        setBoardVisible(false);
        setTimeout(() => setBoardVisible(true), (duration ?? 5) * 1000);
        break;
      }
      case 'stun': {
        setIsBossStunned(true);
        setTimeout(() => setIsBossStunned(false), (duration ?? 3) * 1000);
        break;
      }
      case 'slow_swap': {
        // Visual only — badge countdown covers the effect
        break;
      }
      default:
        break;
    }
  }, []);

  const handleBossSkillEnd = useCallback((event: BossSkillEndEvent) => {
    const { skillId } = event;
    setActiveSkills((prev) => prev.filter((s) => s.skillId !== skillId));
    if (skillId === 'darkness') setBoardVisible(true);
    if (skillId === 'stun') setIsBossStunned(false);
  }, []);

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

    // boss_skill: boss dùng skill → apply hiệu ứng
    es.addEventListener('boss_skill', (e) => {
      try {
        const data = JSON.parse(e.data) as BossSkillEvent;
        handleBossSkill(data);
      } catch {
        // ignore malformed
      }
    });

    // boss_skill_end: skill hết hạn → xoá hiệu ứng
    es.addEventListener('boss_skill_end', (e) => {
      try {
        const data = JSON.parse(e.data) as BossSkillEndEvent;
        handleBossSkillEnd(data);
      } catch {
        // ignore malformed
      }
    });

    es.onerror = () => {
      // EventSource tự reconnect sau lỗi — không cần xử lý thêm
    };

    return () => es.close();
  }, [eventId, handleBossSkill, handleBossSkillEnd]);

  // Auto-cleanup damage feed entries sau 3s để không bị stale
  useEffect(() => {
    if (damageFeed.length === 0) return;
    const timer = setTimeout(() => {
      const cutoff = Date.now() - 3000;
      setDamageFeed((prev) => prev.filter((e) => e.timestamp > cutoff));
    }, 3000);
    return () => clearTimeout(timer);
  }, [damageFeed]);

  return { sseHpPercent, damageFeed, activeSkills, boardVisible, isBossStunned };
}
