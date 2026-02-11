# Debug: Initial Load Issues — Report

**Ngày:** 2026-02-11
**Status:** ✅ FIXED

## Issues Found

| # | Issue | Root Cause | Fix | Status |
|---|-------|-----------|-----|--------|
| 1 | Empty state 30s | No loading skeleton, shows defaults (0, 0, 1) | Added isLoading → skeleton in FarmHeader | ✅ |
| 2 | False level up | Detector triggers on initial data load (1→2) | dataLoadedRef baseline pattern | ✅ |
| 3 | Slow data load | No prefetch after login | prefetchQuery after login success | ✅ |

## Root Cause Analysis

### Flow trước fix:
```
User mở game.cdhc.vn
  ↓
AuthGuard: ping → authenticated → render children
  ↓
FarmingScreen mount → FarmHeader mount
  ↓
usePlayerProfile() starts query → data = undefined
  ↓
UI render: OGN=0, Lv=1, XP=0 (defaults)  ← ❌ TRỐNG
  ↓
API: GET /player/profile → 200 → level=2, ogn=X
  ↓
useLevelUpDetector: default 1 → API 2 = "LEVEL UP!" ← ❌ GIẢ
```

### Flow sau fix:
```
User mở game.cdhc.vn
  ↓
AuthGuard: ping → authenticated → render children
  ↓
FarmingScreen mount → FarmHeader mount
  ↓
isLoading = true → Show skeleton  ← ✅ KHÔNG TRỐNG
  ↓
API: GET /player/profile → 200 → level=2, ogn=X
  ↓
useLevelUpDetector: isFirstDataLoad = true → set baseline = 2  ← ✅ KHÔNG TRIGGER
  ↓
UI render: OGN=X, Lv=2, XP=Y (real data)
```

## Files Changed

| File | Change | Status |
|------|--------|--------|
| `src/shared/hooks/useLevelUpDetector.ts` | dataLoadedRef + isSuccess pattern | ✅ |
| `src/modules/farming/components/FarmHeader.tsx` | isLoading → skeleton UI | ✅ |
| `src/modules/auth/screens/LoginScreen.tsx` | prefetchQuery after login | ✅ |
| `src/shared/lib/queryClient.ts` | New shared queryClient | ✅ |
| `src/App.tsx` | Import queryClient from shared lib | ✅ |

## Code Changes

### FIX 1: FarmHeader loading state
```tsx
// BEFORE
const { data: profile } = usePlayerProfile();
const ogn = profile?.ogn ?? 0;  // Shows 0 while loading

// AFTER
const { data: profile, isLoading } = usePlayerProfile();

if (isLoading) {
  return <SkeletonUI />;  // Show skeleton while loading
}
```

### FIX 2: useLevelUpDetector
```tsx
// BEFORE
const level = useLevel();  // Returns 1 (default) before data loads
const initialRef = useRef(true);

useEffect(() => {
  if (initialRef.current) {
    initialRef.current = false;  // Skip first render
    return;
  }
  // But when data loads, level changes from 1 to 2
  // This is NOT first render → triggers FALSE level up!
}, [level]);

// AFTER
const { data: profile, isSuccess } = usePlayerProfile();
const level = profile?.level ?? 1;
const dataLoadedRef = useRef(false);

useEffect(() => {
  if (!isSuccess || !profile) return;

  if (!dataLoadedRef.current) {
    // First data load from server → set baseline, NO trigger
    dataLoadedRef.current = true;
    prevLevelRef.current = level;
    return;
  }

  // Only trigger on SUBSEQUENT level changes
  if (level > prevLevelRef.current) {
    // REAL level up!
  }
}, [level, isSuccess, profile]);
```

### FIX 3: Login prefetch
```tsx
// BEFORE
if (res.ok && data.success) {
  navigate('/farm');  // Navigate immediately → profile not loaded yet
}

// AFTER
if (res.ok && data.success) {
  // Prefetch profile → cache ready when FarmingScreen mounts
  await queryClient.prefetchQuery({
    queryKey: PLAYER_PROFILE_KEY,
    queryFn: () => gameApi.getProfile(),
  });
  navigate('/farm');  // Now data is in cache
}
```

## Build

| Check | Status |
|-------|--------|
| TypeScript 0 errors | ✅ |
| Vite build | ✅ (39.84s) |

## Testing Checklist

- [ ] Login → FarmingScreen shows skeleton briefly → real data appears
- [ ] No false "Level Up!" notification on first load
- [ ] FarmHeader shows correct OGN/XP/Level after data loads
- [ ] Real level up still triggers notification (harvest gives XP)
- [ ] Page refresh doesn't trigger false level up

---

**Debug:** ✅ FIXED
