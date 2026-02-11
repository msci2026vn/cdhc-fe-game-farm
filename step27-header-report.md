# Bước 27: Header + OGN Display — Report

**Ngày:** 2026-02-11
**Status:** ✅ COMPLETE

## Data Unification

| Component | Trước | Sau | Status |
|-----------|-------|-----|--------|
| Header.tsx | useOgn() | useOgn() + AnimatedNumber | ✅ |
| FarmHeader.tsx | useOgn+useXp+useLevel (3 hooks) | usePlayerProfile() (1 hook) | ✅ |

**Details:**
- FarmHeader.tsx now imports `usePlayerProfile` once and destructures `ogn`, `xp`, `level` from `data`
- Single query subscription → 1 re-render on data change instead of 3

## New Components

| Component | Feature | Status |
|-----------|---------|--------|
| AnimatedNumber.tsx | Smooth OGN counter with requestAnimationFrame | ✅ |
| LevelUpOverlay.tsx | Fullscreen celebration with auto-hide | ✅ |
| useLevelUpDetector.ts | Level change detection + custom event | ✅ |

**AnimatedNumber Features:**
- requestAnimationFrame-based smooth animation
- Ease-out cubic easing (1 - (1-t)^3)
- Configurable duration (default 500ms)
- Support for prefix/suffix
- Vietnam locale formatting

**LevelUpOverlay Features:**
- Listens for `farmverse:levelup` custom event
- Displays: oldLevel → newLevel, level title, celebration emoji
- Auto-hides after 3 seconds
- Fixed inset overlay with backdrop blur

## XP Bar Animation

| Feature | Status |
|---------|--------|
| CSS transition 0.8s ease-out | ✅ |
| Progress calculation (level-based) | ✅ |
| Text: "X / Y XP" (current XP in level) | ✅ |

**Implementation:**
```tsx
const levelStart = xpForLevel(level);
const levelEnd = xpForLevel(level + 1);
const xpInRange = levelEnd - levelStart;
const currentXpInRange = xp - levelStart;
const xpPct = xpInRange > 0 ? Math.min(100, (currentXpInRange / xpInRange) * 100) : 100;
```

**CSS:**
```tsx
style={{ transition: 'width 0.8s ease-out' }}
```

## Mutations Invalidate Profile

| Hook | Invalidates | Status |
|------|-------------|--------|
| useHarvestPlot | ✅ | ✅ |
| usePlantSeed | ✅ | ✅ |
| useWaterPlot | ✅ | ✅ |
| useShopBuy | ✅ | ✅ |
| useBossComplete | ✅ | ✅ |
| useQuizAnswer | ✅ | ✅ |
| useSocial | ✅ | ✅ |
| useClearPlot | ✅ | ✅ |

**Note:** useClearPlot was updated in this step to invalidate PLAYER_PROFILE_KEY

## Build

| Check | Status |
|-------|--------|
| TypeScript 0 errors | ✅ |
| Vite build | ✅ (27.41s) |

## CSS Animations

Added to `src/index.css`:

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
.animate-bounce-in {
  animation: bounce-in 0.5s ease-out;
}
```

## Data Flow Verification

**FarmHeader.tsx:**
```tsx
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';
const { data: profile } = usePlayerProfile();
const ogn = profile?.ogn ?? 0;
const xp = profile?.xp ?? 0;
const level = profile?.level ?? 1;
```

**Header.tsx:**
```tsx
import { useOgn } from '@/shared/hooks/usePlayerProfile';
import { AnimatedNumber } from '@/shared/components/AnimatedNumber';
const ogn = useOgn();
<AnimatedNumber value={ogn} />
```

**App.tsx:**
```tsx
import { useLevelUpDetector } from '@/shared/hooks/useLevelUpDetector';
import { LevelUpOverlay } from '@/shared/components/LevelUpOverlay';

const NavigateSetup = () => {
  useLevelUpDetector(); // Watch for level changes
  return <LevelUpOverlay />;
};
```

## Summary

✅ **All objectives complete:**

1. **FarmHeader unified:** Single `usePlayerProfile()` hook instead of 3 separate hooks
2. **AnimatedNumber created:** Smooth OGN counter with requestAnimationFrame
3. **XP bar improved:** Level-based calculation + 0.8s CSS transition
4. **Level-up system:** Detector hook + custom event + overlay component
5. **All mutations invalidate profile:** 8/8 hooks invalidate PLAYER_PROFILE_KEY
6. **CSS animations added:** fade-in and bounce-in for level-up overlay
7. **App.tsx updated:** Mounts LevelUpOverlay + useLevelUpDetector
8. **Build clean:** 0 TypeScript errors, 27.41s build time

## Issues

| # | Issue | Status |
|---|-------|--------|
| - | No issues | ✅ |

---

**Bước 27:** ✅ COMPLETE — Header + OGN display from server state with smooth animations
