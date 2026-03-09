# Final Audit — Friend System FE ↔ BE
**Ngay:** 2026-03-05
**Model:** Claude Sonnet 4.6

---

## Tong ket
- Endpoints khop hoan toan: 5 / 7
- Can fix ngay: 1 (CRITICAL)
- Type mismatch nhe: 2

---

## BE Response Contract (thuc te)

| Endpoint | BE tra ve fields |
|----------|-----------------|
| GET /friends | `{ friends: [{ friendId, name, email, picture, level, ogn, status, interactedToday }] }` |
| GET /friend-requests | `{ requests: [{ fromUserId, fromUserName, fromUserPicture, fromUserLevel, createdAt }] }` |
| GET /search?q= | `{ results: [{ userId, name, picture, level, friendStatus }], total }` |
| POST /add-friend | `{ friendId, friendName, status: 'pending', message }` |
| POST /accept-friend/:id | `{ friendId, friendName, message }` |
| DELETE /decline-friend/:id | `{ message }` |
| DELETE /unfriend/:id | `{ message }` |

---

## 5.1 Field Mismatch Audit

| Endpoint | BE field | FE field | Map? | Status |
|----------|----------|----------|------|--------|
| GET /friends | `friendId` | `friend.id` | YES (api: `f.friendId \|\| f.id`) | OK |
| GET /friends | `picture` | `friend.avatar` | YES (api: `f.picture`) | OK |
| GET /friend-requests | `fromUserId` | `request.fromId` | **NO — raw return** | BROKEN |
| GET /friend-requests | `fromUserName` | `request.fromName` | **NO — raw return** | BROKEN |
| GET /friend-requests | `fromUserPicture` | `request.fromPicture` | **NO — raw return** | BROKEN |
| GET /friend-requests | `fromUserLevel` | `request.fromLevel` | **NO — raw return** | BROKEN |
| GET /search | `userId` | `result.id` | YES (api: `u.userId`) | OK |
| POST /accept-friend | `{ friendId, friendName, message }` | `FriendActionResult { success, message }` | raw return | Type mismatch, runtime OK |
| DELETE /decline-friend | `{ message }` | `FriendActionResult { success, message }` | raw return | Type mismatch, runtime OK |
| DELETE /unfriend | `{ message }` | `FriendActionResult { success, message }` | raw return | Type mismatch, runtime OK |

---

## CRITICAL BUG — GET /friend-requests

**Van de:** `api-social.getFriendRequests()` tra ve `json.data` TRUC TIEP, khong co mapping.

BE tra ve:
```json
{
  "fromUserId": "003bf9c4-...",
  "fromUserName": "Tran Thi Thuy",
  "fromUserPicture": null,
  "fromUserLevel": 5,
  "createdAt": "2026-03-05T13:49:52.119Z"
}
```

FE type `FriendRequest` expect:
```typescript
{
  fromId: string;        // undefined — BE gui fromUserId
  fromName: string;      // undefined — BE gui fromUserName
  fromPicture: ...;      // undefined — BE gui fromUserPicture
  fromLevel: number;     // undefined — BE gui fromUserLevel
  createdAt: string;     // OK
}
```

**Hau qua:**
- `RequestCard` hien thi `fromName` = undefined → text "undefined"
- `RequestCard.fromLevel` = undefined → "Lv.undefined"
- `onAccept(request.fromId)` → `acceptFriend.mutate(undefined)` → API call that will fail
- `onDecline(request.fromId)` → `declineFriend.mutate(undefined)` → API call that will fail

**Can fix tai:** `src/shared/api/api-social.ts` trong ham `getFriendRequests`,
them mapping tuong tu nhu `getFriends` va `searchUsers`.

**Fix can lam:**
```typescript
const raw = json.data?.requests || [];
const requests = raw.map((r: Record<string, unknown>) => ({
  fromId: r.fromUserId,
  fromName: (r.fromUserName as string) || 'Unknown',
  fromPicture: (r.fromUserPicture as string) ?? null,
  fromLevel: (r.fromUserLevel as number) ?? 1,
  createdAt: r.createdAt,
}));
return { requests };
```

---

## 5.2 Query Invalidation Audit

