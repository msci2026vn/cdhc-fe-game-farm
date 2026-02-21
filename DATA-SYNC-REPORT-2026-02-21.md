# DATA SYNC REPORT — Test vs Production
**Date:** 2026-02-21
**Test server:** sta.cdhc.vn (103.200.21.167) — cdhc-test
**Prod server:** api.cdhc.vn (103.90.225.250) — vietnix-cdhc
**Source of truth:** Production

---

## EXECUTIVE SUMMARY

| Table | Rows Test | Rows Prod | Data Match? | Issue |
|-------|-----------|-----------|-------------|-------|
| users | 395 | 395 | 99% (4 login timestamps) | Harmless |
| community_profiles | 395 | 395 | **NO — birth_date -1 day** | **NEEDS FIX** |
| point_conversions | 106 | 106 | YES (100%) | OK |

**Root cause:** Khi import data sang test, cột `birth_date` (type `date`) bị lệch **-1 ngày** do timezone conversion (UTC vs UTC+7). Ảnh hưởng **370/395 profiles** (25 profiles có birth_date = NULL không bị ảnh hưởng).

---

## PHASE 1: Row Counts

| Table | Test | Prod | Match? |
|-------|------|------|--------|
| users | 395 | 395 | YES |
| community_profiles | 395 | 395 | YES |
| point_conversions | 106 | 106 | YES |

**ID set checksums:** MATCH (md5 of string_agg of ordered IDs)

---

## PHASE 2: Users Table — Deep Comparison

### Method
Hash tất cả mutable fields (name, email, phone, role, status, google_id, avatar_url, is_approved, ogn_balance, tor_balance, shares_balance, xp, daily_xp, level) cho mỗi user.

### Result
- **391/395 users: IDENTICAL**
- **4 users khác** — chỉ khác `updated_at` và `last_login_at`:

| User ID | Name | Reason |
|---------|------|--------|
| 04231657 | Nguyễn Út Ngọc Mai | Login on test server |
| 2af6fb4c | Msci Backend | Login on test server |
| 7d0f0507 | Trần Thị Thanh Tuyền | Login on test server |
| a9aca8b4 | Sin. Club | Login on test server |

**Verdict:** NO ACTION NEEDED. Login timestamps naturally differ when users access test server.

---

## PHASE 3: Community Profiles — Deep Comparison

### Method
1. Hash tất cả fields (bao gồm birth_date) → **KHÁC** (test: `ce99b96b...`, prod: `223309ec...`)
2. Hash KHÔNG bao gồm birth_date → **KHỚP HOÀN TOÀN** (`fd96d95177d60c9cec4ddda483edac11`)

### Confirmed: Chỉ có `birth_date` khác

All other fields verified IDENTICAL:
- full_name
- phone
- province
- ward
- interests (array)
- interests_other
- legacy_rank
- legacy_shares
- legacy_ogn
- legacy_tor
- legacy_f1_total
- legacy_f1s (JSON array)

### Birth Date Differences — Pattern

| User | Test birth_date | Prod birth_date | Delta |
|------|-----------------|-----------------|-------|
| Trần Thị Thúy | 1989-01-31 | 1989-02-01 | **-1 day** |
| Nguyễn Thị Duyên | 1987-12-18 | 1987-12-19 | **-1 day** |
| TRAN THI HANH | 1960-02-19 | 1960-02-20 | **-1 day** |
| Phan thi tuyet mai | 1964-09-29 | 1964-09-30 | **-1 day** |
| Nguyễn Văn Tuấn | NULL | NULL | N/A |

**Pattern:** TẤT CẢ 370 profiles có birth_date đều bị lệch **chính xác -1 ngày**.

### Root Cause Analysis
- Column type: `date` (không có timezone info)
- Khi import, tool xử lý `date` như `timestamp` rồi convert UTC → local time (UTC+7)
- Kết quả: ngày bị trừ 1 (vd: `1989-02-01 00:00:00 UTC` → `1989-01-31 17:00:00 UTC+7` → lấy date = `1989-01-31`)

### Stats
- Total profiles: 395
- Affected (non-null birth_date): **370**
- Unaffected (null birth_date): **25**

### FIX Command
```sql
-- Preview trước khi chạy
SELECT user_id, birth_date AS current, birth_date + INTERVAL '1 day' AS corrected
FROM community_profiles
WHERE birth_date IS NOT NULL
LIMIT 10;

-- Chạy fix
UPDATE community_profiles
SET birth_date = birth_date + INTERVAL '1 day',
    updated_at = NOW()
WHERE birth_date IS NOT NULL;

-- Verify
-- So sánh lại hash với prod: fd96d95177d60c9cec4ddda483edac11
```

**Verdict:** **NEEDS FIX** — 370 birth_dates cần +1 day

---

## PHASE 4: Point Conversions — Deep Comparison

### Method
Hash data fields (id, user_id, from_type, from_amount, to_amount, rate, idempotency_key) và balance fields riêng.

### Result
| Hash Type | Test | Prod | Match? |
|-----------|------|------|--------|
| Data (no timestamps) | `9618c87a...` | `9618c87a...` | **YES** |
| Balance fields | `f811242...` | `f811242...` | **YES** |
| Full (with created_at::text) | `a43ddec...` | `b1b5876...` | NO* |

*Khác do microsecond precision trong `created_at::text`:
- Prod: `11:57:57.241702+00` (6 digits)
- Test: `11:57:57.241+00` (3 digits)

**Giá trị timestamp GIỐNG NHAU** — chỉ khác format hiển thị.

**Verdict:** NO ACTION NEEDED

---

## PHASE 5: Extra Columns on Test

Test server có 4 columns thêm trong `users` table (do wallet auth feature):
- `org_type`
- `pending_role`
- `wallet_address`
- `auth_provider`

Đây là do code mới được deploy trên test, **KHÔNG phải lỗi data**.

---

## SUMMARY & ACTION ITEMS

### Cần làm (1 item):
1. **FIX birth_date trên test server** — Chạy:
   ```sql
   UPDATE community_profiles
   SET birth_date = birth_date + INTERVAL '1 day'
   WHERE birth_date IS NOT NULL;
   ```
   Affected: 370 rows

### Không cần làm:
- users table: 4 login timestamps khác là bình thường
- point_conversions: Data identical, chỉ microsecond display format khác
- Extra columns trên test: Feature code mới, không phải lỗi

### Verification sau khi fix:
Chạy lại content hash (không bao gồm updated_at) trên cả 2 server, expected match:
```
fd96d95177d60c9cec4ddda483edac11
```

---

## APPENDIX: Hash Reference

| Table | Hash Type | Test | Prod | Match |
|-------|-----------|------|------|-------|
| users | ID set | MATCH | MATCH | YES |
| community_profiles | ID set | MATCH | MATCH | YES |
| community_profiles | All fields excl. birth_date | `fd96d951...` | `fd96d951...` | YES |
| community_profiles | All fields incl. birth_date | `ce99b96b...` | `223309ec...` | NO |
| point_conversions | Data fields | `9618c87a...` | `9618c87a...` | YES |
| point_conversions | Balance fields | `f8112424...` | `f8112424...` | YES |
