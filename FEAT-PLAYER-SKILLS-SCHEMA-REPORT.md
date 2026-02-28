# Feat Report — Player Skills Schema + Data
**Ngày:** 2026-02-28
**Commit:** `62072fd` on branch `avalan` (push pending — no SSH key on VPS)

## Files tạo mới
| File | Purpose | Lines |
|------|---------|-------|
| `schema/player-skills.ts` | Drizzle schema cho player_skills table | 26 |
| `data/skill-definitions.ts` | 3 skills × 5 levels definitions + helpers | 232 |
| `schema/index.ts` | +1 line barrel export | +1 |

## Table: player_skills
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | auto-increment |
| user_id | UUID FK → users | NOT NULL, ON DELETE CASCADE |
| skill_id | VARCHAR(20) | 'sam_dong' / 'ot_hiem' / 'rom_boc' |
| level | INTEGER | 1-5, default 1 |
| star_tier | INTEGER | 0-3, default 0 |
| unlocked_at | TIMESTAMPTZ | default now() |
| upgraded_at | TIMESTAMPTZ | default now() |
| created_at | TIMESTAMPTZ | default now() |
| updated_at | TIMESTAMPTZ | default now() |
| UNIQUE | (user_id, skill_id) | player_skills_user_skill_uniq |

## Skill Definitions Summary
| Skill | ID | Unlock | Total OGN (Lv1→5) | Total Fragments (Lv1→5) |
|-------|----|--------|-------------------|------------------------|
| ⚡ Sấm Đồng | sam_dong | Free (Lv1) | 49,000 | 46 |
| 🌶️ Ớt Hiểm | ot_hiem | Clear Boss #4 | 57,500 | 52 |
| 🪹 Rơm Bọc | rom_boc | Clear Boss #8 | 69,800 | 61 |

### ⚡ Sấm Đồng (ULT burst)
| Lv | OGN | Mảnh | Mana | Effects |
|----|-----|------|------|---------|
| 1 | 0 | 0 | 80 | ATK×3 + Mana×0.5 |
| 2 | 2,000 | 3 | 75 | ATK×3.5 + Mana×0.6 |
| 3 | 5,000 | 8 | 70 | ATK×4 + Mana×0.7 |
| 4 | 12,000 | 15 | 65 | ATK×4.5 + Mana×0.8 + stun 1.5s |
| 5 | 30,000 | 20 | 60 | ATK×5 + Mana×1.0 + stun 2s + pierce shield |

### 🌶️ Ớt Hiểm (ATK buff)
| Lv | OGN | Mảnh | Mana | CD | Effects |
|----|-----|------|------|----|---------|
| 1 | 500 | 2 | 35 | 18s | Dame ×1.5, 6s |
| 2 | 2,000 | 5 | 35 | 17s | Dame ×1.7, 7s |
| 3 | 5,000 | 10 | 30 | 15s | Dame ×2.0, 8s + cleanse 1 |
| 4 | 15,000 | 15 | 30 | 14s | Dame ×2.0, 8s + crit +15% |
| 5 | 35,000 | 20 | 25 | 12s | Dame ×2.5, 10s + crit +20% + bypass 30% DEF |

### 🪹 Rơm Bọc (Shield)
| Lv | OGN | Mảnh | Mana | CD | Effects |
|----|-----|------|------|----|---------|
| 1 | 800 | 2 | 30 | 22s | Shield 20% HP, 4s, giảm 40% |
| 2 | 3,000 | 6 | 30 | 20s | Shield 25% HP, 5s, giảm 45% |
| 3 | 6,000 | 10 | 28 | 18s | Shield 30%, 5s, giảm 50% + HOT 3%/s |
| 4 | 15,000 | 18 | 25 | 16s | Shield 30%, 6s, giảm 50% + phản 15% |
| 5 | 45,000 | 25 | 22 | 14s | Shield 35%, 7s, giảm 60% + phản 25% + immune 3s |

## Seed
- [x] Table player_skills created via SQL
- [x] 12/12 existing players nhận sam_dong Lv1
- [ ] ot_hiem + rom_boc unlock khi clear boss (Prompt 4 sẽ xử lý)

## Helpers exported
- `getSkillDef(skillId)` — get full definition
- `getSkillLevel(skillId, level)` — get specific level data
- `getNextSkillLevel(skillId, currentLevel)` — upgrade preview
- `MAX_SKILL_LEVEL = 5`

## Verify
- [x] tsc --noEmit = 0 errors MỚI (110 pre-existing)
- [x] pm2 restart OK
- [x] DB table created + seeded
- [x] UNIQUE constraint verified
- [x] Committed locally (62072fd)
- [ ] Git pushed (pending — no SSH key)

## Next: Prompt 4 — Skill service + routes
- GET /skills (list player skills)
- POST /skills/upgrade (upgrade skill level)
- Auto-unlock ot_hiem/rom_boc khi clear boss #4/#8
