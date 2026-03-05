# Friend System FE Analysis — Organic Kingdom
**Ngày scan:** 2026-03-05

---

## 1. Hiện trạng FE

### 1.1 Social/Friend code đang có

**Files tồn tại:**

| File | Nội dung |
|------|----------|
| `src/shared/api/api-social.ts` | API layer: getFriends, addFriend, interactFriend, getFriendFarm, getReferralInfo |
| `src/shared/hooks/useSocial.ts` | React Query hooks: useFriends, useReferralInfo, useAddFriend, useInteractFriend |
| `src/shared/hooks/useFriendFarm.ts` | Hook: useFriendFarm (view friend's farm) |
| `src/shared/types/social.types.ts` | Types: FriendData, FriendsResult, ReferralInfoResult, FriendFarmData, v.v. |
| `src/modules/friends/screens/FriendsScreen.tsx` | Page tại `/friends` — full screen list |
| `src/modules/friends/components/FriendsList.tsx` | Sheet/overlay (hiện không dùng trong FriendsScreen) |
| `src/modules/friends/components/InviteFriends.tsx` | Sheet — referral code + share + stats |
| `src/modules/friends/components/FriendGarden.tsx` | Full screen — xem vườn bạn + water/like |
| `src/modules/friends/components/Leaderboard.tsx` | Sheet — BXH OGN/XP/Level/Harvest |

**API calls đang gọi:**

| Endpoint BE | FE Function | Có sẵn? |
|-------------|-------------|---------|
| `GET /social/friends` | `socialApi.getFriends()` | ✅ |
| `POST /social/interact` | `socialApi.interactFriend()` | ✅ |
| `POST /social/add-friend` | `socialApi.addFriend()` | ✅ (nhưng có lỗi — xem §3) |
| `GET /social/friend-farm/:id` | `socialApi.getFriendFarm()` | ✅ |
| `GET /social/referral` | `socialApi.getReferralInfo()` | ✅ |
| `GET /social/friend-requests` | — | ❌ THIẾU |
| `GET /social/search?q=` | — | ❌ THIẾU |
| `POST /social/accept-friend/:id` | — | ❌ THIẾU |
| `DELETE /social/decline-friend/:id` | — | ❌ THIẾU |
| `DELETE /social/unfriend/:id` | — | ❌ THIẾU |

**Zustand store:** Không có store riêng cho social. Toàn bộ state dùng React Query cache.

**React Query hooks hiện có:** `useFriends`, `useReferralInfo`, `useAddFriend`, `useInteractFriend`, `useFriendFarm`

### 1.2 Routing hiện tại

- Route `/friends` đã đăng ký trong `App.tsx` ✅
- BottomNav có tab "Bạn bè" (icon `group`) → `/friends` ✅
- Không cần thêm route mới — mở rộng trang hiện có là đủ

---

## 2. Stack & Pattern

| Hạng mục | Đang dùng |
|----------|-----------|
| State management | React Query cache (không dùng Zustand cho social) |
| Data fetching | TanStack Query v5 — `useQuery` + `useMutation` |
| Toast | `useUIStore.getState().addToast(msg, type, emoji)` |
| UI overlay | Fixed bottom sheet pattern — `fixed inset-0 z-[100] flex items-end` |
| Full screen | `fixed inset-0 z-[100] flex flex-col max-w-[430px] mx-auto` |
| Routing | react-router-dom v6 — lazy load với `lazyWithRetry` |
| Audio | `playSound('ui_click')`, `audioManager.startBgm()` |
| Style | Tailwind + inline style (không dùng shadcn/Radix nhiều) |

---

## 3. GAP ANALYSIS — FE cần làm gì?

### 3.1 Bug nghiêm trọng — Hành vi `addFriend` đã thay đổi

**BE đã cập nhật 2026-03-05**: `POST /social/add-friend` giờ gửi **pending request** (không tự accept nữa).

- **FE hiện tại**: `useAddFriend.onSuccess` → toast `"Đã kết bạn thành công!"` ← **SAI**
- **Đúng**: phải toast `"Đã gửi lời mời kết bạn!"` và invalidate `friend-requests` thay vì `friends`
- FE type `AddFriendResult = { friend: FriendData; referralCode: string }` — cần cập nhật theo response thực tế

### 3.2 API functions cần thêm

```typescript
// Trong api-social.ts — thêm 4 functions mới:

getFriendRequests: async (): Promise<{ requests: FriendRequest[] }>
searchUsers: async (q: string, limit?: number): Promise<{ results: UserSearchResult[] }>
acceptFriend: async (fromId: string): Promise<{ friend: FriendData }>
declineFriend: async (fromId: string): Promise<{ success: boolean }>
unfriend: async (friendId: string): Promise<{ success: boolean }>
```

### 3.3 React Query hooks cần thêm

```typescript
// Trong useSocial.ts:

useFriendRequests()       // useQuery — GET /social/friend-requests
useSearchUsers(q: string) // useQuery — GET /social/search?q=
useAcceptFriend()         // useMutation — POST /social/accept-friend/:id
useDeclineFriend()        // useMutation — DELETE /social/decline-friend/:id
useUnfriend()             // useMutation — DELETE /social/unfriend/:id
```

### 3.4 Types cần thêm trong `social.types.ts`

```typescript
type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

interface FriendRequest {
  id: string;          // requestId
  fromId: string;
  fromName: string;
  fromPicture: string | null;
  fromLevel: number;
  createdAt: string;
}

interface UserSearchResult {
  id: string;
  name: string;
  picture: string | null;
  level: number;
  friendStatus: FriendStatus;
}
```

### 3.5 UI Components cần thêm/sửa

| Component | Trạng thái | Mô tả |
|-----------|-----------|-------|
| `FriendsScreen` — tab "Lời mời" | ❌ THIẾU | List pending requests với Accept/Decline |
| `SearchUsersSheet` | ❌ THIẾU | Sheet tìm user theo tên + Add Friend button |
| `FriendCard` — nút Unfriend | ❌ THIẾU | Thêm option unfriend vào card hiện có |
| `AddFriendButton` (state-aware) | ❌ THIẾU | none/pending_sent/pending_received/friends |
| `useAddFriend` toast fix | ❌ BUG | Đổi "kết bạn" → "gửi lời mời" |

---

## 4. PHƯƠNG ÁN ĐỀ XUẤT

### Phương án A: Thêm tabs vào FriendsScreen (KHUYẾN NGHỊ ✅)

Mở rộng `FriendsScreen.tsx` hiện có — thêm tab bar 3 tabs:
- `[Bạn bè]` — danh sách friends (hiện có)
- `[Lời mời]` — pending requests với badge số lượng
- `[Tìm kiếm]` — search input → kết quả với Add button

**Pros:**
- Không thêm route mới
- BottomNav không cần sửa
- Consistent với design pattern hiện tại
- Effort thấp nhất

**Cons:**
- FriendsScreen hơi phức tạp hơn (nhưng vẫn manageable)

**Effort:** ~4-5 giờ

---

### Phương án B: Sheet overlay riêng từng tính năng

Search = sheet, Friend requests = sheet, Friends list = sheet. Entry từ icon trong header.

**Pros:** Modular, mỗi tính năng độc lập

**Cons:** Nhiều layer modal lồng nhau, UX khó hơn (mở sheet từ sheet)

**Effort:** ~6-7 giờ

---

### Phương án C: Tách trang `/friend-requests` riêng

Route mới `/friend-requests` + entry từ notification badge.

**Pros:** Clean separation

**Cons:** Thêm route, phức tạp navigation, không cần thiết với lượng feature nhỏ

**Effort:** ~7-8 giờ

---

**Phương án được khuyến nghị: A** — tab trong FriendsScreen, tích hợp search bar trên đầu.

---

## 5. COMPONENT TREE ĐỀ XUẤT

```
/friends (FriendsScreen — existing, mở rộng)
  ├── Header (existing)
  │     ├── SearchBar (NEW — inline input hoặc mở SearchSheet)
  │     └── QuickActions: [Mời bạn] [BXH]
  │
  ├── TabBar (NEW) — [Bạn bè | Lời mời 🔴{n} | Tìm kiếm]
  │
  ├── Tab "Bạn bè" (existing FriendsList logic)
  │     └── FriendCard (existing) + [Hủy kết bạn] button (NEW)
  │
  ├── Tab "Lời mời" (NEW — FriendRequestsList)
  │     └── RequestCard (NEW)
  │           ├── Avatar + Name + Level
  │           ├── [Chấp nhận] button → useAcceptFriend
  │           └── [Từ chối] button → useDeclineFriend
  │
  └── Tab "Tìm kiếm" (NEW — SearchUsers)
        ├── SearchInput (debounced, min 2 chars)
        └── SearchResultList
              └── UserCard (NEW)
                    ├── Avatar + Name + Level
                    └── AddFriendButton (state-aware)
                          ├── none → [Kết bạn] → useAddFriend
                          ├── pending_sent → [Đã gửi lời mời] disabled
                          ├── pending_received → [Chấp nhận] → useAcceptFriend
                          └── friends → [Bạn bè ✓] disabled

Modals (unchanged):
  ├── InviteFriends (existing)
  ├── Leaderboard (existing)
  └── FriendGarden (existing — navigate on FriendCard click)
```

---

## 6. CHI TIẾT CẦN LÀM (theo thứ tự)

### Bước 1 — Fix bug + API layer (~1 giờ)
- Sửa `useAddFriend` toast message + invalidation
- Thêm types: `FriendStatus`, `FriendRequest`, `UserSearchResult`
- Thêm 5 API functions vào `api-social.ts`

### Bước 2 — React Query hooks (~30 phút)
- Thêm 5 hooks vào `useSocial.ts`
- `useSearchUsers` cần debounce + `enabled: q.length >= 2`

### Bước 3 — Tab bar + Friend Requests UI (~1.5 giờ)
- Thêm tab state vào FriendsScreen
- `RequestCard` component
- Badge đỏ số lượng pending

### Bước 4 — Search UI (~1.5 giờ)
- Search input với debounce 400ms
- `UserCard` với `AddFriendButton` state-aware
- Loading/empty states

### Bước 5 — Unfriend trong FriendCard (~30 phút)
- Long-press hoặc context menu nhỏ → Hủy kết bạn
- Confirm trước khi unfriend

---

## 7. ƯỚC TÍNH

| Hạng mục | Effort |
|----------|--------|
| Fix bug addFriend + types + 5 API functions | ~1 giờ |
| 5 React Query hooks | ~30 phút |
| Tab bar + Friend Requests UI | ~1.5 giờ |
| Search UI + AddFriendButton | ~1.5 giờ |
| Unfriend button | ~30 phút |
| **Tổng** | **~5 giờ (~1 ngày)** |

---

## 8. LƯU Ý QUAN TRỌNG

1. **BE `add-friend` giờ là pending** — FE đang toast sai, phải fix ngay khi implement
2. **BE search trả về `friendStatus`** — dùng để render AddFriendButton đúng trạng thái
3. **FriendsList.tsx** (`src/modules/friends/components/FriendsList.tsx`) là component cũ dạng sheet — hiện không được dùng trong FriendsScreen (FriendsScreen tự render inline). Có thể bỏ qua hoặc xóa sau.
4. **`game-api.types` vs `social.types`**: api-social.ts import từ `game-api.types` nhưng types thực tế nằm trong `social.types.ts` — nên chuẩn hóa import
5. **Không cần Zustand** — React Query + `invalidateQueries` là đủ, nhất quán với pattern hiện tại