| Action | Invalidate keys | Status |
|--------|----------------|--------|
| addFriend onSuccess | `search`, `referral` | OK — dung (chi send, khong can invalidate friend-requests/friends) |
| acceptFriend onSuccess | `friend-requests`, `friends`, `search` | OK |
| declineFriend onSuccess | `friend-requests`, `search` | OK |
| unfriend onSuccess | `friends`, `search` | OK |

---

## 5.3 Error Handling Audit

| BE Error Code | HTTP | FE xu ly | Toast message |
|---------------|------|----------|---------------|
| `REQUEST_ALREADY_SENT` | 409 | YES (useAddFriend.onError) | "Da gui loi moi roi!" |
| `THEY_SENT_REQUEST_FIRST` | 409 | YES (useAddFriend.onError) | "Ho da gui loi moi cho ban, hay chap nhan!" |
| `ALREADY_FRIENDS` | 409 | YES (useAddFriend.onError) | "Da la ban be roi!" |
| `CANNOT_ADD_SELF` | 400 | YES (useAddFriend.onError) | "Khong the ket ban voi chinh minh!" |
| `REQUEST_NOT_FOUND` | 404 | PARTIAL (generic) | "Khong tim thay loi moi ket ban" |
| `NOT_FRIENDS` | 400 | PARTIAL (generic) | "Co loi xay ra" |
| `BLOCKED` | 403 | PARTIAL (falls to error.message) | BE message text |
| `QUERY_TOO_SHORT` | 400 | YES (disabled when q < 2) | N/A |
| `MAX_FRIENDS` | 400 | YES (useAddFriend.onError) | "Da dat gioi han ban be!" |

---

## 5.4 Other Issues

### 1. FriendActionResult type has `success: boolean` but BE doesn't return it
- `acceptFriend` BE returns: `{ friendId, friendName, message }` (no `success`)
- `declineFriend` BE returns: `{ message }` (no `success`)
- `unfriend` BE returns: `{ message }` (no `success`)
- FE type `FriendActionResult { success: boolean, message: string }` is wrong
- **Runtime OK** — components only use `onSuccess()`/`onError()` callbacks, never read `.success` from data
- **Fix type only** (non-critical)

### 2. `interactFriend` sends `type: 'comment'` but BE Zod rejects it
- BE schema: `type: z.enum(['water', 'like', 'gift'])` — 'comment' not allowed
- FE `useInteractFriend` accepts `type: 'water' | 'like' | 'comment' | 'gift'`
- If FE calls with `type: 'comment'` → BE returns 400 VALIDATION_ERROR
- Check: does any component actually pass `type: 'comment'`? Not visible in current friends UI.

### 3. `getFriends` maps `interactedToday` (BE) — not in FE FriendData type
- FE `FriendData` has no `interactedToday` field
- Not shown in any component currently
- Non-critical (extra field ignored)

### 4. `getFriends` returns `myReferralCode: ''` always
- BE /friends endpoint doesn't return `myReferralCode`
- FE `FriendsResult` has this field, but current components don't use it from this query
- `useReferralInfo()` is separate and correct

---

## DB Data (2026-03-05T13:49)

```
3 pending friend requests:
- Tran Thi Thuy → Bui Thi Hang (pending, 13:49)
- NGUYEN QUANG HUY → Bui Thi Hang (pending, 13:47)
- NGUYEN QUANG HUY → Do Thi Thanh Van (pending, 13:47)
```

No accepted friendships yet. Data is fresh from test.

---

## Ket luan

| # | Van de | Muc do | Can fix tai |
|---|--------|--------|-------------|
| 1 | `getFriendRequests` khong map BE → FE fields | **CRITICAL** | `api-social.ts:getFriendRequests` |
| 2 | `FriendActionResult.success` type sai | Minor | `social.types.ts:FriendActionResult` |
| 3 | `interactFriend` type includes 'comment' but BE rejects it | Minor | `request.types.ts:InteractType` hoac BE schema |

**San sang ship:** KHONG — can fix Bug #1 truoc khi ship.

---

## Git Status
- BE: local changes tai `/home/cdhc/apps/cdhc-be/` — chua push (no SSH key)
- FE: local changes chua commit
- BE commits lien quan: social.service.ts + social.ts updated 2026-03-05
