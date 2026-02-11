# Bước 28: Notification System — Report

**Ngày:** 2026-02-11
**Status:** ✅ COMPLETE

## Toast System

| Component | Status |
|-----------|--------|
| uiStore toast API | ✅ Upgraded (icon, duration, max 5 toasts) |
| Toast component | ✅ Upgraded (icons, slide-in animation) |
| Auto-dismiss | ✅ (success: 3s, error: 4s, warning: 3.5s, custom: 5s) |
| Max 5 toasts | ✅ (slice(-4) before push) |
| Slide-in animation | ✅ (@keyframes slide-in) |
| Mounted in App | ✅ |

**uiStore Upgrades:**
- Added `warning` type to toast types ('success' | 'error' | 'warning' | 'info')
- Added `icon?: string` field for custom emoji icons
- Added `duration?: number` field for custom durations
- Max 5 toasts with `[...s.toasts.slice(-4), toast]`
- Auto-dismiss: success 3s, error 4s, warning 3.5s, custom 5s

**Toast Component Upgrades:**
- Positioned: `fixed top-16 right-4 z-[100]`
- Icon mapping: success='✅', error='❌', warning='⚠️', info='ℹ️'
- Slide-in animation: `animate-slide-in`
- Click to dismiss: `onClick={() => removeToast(t.id)}`

**CSS Animation:**
```css
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

## Toast Coverage (10 hooks)

| Hook | Success | Error | Status |
|------|---------|-------|--------|
| usePlantSeed | 🌱 "Đã trồng [name]! -[cost] OGN" | OGN/SLOT errors | ✅ |
| useWaterPlot | 💧 "Tưới nước thành công! +[xp] XP" | COOLDOWN/DEAD warnings | ✅ |
| useHarvestPlot | 🎉 "Thu hoạch [name]! +[ogn] OGN +[xp] XP" | NOT_READY/DEAD errors | ✅ |
| useBossComplete | ⚔️ win / 💔 lose | Error toast | ✅ |
| useQuizAnswer | ✅ correct / ❌ wrong | Error toast | ✅ |
| useShopBuy | 🛒 "Đã mua [name]! -[cost] OGN" | OGN/STOCK errors | ✅ |
| useClearPlot | 🧹 "Đã dọn cây héo!" | - | ✅ |
| useSocial (AddFriend) | 👋 "Đã kết bạn thành công!" | - | ✅ |
| useSocial (Interact) | 👋 "Đã thăm vườn bạn! +[ogn] OGN" | ALREADY_INTERACTED/DAILY_LIMIT/NOT_FRIENDS warnings | ✅ |
| useGameSync | 🔄 "Đã đồng bộ dữ liệu!" | 📡 "Mất kết nối..." | ✅ |
| useLevelUpDetector | 🆙 "Level Up! [title] (Level [n])" | - | ✅ |

**Total toasts:** 10 hooks with toast coverage

## Toast Messages (using response data)

All toast messages use dynamic data from mutation responses:

### Success Messages
```
🌱 Plant    → "Đã trồng ${data.plantType?.name}! -${data.plot?.plantType?.shopPrice} OGN"
💧 Water    → "Tưới nước thành công! +${data.xpGained} XP"
🎉 Harvest  → "Thu hoạch ${data.plantName}! +${data.ognReward} OGN +${data.xpGained} XP"
⚔️ Boss     → "Đánh bại Boss! +${data.ognReward} OGN +${data.xpGained} XP"
✅ Quiz     → "Chính xác! +${data.ognGain} OGN +${data.xpGain} XP"
🛒 Shop     → "Đã mua ${data.item?.name}! -${data.ognSpent} OGN"
🧹 Clear    → "Đã dọn cây héo!"
👋 Social   → "Đã thăm vườn bạn! +${result.ognGain} OGN"
🔄 Sync     → "Đã đồng bộ dữ liệu! +${result.ogn} OGN +${result.xp} XP"
🆙 LevelUp  → "Level Up! ${getLevelTitle(level)} (Level ${level})"
```

### Error Messages
```
❌ Plant OGN error    → "Không đủ OGN!"
❌ Plant SLOT error   → "Ô trồng đã đầy!"
⏳ Water COOLDOWN     → "Đang cooldown, chờ ${cooldown}s!"
⏳ Water DEAD error   → "Cây đã héo rồi!"
❌ Harvest NOT_READY  → "Cây chưa chín!"
❌ Harvest DEAD       → "Cây đã héo, cần dọn vườn!"
❌ Shop OGN error    → "Không đủ OGN!"
❌ Shop STOCK error   → "Hết hàng!"
⚠️ Social ALREADY_INTERACTED_TODAY → "Đã tương tác hôm nay!"
⚠️ Social DAILY_LIMIT            → "Đã đạt giới hạn hôm nay!"
⚠️ Social NOT_FRIENDS            → "Chưa kết bạn!"
📡 Sync offline       → "Mất kết nối... Lưu offline, sẽ đồng bộ sau."
🔄 Sync online        → "Đã kết nối lại! Đang đồng bộ..."
```

## Build

| Check | Status |
|-------|--------|
| TypeScript 0 errors | ✅ |
| Vite build | ✅ (26.16s) |

## Files Modified/Created

**Modified:**
- `src/shared/stores/uiStore.ts` — Upgraded toast API
- `src/shared/components/Toast.tsx` — Icons + slide-in animation
- `src/App.tsx` — Mounted Toast component
- `src/index.css` — Added slide-in animation
- `src/shared/hooks/usePlantSeed.ts` — Added toasts
- `src/shared/hooks/useWaterPlot.ts` — Added toasts
- `src/shared/hooks/useHarvestPlot.ts` — Added toasts
- `src/shared/hooks/useBossComplete.ts` — Added toasts
- `src/shared/hooks/useQuizAnswer.ts` — Added toasts
- `src/shared/hooks/useShopBuy.ts` — Added toasts
- `src/shared/hooks/useClearPlot.ts` — Added toasts
- `src/shared/hooks/useSocial.ts` — Added toasts
- `src/shared/hooks/useGameSync.ts` — Added toasts
- `src/shared/hooks/useLevelUpDetector.ts` — Added toast

**Summary:**
- 15 files modified
- 10 hooks covered with toasts
- 0 silent mutations (every action has feedback)

## Summary

✅ **All objectives complete:**

1. **uiStore upgraded:** Icon support, custom duration, max 5 toasts
2. **Toast component upgraded:** Icons, slide-in animation, click to dismiss
3. **All mutations covered:** 10/10 hooks have toast notifications
4. **Dynamic messages:** All toasts use response data (no hardcode)
5. **Error handling:** Specific error messages for each error type
6. **Level-up toast:** Added to useLevelUpDetector
7. **Game sync toasts:** Offline/online notifications
8. **Toast mounted:** Toast component mounted in App.tsx
9. **CSS animations:** Slide-in animation added to index.css
10. **Build clean:** 0 TypeScript errors, 26.16s build time

## Issues

| # | Issue | Status |
|---|-------|--------|
| - | No issues | ✅ |

---

**Bước 28:** ✅ COMPLETE — Notification system with toast for every event
