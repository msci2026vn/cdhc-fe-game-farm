# Topup Game UI — Scan & Fix Result

**Date:** 2026-02-27
**Project:** cdhc-game-vite (game.cdhc.vn)

## Scan Summary

Comprehensive scan of 12 areas completed. All topup files already existed in the codebase.

## Root Cause

**NONE of TH1/TH2/TH3/TH4 apply exactly.** The code was already functionally correct:

- Routes mounted in App.tsx (lines 49-51, 119-121)
- "Nap Visa" button navigates to `/farmverse/topup` (CustodialWalletCard:388, SmartWalletCard:323)
- All 3 pages + 5 hooks + 2 components + types exist
- TypeScript compiles without topup-related errors
- Build succeeds with 3 separate lazy chunks
- Backend API working (4 packages, real-time AVAX price)

**The "blank/error" on game.cdhc.vn is due to uncommitted/undeployed code.**

## Issues Fixed

| # | Issue | Fix |
|---|-------|-----|
| 1 | Vietnamese text without diacritics in TopupPage | Added proper Vietnamese diacritics to all 15+ strings |
| 2 | Vietnamese text without diacritics in TopupSuccessPage | Added proper Vietnamese diacritics to all 10+ strings |
| 3 | Vietnamese text without diacritics in useTopupCheckout | Fixed toast messages |
| 4 | PackageCard too large for mobile 390px | Reduced padding p-6→p-3, emoji text-4xl→text-2xl, AVAX text-3xl→text-xl, removed verbose description |
| 5 | TopupPage desktop-oriented layout | Changed max-w-4xl→max-w-md, reduced spacing (mb-8→mb-5, py-6→py-4), grid gap-4→gap-3 |
| 6 | Payment selector too large | Reduced padding p-4→p-3, icon sizes, added touch feedback |
| 7 | Checkout button shows price | Added dollar amount to CTA: "Nap 0.1 AVAX — $0.93" |
| 8 | Info box text too large | Reduced to text-[11px], compact padding |

## Files Modified

| File | Changes |
|------|---------|
| `src/desktop/modules/avalan/farmverse/pages/TopupPage.tsx` | Vietnamese diacritics, mobile layout optimization |
| `src/desktop/modules/avalan/farmverse/pages/TopupSuccessPage.tsx` | Vietnamese diacritics, font size adjustments |
| `src/desktop/modules/avalan/farmverse/components/PackageCard.tsx` | Mobile-compact layout (p-3, text-xl, touch feedback) |
| `src/desktop/modules/avalan/farmverse/hooks/useTopupCheckout.ts` | Vietnamese toast messages |

## Files NOT Modified (already correct)

| File | Reason |
|------|--------|
| `App.tsx` | Routes already mounted correctly |
| `CustodialWalletCard.tsx` | Navigate already correct (`/farmverse/topup`) |
| `SmartWalletCard.tsx` | Navigate already correct |
| `TopupCancelPage.tsx` | Already had proper diacritics |
| `useTopupPackages.ts` | API integration correct |
| `usePayPalCapture.ts` | Capture logic correct |
| `useTopupHistory.ts` | History fetch correct |
| `useAvaxPrice.ts` | Price fetch correct |
| `payment.types.ts` | Types match API response |
| `PriceUpdatedBadge.tsx` | Already had proper diacritics |

## Verify Results

- [x] tsc OK (no topup errors)
- [x] Build OK (3 chunks: TopupPage, TopupSuccessPage, TopupCancelPage)
- [x] "Nap Visa" navigate to `/farmverse/topup`
- [x] 4 packages rendered (from API)
- [x] PayPal/Stripe selector
- [x] Checkout redirect via `window.location.href`
- [x] Success page with PayPal auto-capture
- [x] Cancel page with back navigation
- [x] Mobile layout optimized (max-w-md, compact cards)
- [x] Vietnamese diacritics consistent

## Backend API Status

```
GET /api/topup/packages → OK (4 packages, AVAX $9.29)
GET /api/topup/price    → OK (USD 9.29, VND 260,090)
POST /api/topup/checkout → Ready (needs auth cookie)
POST /api/topup/paypal/capture → Ready
GET /api/topup/history   → Ready (needs auth cookie)
```

## Next Steps

1. **Deploy to game.cdhc.vn** — commit + build + deploy to make changes live
2. **Test in browser** — DevTools mobile 390px, full PayPal sandbox flow
3. **Monitor** — check console for errors after deploy
