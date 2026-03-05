# Kết quả FE-2 — Friend System UI
**Ngày:** 2026-03-05

## Files đã tạo mới
- [x] `RequestCard.tsx` — card lời mời kết bạn (avatar, name, level, Accept/Decline buttons)
- [x] `AddFriendButton.tsx` — button state-aware theo FriendStatus
- [x] `SearchTab.tsx` — search input + debounce 400ms + results với AddFriendButton
- [x] `FriendRequestsTab.tsx` — list lời mời đến với loadingId tracking

## Files đã sửa/xóa
- [x] `FriendsScreen.tsx` — rewrite với tabs + unfriend confirm dialog
- [x] `FriendsList.tsx` — đã xóa (dead code, không có import nào)

## UI Checklist
- [x] Tab bar 3 tabs: 👥 Bạn bè | 📨 Lời mời | 🔍 Tìm kiếm
- [x] Badge đỏ số lượng lời mời trên tab "Lời mời" (ẩn khi = 0)
- [x] Tab "Lời mời" — RequestCard với Accept/Decline, loadingId per card
- [x] Tab "Tìm kiếm" — debounce 400ms + skeleton loading + AddFriendButton
- [x] Tab "Bạn bè" — unfriend `···` button → confirm dialog
- [x] Empty states: tab Bạn bè → nút Tìm bạn bè + Mời bạn
- [x] Empty state tab Lời mời: 📭 "Chưa có lời mời nào"
- [x] Loading states: spinner + skeleton cards

## AddFriendButton states
| FriendStatus | Label | Style |
|---|---|---|
| `none` | + Kết bạn | Filled xanh lá, active |
| `request_sent` | Đã gửi lời mời | Ghost gray, disabled |
| `request_received` | Chấp nhận ✓ | Filled amber/orange, active |
| `friends` | Bạn bè ✓ | Ghost gray, disabled |
| `blocked` | (ẩn) | — |

## Query invalidation flow
- `useAddFriend` onSuccess → invalidate search (friendStatus → request_sent)
- `useAcceptFriend` onSuccess → invalidate friend-requests + friends + search
- `useDeclineFriend` onSuccess → invalidate friend-requests + search
- `useUnfriend` onSuccess → invalidate friends + search

## Verify
- tsc --noEmit: **0 errors** ✅
- Không còn import FriendsList ✅
- Components folder: 7 files (FriendsList đã xóa) ✅

## Component tree thực tế

```
FriendsScreen
  ├── Header (Mời bạn + BXH buttons)
  ├── TabBar [Bạn bè | Lời mời🔴n | Tìm kiếm]
  ├── Tab "friends"
  │     └── FriendCard (visit + ··· unfriend button)
  │           └── UnfriendConfirmOverlay (z-200)
  ├── Tab "requests"
  │     └── FriendRequestsTab
  │           └── RequestCard × n
  ├── Tab "search"
  │     └── SearchTab
  │           ├── SearchInput (debounce 400ms)
  │           └── UserCard + AddFriendButton × n
  ├── InviteFriends (sheet)
  ├── Leaderboard (sheet)
  └── BottomNav
```
