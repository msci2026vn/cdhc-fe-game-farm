# Kết quả FE-3 — Fix Tab Bar
**Ngày:** 2026-03-05

## Chẩn đoán

| Nguyên nhân | Kết quả |
|---|---|
| A: Tab bar bị ẩn khi friends.length === 0 | ❌ Không phải — tab bar ở dòng 70-94, KHÔNG có conditional |
| B: Import sai component cũ | ❌ Không phải — App.tsx lazy load đúng path |
| C: Conditional render sai thứ tự | ❌ Không phải — cấu trúc đúng: Header → TabBar → Content |
| **D: Vite cache cũ** | ✅ **NGUYÊN NHÂN** |

## Tại sao Code đúng nhưng UI cũ

FriendsScreen.tsx đã có đầy đủ tab bar + SearchTab + FriendRequestsTab từ FE-2.

Vite dev server đã cache compiled JS cũ trong `node_modules/.vite/` — khi HMR pick up file mới, nó vẫn serve bundle cũ cho lazy-loaded chunk `FriendsScreen`.

## Fix đã thực hiện

```bash
rm -rf node_modules/.vite   # đã xóa ✅
```

## Sau khi xóa cache — Việc cần làm thủ công

1. **Restart dev server:**
   ```bash
   Ctrl+C  # dừng server hiện tại
   bun run dev  # hoặc npm run dev
   ```

2. **Hard refresh trình duyệt:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
   - Hoặc: DevTools → Network → "Disable cache" → refresh

3. **Nếu dùng PWA (Install to Home Screen):** Xóa app và cài lại, hoặc:
   - Chrome DevTools → Application → Service Workers → "Unregister"
   - Application → Cache Storage → Clear all

## Verify
- tsc --noEmit: **0 errors** ✅
- Tab bar (dòng 70-94): render **vô điều kiện** — không có conditional wrapper ✅
- Empty state (dòng 113): nằm **bên trong** `{activeTab === 'friends' && ...}` ✅
- Nút "Tìm bạn bè" (dòng 122-126): gọi `setActiveTab('search')` ✅
- Vite cache: **đã xóa** ✅

## Cấu trúc render đúng (xác nhận)

```
<div flex-col>                     // outer container
  <div absolute z-0 />            // background (không che tab bar)
  <Header z-10 />                 // Header luôn hiển thị
  <TabBar z-10 />                 // Tab bar LUÔN hiển thị — KHÔNG conditional
  <Content flex-1 z-10>
    {activeTab === 'friends' && (
      isLoading    → spinner
      isError      → error message
      length === 0 → empty state + [Tìm bạn bè] + [Mời bạn]
      length > 0   → friend cards + unfriend button
    )}
    {activeTab === 'requests' && <FriendRequestsTab />}
    {activeTab === 'search'   && <SearchTab />}
  </Content>
  <UnfriendOverlay />
  <InviteFriends />
  <Leaderboard />
  <BottomNav />
</div>
```
