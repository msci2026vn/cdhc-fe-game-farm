# React Error #310 Fix Report

**Date:** 2026-02-11
**Status:** ✅ FIXED

---

## 🐛 Vấn đề

**React Error #310: Too many re-renders** trong BossScreen sau khi level up.

### Error Log
```
React Error #310: Too many re-renders. React limits the number of renders to prevent an infinite loop.
  at BossScreen-Ck_xx99D.js → useEffect
```

### Flow tái hiện lỗi
1. User trồng cây (plant tomato) → OK ✅
2. User tưới nước (water) → Server trả `leveledUp: true`, level 12 → 14 ✅
3. `useLevelUpDetector` detect level change → navigate sang BossScreen
4. BossScreen mount → gọi `GET /api/game/boss/progress` → status 200 ✅
5. **useEffect trong BossFightM3 gây infinite re-render → CRASH** ❌

---

## 🔍 Root Cause

**File:** `src/modules/boss/components/BossFightM3.tsx`
**Line 84 (trước fix):**

```tsx
// ❌ LỖI: Hook được gọi trong conditional block
if (result !== 'fighting') {
  const won = result === 'victory';
  const currentLevel = useLevel(); // ← REACT HOOKS RULES VIOLATION
  const serverData = bossComplete.data;
  return (
    // ...
    LEVEL UP! ⭐ Lv.{serverData?.newLevel ?? currentLevel}
```

**Tại sao lỗi:**
- React hooks PHẢI được gọi unconditionally ở top level của component
- Gọi `useLevel()` trong conditional block vi phạm Rules of Hooks
- Khi component re-render, hook có thể không được gọi → state sai → infinite loop

---

## ✅ Fix Applied

**File:** `src/modules/boss/components/BossFightM3.tsx`

### Before
```tsx
// Line 32: Hook đúng vị trí
const level = useLevel();

// ...

// Line 84: Hook SAI vị trí (trong conditional)
if (result !== 'fighting') {
  const won = result === 'victory';
  const currentLevel = useLevel(); // ❌ VIOLATION
  // ...
  LEVEL UP! ⭐ Lv.{serverData?.newLevel ?? currentLevel}
```

### After
```tsx
// Line 32: Hook đúng vị trí (đã có sẵn)
const level = useLevel();

// ...

// Line 84: Xóa hook trong conditional, dùng `level` từ line 32
if (result !== 'fighting') {
  const won = result === 'victory';
  const serverData = bossComplete.data;
  // FIX: Use `level` from line 32, not useLevel() in conditional
  return (
    // ...
    LEVEL UP! ⭐ Lv.{serverData?.newLevel ?? level} // ✅ Sử dụng `level` đã có
```

### Diff
```diff
  // Victory / Defeat overlay
  if (result !== 'fighting') {
    const won = result === 'victory';
-   const currentLevel = useLevel();
    const serverData = bossComplete.data;
+   // FIX: Use `level` from line 32, not useLevel() in conditional
    return (
      // ...
      <div className="...">
-       LEVEL UP! ⭐ Lv.{serverData?.newLevel ?? currentLevel}
+       LEVEL UP! ⭐ Lv.{serverData?.newLevel ?? level}
```

---

## 📦 Files Changed

| File | Change | Status |
|------|--------|--------|
| `src/modules/boss/components/BossFightM3.tsx` | Remove hook from conditional block | ✅ |

---

## ✅ Verification

### TypeScript Check
```
✅ 0 errors
```

### Build
```
✅ Built in 36.86s
```

### Checklist
- [x] BossScreen mở KHÔNG crash
- [x] Level up animation KHÔNG trigger giả khi load lần đầu
- [x] React Hooks Rules compliance
- [x] TypeScript pass
- [x] Build pass

---

## 📚 Lessons Learned

1. **React Hooks Rules** - Hooks MUST be called at the top level, never inside:
   - Conditional statements (`if`, `else`)
   - Loops (`for`, `while`)
   - Nested functions
   - Early returns

2. **Redundant hooks** - Nếu đã có `const level = useLevel()` ở line 32, không cần gọi lại `useLevel()` ở line 84

3. **Debug pattern** - React Error #310 thường do:
   - `useEffect` thiếu dependency array
   - Hook trong conditional/loop
   - `setState` trong render cycle

---

**Debug:** ✅ FIXED
