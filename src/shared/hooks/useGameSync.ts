/**
 * useGameSync — Batch actions queue + auto sync
 *
 * FARMVERSE Step 22 — Player Sync
 * Created: 2026-02-11
 *
 * Queues small actions (water, bug_catch, xp_pickup) and syncs every 60s
 * to reduce API calls from ~50/min to ~2/min.
 *
 * Features:
 * - Singleton queue (shared across all components)
 * - 60s auto-sync timer
 * - Sync on tab hide / page close
 * - Offline queue in localStorage
 * - Auto-resume on reconnect
 */
import { useCallback, useEffect, useRef } from 'react';
import * as gameApi from '../api/game-api';
import type { SyncAction, SyncActionType } from '../types/game-api.types';

const SYNC_INTERVAL = 60_000; // 60 giây
const OFFLINE_STORAGE_KEY = 'farmverse_sync_queue';

// ═══════════════════════════════════════════════════════════════
// SINGLETON QUEUE (shared across components)
// Module-level to persist across component re-renders
// ═══════════════════════════════════════════════════════════════

interface QueuedAction {
  count: number;
  firstTimestamp: number;
}

const actionQueue = new Map<string, QueuedAction>();
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;

function addToQueue(type: SyncActionType) {
  const existing = actionQueue.get(type);
  if (existing) {
    existing.count += 1;
  } else {
    actionQueue.set(type, { count: 1, firstTimestamp: Date.now() });
  }
  console.log(`[FARM-DEBUG] sync: queued ${type} (total: ${actionQueue.get(type)!.count})`);
}

async function flushQueue() {
  if (isSyncing || actionQueue.size === 0) return;
  isSyncing = true;

  // Snapshot + clear queue
  const actions: SyncAction[] = [];
  actionQueue.forEach((val, type) => {
    actions.push({ type, count: val.count, timestamp: val.firstTimestamp });
  });
  actionQueue.clear();

  console.log(`[FARM-DEBUG] sync: flushing ${actions.length} action types...`);

  try {
    const result = await gameApi.syncActions(actions);
    console.log(`[FARM-DEBUG] sync: ✅ processed=${result.processed} ogn=${result.ogn} xp=${result.xp}`);

    // Update stores with server canonical state
    // Note: Stores must be imported and updated here
    // Currently we rely on the caller to update stores via setOgn/setXp

    // Clear offline storage on success
    try {
      localStorage.removeItem(OFFLINE_STORAGE_KEY);
    } catch {}
  } catch (e) {
    console.error('[FARM-DEBUG] sync: ❌ failed, saving to offline queue', e);
    // Put actions back + save to localStorage for offline
    actions.forEach((a) => {
      const existing = actionQueue.get(a.type);
      if (existing) existing.count += a.count;
      else actionQueue.set(a.type, { count: a.count, firstTimestamp: a.timestamp });
    });
    saveOfflineQueue();
  } finally {
    isSyncing = false;
  }
}

function saveOfflineQueue() {
  try {
    const data: SyncAction[] = [];
    actionQueue.forEach((val, type) => {
      data.push({ type, count: val.count, timestamp: val.firstTimestamp });
    });
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function loadOfflineQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (!raw) return;
    const data: SyncAction[] = JSON.parse(raw);
    data.forEach((a) => {
      const existing = actionQueue.get(a.type);
      if (existing) existing.count += a.count;
      else actionQueue.set(a.type, { count: a.count, firstTimestamp: a.timestamp });
    });
    console.log(`[FARM-DEBUG] sync: loaded ${data.length} offline actions`);
  } catch {}
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export function useGameSync() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Load offline queue on mount
    loadOfflineQueue();

    // Auto sync timer (60s)
    syncTimer = setInterval(() => {
      flushQueue();
    }, SYNC_INTERVAL);

    // Sync on tab hide / page close
    const handleVisibility = () => {
      if (document.hidden) flushQueue();
    };
    const handleBeforeUnload = () => {
      // Can't async in beforeunload — save to localStorage
      saveOfflineQueue();
    };
    const handleOnline = () => {
      console.log('[FARM-DEBUG] sync: online — flushing queue');
      flushQueue();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('online', handleOnline);

    return () => {
      if (syncTimer) clearInterval(syncTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Expose queue function
  const queueAction = useCallback((type: SyncActionType) => {
    addToQueue(type);
  }, []);

  const forceSync = useCallback(() => {
    flushQueue();
  }, []);

  const getQueueSize = useCallback(() => {
    let total = 0;
    actionQueue.forEach((v) => (total += v.count));
    return total;
  }, []);

  return { queueAction, forceSync, getQueueSize };
}
