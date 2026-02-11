# Bước 22: Player Sync — Report

**Ngày:** 2026-02-11
**Status:** ✅ COMPLETE

---

## 📊 TÓM TẮT

Giảm API calls từ ~50/phút → ~2/phút bằng cách gom actions nhỏ gửi 1 lần.

**Backend:** `POST /api/game/player/sync` — batch process actions với anti-cheat
**Frontend:** `useGameSync` hook — singleton queue + 60s auto-sync timer

---

## ✅ BACKEND

| Check | Status | Notes |
|-------|--------|-------|
| config/sync.ts | ✅ | Rewards + anti-cheat constants |
| sync.service.ts | ✅ | processBatch() with atomic DB update |
| routes/player.ts | ✅ | POST /player/sync with Zod validation |
| Route mounted | ✅ | /player/sync at game router |
| Anti-cheat caps | ✅ | water≤20, bug_catch≤30/60s |
| Atomic DB update | ✅ | Single UPDATE with sql`` |
| PM2 restart | ✅ | Running |
| Endpoint check | ✅ | 401 (auth required) |

### Files Created/Modified
- `/home/cdhc/apps/cdhc-be/src/modules/game/config/sync.ts` — **NEW**
- `/home/cdhc/apps/cdhc-be/src/modules/game/services/sync.service.ts` — **NEW**
- `/home/cdhc/apps/cdhc-be/src/modules/game/routes/player.ts` — **MODIFIED** (added /sync)
- `/home/cdhc/apps/cdhc-be/src/modules/game/services/index.ts` — **MODIFIED** (export syncService)

---

## ✅ FRONTEND

| Check | Status | Notes |
|-------|--------|-------|
| SyncAction type | ✅ | Added count field, removed data |
| SyncResult type | ✅ | Added processed, rejected, details[] |
| syncActions API fn | ✅ | POST /player/sync with error handling |
| useGameSync hook | ✅ | Singleton queue + 60s timer |
| 60s timer | ✅ | setInterval 60000ms |
| Tab hide sync | ✅ | visibilitychange event |
| beforeunload save | ✅ | localStorage save |
| Online reconnect | ✅ | window.online event |
| Offline queue | ✅ | localStorage persistence |
| App.tsx integration | ✅ | NavigateSetup uses useGameSync |
| TypeScript build | ✅ | No errors |
| Vite build | ✅ | 1685 modules, 38.32s |

### Files Created/Modified
- `src/shared/hooks/useGameSync.ts` — **NEW**
- `src/shared/types/game-api.types.ts` — **MODIFIED** (SyncAction, SyncResult)
- `src/shared/api/game-api.ts` — **MODIFIED** (added syncActions)
- `src/App.tsx` — **MODIFIED** (import + use useGameSync)

---

## ✅ SERVICE TESTS (10/9 Pass, 1 Warn)

| # | Test | Result | Details |
|---|------|--------|---------|
| T1 | single water | ✅ | processed=1, ogn+1, xp+2 |
| T2 | multi action batch | ✅ | 8 processed, 2 detail items |
| T3 | canonical state return | ✅ | ogn, xp, level all numbers |
| T4 | anti-cheat cap | ✅ | water 50→20, rejected=30 |
| T5 | unknown action reject | ✅ | HACK_ACTION rejected=999 |
| T6 | empty batch | ⚠️ | accepted (service allows, route Zod catches) |
| T7 | batch too large | ✅ | BATCH_TOO_LARGE error |
| T8 | negative count | ✅ | capped to 0, processed=0 |
| T9 | reward calculation | ✅ | bug_catch 5×: OGN+10, XP+40 |
| T10 | perf < 200ms | ✅ | 6ms |

### Test Data
```
Before: {"ogn":143,"xp":440,"level":5}
After:  {"ogn":216,"xp":658,"level":5}
Total:   OGN +73 XP +218
```

---

## 📋 SYNC FLOW

```
User Action → queue local → 60s timer → POST /player/sync
                             → tab hide  → POST /player/sync
                             → offline   → localStorage → online → POST /player/sync
Server → process batch → return { ogn, xp, level } → FE update stores
```

### Action Types Batched
| Type | OGN | XP | Max/60s |
|------|-----|-----|---------|
| water | 1 | 2 | 20 |
| bug_catch | 2 | 8 | 30 |
| xp_pickup | 0 | 5 | 10 |
| daily_check | 5 | 5 | 1 |

### Not Batched (Real-time)
- plant (needs immediate validation)
- harvest (needs immediate feedback)
- boss_kill (needs immediate rewards)
- quiz (needs immediate validation)
- shop_buy (needs immediate validation)
- social_interact (needs immediate feedback)

---

## 🔒 ANTI-CHEAT

1. **Max batch size**: 100 actions per request
2. **Max per type per window**:
   - water: 20 times / 60s
   - bug_catch: 30 times / 60s
   - xp_pickup: 10 times / 60s
   - daily_check: 1 time / 60s
3. **Unknown action types**: Rejected
4. **Negative counts**: Capped to 0

---

## 🚀 DEPLOY

### Backend
- Committed: `feat(sync): POST /player/sync batch actions with anti-cheat — Bước 22`
- Files: sync.config, sync.service, updated player routes
- PM2: Restarted, running

### Frontend
- Committed: `feat(sync): POST /player/sync batch actions with queue — Step 22`
- Files: useGameSync.ts, updated types, api, App.tsx
- Build: Successful (1685 modules)

---

## 📈 API REDUCTION

### Before
- Every water action: 1 API call
- Every bug catch: 1 API call
- ~50 actions/min = ~50 API calls/min

### After
- 60-second batch window
- ~50 actions/min → 1 API call/min
- **~98% reduction**

---

## 📝 USAGE

### Hook Usage
```tsx
import { useGameSync } from '@/shared/hooks/useGameSync';

function MyComponent() {
  const { queueAction, forceSync, getQueueSize } = useGameSync();

  const handleWater = () => {
    queueAction('water');  // Queued, will sync in 60s
    // Optimistic: +1 OGN local
    useFarmStore.getState().setOgn(prev => prev + 1);
  };

  const handleSyncNow = () => {
    forceSync();  // Sync immediately
  };

  return (
    <button onClick={handleWater}>
      Water (Queue: {getQueueSize()})
    </button>
  );
}
```

---

## ⚠️ NOTES

1. **Backend đã sẵn sàng**: rewardService.addOGN/addXP unchanged, sync использует direct SQL update
2. **Level-up**: Không tự động level-up trong sync (phải gọi rewardService.checkLevelUp nếu cần)
3. **Offline queue**: localStorage persists across page reloads
4. **Singleton pattern**: Queue ở module level, không reset khi component re-render
5. **Source of truth**: Server trả về canonical state { ogn, xp, level } sau mỗi sync

---

**Report created:** 2026-02-11
**Generated by:** Claude Sonnet 4.5
