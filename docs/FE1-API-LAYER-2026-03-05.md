# Kết quả FE-1 — API Layer + Hooks + Types
**Ngày:** 2026-03-05

## Types đã thêm (`social.types.ts`)
- [x] `FriendStatus` — union: none | request_sent | request_received | friends | blocked
- [x] `FriendRequest` + `FriendRequestsResult`
- [x] `UserSearchResult` + `SearchUsersResult`
- [x] `FriendActionResult`
- [x] `AddFriendPendingResult` — type mới cho addFriend response

## API functions (`api-social.ts`)
- [x] `addFriend` — fix return type: `AddFriendPendingResult` (thay cho `{ friend, referralCode }`)
- [x] `getFriendRequests` — GET /api/game/social/friend-requests
- [x] `searchUsers(q, limit)` — GET /api/game/social/search?q=&limit=
- [x] `acceptFriend(fromId)` — POST /api/game/social/accept-friend/:fromId
- [x] `declineFriend(fromId)` — DELETE /api/game/social/decline-friend/:fromId
- [x] `unfriend(friendId)` — DELETE /api/game/social/unfriend/:friendId

## Hooks (`useSocial.ts`)
- [x] `useAddFriend` — fix toast "Đã gửi lời mời kết bạn!" + fix invalidation (bỏ friends, thêm search)
- [x] `useAddFriend` — thêm onError với đầy đủ error codes từ BE
- [x] `useFriendRequests` — queryKey: ['game','social','friend-requests'], staleTime 30s
- [x] `useSearchUsers(q)` — enabled khi q.trim().length >= 2, queryKey: ['game','social','search',q]
- [x] `useAcceptFriend` — invalidate: friend-requests + friends + search
- [x] `useDeclineFriend` — invalidate: friend-requests + search
- [x] `useUnfriend` — invalidate: friends + search

## game-api.ts type re-exports
- [x] Thêm 7 types mới vào danh sách re-export

## Verify
- tsc --noEmit: **0 errors** ✅

## Query Keys (cho FE-2 import đúng)

| Hook | queryKey |
|------|---------|
| useFriends | `['game', 'social', 'friends']` |
| useFriendRequests | `['game', 'social', 'friend-requests']` |
| useSearchUsers(q) | `['game', 'social', 'search', q]` |
| useReferralInfo | `['game', 'social', 'referral']` |

## Exports cho FE-2 import từ `useSocial`

```typescript
import {
  useFriends,
  useFriendRequests,
  useSearchUsers,
  useAddFriend,
  useAcceptFriend,
  useDeclineFriend,
  useUnfriend,
  useInteractFriend,
  useReferralInfo,
} from '@/shared/hooks/useSocial';
```

```typescript
import type {
  FriendStatus,
  FriendRequest,
  UserSearchResult,
} from '@/shared/types/social.types';
// hoặc từ game-api.types (auto re-export)
import type { FriendStatus, FriendRequest, UserSearchResult } from '@/shared/types/game-api.types';
```
