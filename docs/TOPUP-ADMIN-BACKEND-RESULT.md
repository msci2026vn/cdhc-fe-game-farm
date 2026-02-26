# Kết quả — Backend Admin Topup Endpoints

## Files tạo
| File | Status |
|------|--------|
| src/modules/topup/topup.admin.service.ts | ✅ 4 functions |
| src/modules/topup/topup.admin.routes.ts | ✅ 4 endpoints |

## Files sửa
| File | Thay đổi | Status |
|------|---------|--------|
| src/index.ts | Import + mount `/api/admin/topup` (line 36, 160) | ✅ |
| src/modules/topup/topup.service.ts | Export `transferAvaxToUser` (line 182) | ✅ |

## API Tests
| Endpoint | Response | Status |
|----------|----------|--------|
| GET /api/admin/topup/stats | `{"totalOrders":1,"completedOrders":0,"failedOrders":0,"pendingOrders":1,"totalAvax":0,"totalUsdCents":0}` | ✅ |
| GET /api/admin/topup/orders?page=1&limit=5 | 1 order + pagination `{"page":1,"limit":5,"total":1,"totalPages":1}` | ✅ |
| GET /api/admin/topup/orders?status=completed | Empty list (đúng — chưa có completed) | ✅ |
| GET /api/admin/topup/orders/:id | Full detail with userName, userEmail join | ✅ |
| POST /api/admin/topup/orders/:id/retry | Sẵn sàng (chỉ cho status=failed) | ✅ |
| Unauthorized (no token) | `{"success":false,"error":{"code":"MISSING_TOKEN",...}}` | ✅ |

## Chi tiết kỹ thuật

### Admin Service (`topup.admin.service.ts`)
- **getTopupStats()** — 1 query duy nhất với `count(*) filter(where...)` cho 6 stats
- **getTopupOrders(params)** — Filter: status, userId, dateFrom, dateTo + pagination + leftJoin users
- **getTopupOrderById(orderId)** — Detail + user info join
- **retryTopupTransfer(orderId)** — Chỉ cho status=`failed`, reset → `paid` rồi gọi `transferAvaxToUser` async

### Admin Routes (`topup.admin.routes.ts`)
- Middleware: `authMiddleware()` + `adminMiddleware()` trên `*`
- Import pattern giống `topup.routes.ts`

### Mount
- `app.route('/api/admin/topup', adminTopupRoutes)` — line 160 trong index.ts
- Nằm cạnh `app.route('/api/topup', topupRoutes)` — line 159

### Response format
Tất cả trả `{ success: true, data: ... }` — khớp với admin frontend expect.
