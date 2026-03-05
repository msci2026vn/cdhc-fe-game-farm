# Ket qua FE-5 — Fix Field Mapping

**Ngay:** 2026-03-05
**Nguyen tac:** FE map theo BE — khong doi BE.

---

## Fixes da ap dung

| # | File | Fix |
|---|------|-----|
| 1 CRITICAL | `api-social.ts` | `getFriendRequests`: them mapping `fromUserId→fromId`, `fromUserName→fromName`, `fromUserPicture→fromPicture`, `fromUserLevel→fromLevel` |
| 2 | `api-social.ts` | `acceptFriend`: normalize return `{ message, success: true }` |
| 3 | `api-social.ts` | `declineFriend`: normalize return `{ message, success: true }` |
| 4 | `api-social.ts` | `unfriend`: normalize return `{ message, success: true }` |
| 5 | `api-social.ts` | Update comment: BE Zod chi accept `'water'\|'like'\|'gift'` |
| 6 | `social.types.ts` | `FriendActionResult.success` doi thanh optional (`success?: boolean`) |
| 7 | `request.types.ts` | `InteractType` bo `'comment'` (BE Zod reject, khong co component nao dung) |
| 8 | `useSocial.ts` | `useInteractFriend` inline type bo `'comment'`, bo `comment?` trong data |

---

## Verify

- tsc `--noEmit`: **0 errors**
- `getFriendRequests` map dung: **OK** (grep xac nhan `r.fromUserId` → `fromId`)
- Khong con `'comment'` trong `InteractType`: **OK**

---

## 7/7 Endpoints

| Endpoint | Truoc | Sau |
|----------|-------|-----|
| GET /friends | OK | OK |
| GET /friend-requests | BROKEN (undefined fields) | OK (mapped) |
| GET /search | OK | OK |
| POST /add-friend | OK | OK |
| POST /accept-friend | OK | OK |
| DELETE /decline-friend | OK | OK |
| DELETE /unfriend | OK | OK |

---

**San sang ship: YES**
