# Scan & Fix — Frontend User + Backend (Topup AVAX)

**Ngay:** 2026-02-26

---

## A. Backend

| # | Check | Ket qua | Ghi chu |
|---|-------|---------|---------|
| 1 | PM2 running | ✅ | 2 instances, online 8h |
| 2 | ENV STRIPE_SECRET_KEY | ⚠️ | Co nhung la PLACEHOLDER |
| 3 | ENV STRIPE_WEBHOOK_SECRET | ⚠️ | Co nhung la PLACEHOLDER |
| 4 | ENV AVALANCHE_RPC_URL | ✅ | |
| 5 | ENV DEPLOYER_PRIVATE_KEY | ✅ | |
| 6 | ENV APP_URL | ✅ | https://sta.cdhc.vn |
| 7 | ENV FRONTEND_URL | ✅ | DA THEM: https://avalan.cdhc.vn |
| 8 | Redis AVAX price | ✅ | $9.32, TTL 483s, stale=false |
| 9 | Pricing cron | ✅ | Chay moi 5 phut, log "AVAX = $9.32 = 260,868d" |
| 10 | Hot wallet balance | ✅ | 0x8547ff92...32A24 — 0.146 AVAX |
| 11 | /packages response | ✅ | 4 goi, all fields match FE types |
| 12 | /price response | ✅ | usd/vnd/updatedAt/stale — all OK |
| 13 | /checkout (no auth) | ✅ | 401 MISSING_TOKEN (dung) |
| 14 | /webhook (no sig) | ✅ | "Missing stripe-signature header" (dung) |
| 15 | /history (no auth) | ✅ | 401 MISSING_TOKEN (dung) |
| 16 | success_url khop FE | ✅ | DA FIX: /farmverse/topup/success |
| 17 | cancel_url khop FE | ✅ | DA FIX: /farmverse/topup/cancel |
| 18 | CORS avalan.cdhc.vn | ✅ | Allow-Origin + Credentials OK |
| 19 | CORS localhost | ⚠️ | Khong tra Allow-Origin (dev co the bi block) |

## B. Frontend User

| # | Check | Ket qua | Ghi chu |
|---|-------|---------|---------|
| 1 | tsc --noEmit | ⚠️ | Pre-existing errors (usePlantSeed, useWalletAuth, etc) — KHONG lien quan topup |
| 2 | 10 files du | ✅ | types + 4 hooks + 2 components + 3 pages |
| 3 | 3 routes mount | ✅ | /farmverse/topup, /topup/success, /topup/cancel |
| 4 | API URL (env) | ✅ | API_BASE_URL tu VITE_API_URL, fallback sta.cdhc.vn |
| 5 | credentials include | ✅ | Tat ca 4 hooks deu co credentials: 'include' |
| 6 | Types khop BE | ✅ | So sanh response that vs FE types — all match |
| 7 | Null safety (.toFixed) | ✅ | DA FIX: ?? 0 cho 3 cho |
| 8 | Checkout redirect | ✅ | POST body {packageId}, read json.data.sessionUrl, window.location.href |
| 9 | Success page | ✅ | Doc session_id tu searchParams, hien ma giao dich |
| 10 | Cancel page | ✅ | Hien "Da huy", nut quay lai /farmverse/topup |
| 11 | Error handling | ✅ | handleApiError (401 redirect), toast.error, "Session expired" skip |
| 12 | API unwrap level | ✅ | Hooks doc json.data (KHONG auto-unwrap) — dung |

## Loi tim duoc + da fix

| # | Muc | Mo ta | File | Fix |
|---|-----|-------|------|-----|
| 1 | 🔴 | **success_url domain sai**: dung APP_URL=sta.cdhc.vn (BE URL) thay vi FE URL | BE: topup.service.ts:72 | Them FRONTEND_URL=avalan.cdhc.vn vao .env, doi frontendUrl dung FRONTEND_URL |
| 2 | 🔴 | **success_url path sai**: /farmverse/payment/success nhung FE route la /farmverse/topup/success | BE: topup.service.ts:98-99 | Doi /payment/ thanh /topup/ |
| 3 | 🔴 | **cancel_url path sai**: /farmverse/payment/cancel nhung FE route la /farmverse/topup/cancel | BE: topup.service.ts:99 | Doi /payment/ thanh /topup/ |
| 4 | 🔴 | **pkg.priceUsd.toFixed(2)** crash neu undefined | FE: PackageCard.tsx:43 | (pkg.priceUsd ?? 0).toFixed(2) |
| 5 | 🔴 | **pkg.priceVnd.toLocaleString()** crash neu undefined | FE: PackageCard.tsx:46 | (pkg.priceVnd ?? 0).toLocaleString('vi-VN') |
| 6 | 🔴 | **avaxPriceUsd.toFixed(2)** crash neu undefined | FE: PriceUpdatedBadge.tsx:26 | (avaxPriceUsd ?? 0).toFixed(2) |

## Can admin lam thu cong

| # | Viec | Huong dan |
|---|------|----------|
| 1 | **Thay Stripe test key** | Stripe Dashboard > Developers > API keys > Copy sk_test_... va paste vao .env STRIPE_SECRET_KEY |
| 2 | **Dang ky webhook URL** | Stripe Dashboard > Developers > Webhooks > Add endpoint: `https://sta.cdhc.vn/api/topup/webhook/stripe`, events: `checkout.session.completed` |
| 3 | **Copy webhook secret** | Sau khi tao webhook, copy whsec_... paste vao .env STRIPE_WEBHOOK_SECRET |
| 4 | **Nap AVAX hot wallet** (optional) | Gui AVAX vao: `0x8547ff92099e6Cd6202aa6F559f7Dd8C7Da32A24` — hien co 0.146 AVAX, du cho ~3 giao dich nho |
| 5 | **CORS localhost** (dev) | Them localhost vao CORS config neu can test local |

## Type Matching — BE Response vs FE Types

| FE Type Field | BE Response | Type | Khop? |
|---|---|---|---|
| TopupPackage.id | id | string | ✅ |
| TopupPackage.name | name | string | ✅ |
| TopupPackage.avaxAmount | avaxAmount | string | ✅ |
| TopupPackage.emoji | emoji | string | ✅ |
| TopupPackage.description | description | string | ✅ |
| TopupPackage.priceUsd | priceUsd | number (float) | ✅ |
| TopupPackage.priceUsdCents | priceUsdCents | number (int) | ✅ |
| TopupPackage.priceVnd | priceVnd | number (int) | ✅ |
| data.avaxPriceUsd | avaxPriceUsd | number (float) | ✅ |
| data.avaxPriceVnd | avaxPriceVnd | number (int) | ✅ |
| data.updatedAt | updatedAt | number (timestamp) | ✅ |
| data.stale | stale | boolean | ✅ |
| AvaxPriceResponse.data.usd | usd | number (float) | ✅ |
| AvaxPriceResponse.data.vnd | vnd | number (int) | ✅ |

## Tong ket

- **6 loi tim duoc, 6 da fix** (3 BE, 3 FE)
- **2 loi 🔴 Critical nhat**: route mismatch se khien user 404 sau khi thanh toan Stripe
- **Stripe PLACEHOLDER**: checkout se FAIL cho den khi admin thay key that
- **Hot wallet**: 0.146 AVAX — du cho vai giao dich test
- **FE types**: 100% khop BE response — khong co field mismatch
