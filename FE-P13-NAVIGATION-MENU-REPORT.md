# Report — Navigation + Menu System (FE Prompt 13)
**Date:** 2026-02-28

## Scan Summary

### All Routes (App.tsx)
| Route | Screen | Status |
|-------|--------|--------|
| `/` | MainMenuScreen | **NEW** (was redirect to /farm) |
| `/farm` | FarmingScreen | Existing |
| `/boss` | BossScreen | Existing |
| `/quiz` | QuizScreen | Existing |
| `/shop` | ShopScreen | Existing |
| `/inventory` | InventoryScreen | Existing |
| `/friends` | FriendsScreen | Existing |
| `/profile` | ProfileScreen | Existing |
| `/ogn-history` | OgnHistoryScreen | Existing |
| `/campaign` | CampaignMapScreen | Existing |
| `/campaign/battle/:bossId` | CampaignBattleScreen | Existing |
| `/campaign/skills` | SkillUpgradeScreen | Existing |
| `/campaign/fragments` | FragmentInventoryScreen | Existing |
| `/campaign/recipes` | RecipeCraftScreen | Existing |
| `/campaign/missions` | MissionScreen | Existing |
| `/campaign/achievements` | AchievementsHubScreen | Existing |
| `/campaign/:zoneNumber` | CampaignZoneScreen | Existing |
| `/prayer` | PrayerScreen | Existing |
| `/market` | MarketScreen | Existing |
| `/vip/purchase` | VipPurchaseScreen | Existing |
| `/rwa/my-garden` | MyGardenScreen | Existing |
| `/settings` | SettingsScreen | Existing |
| `/farmverse/topup` | TopupPage | Existing |
| `/farmverse/topup/success` | TopupSuccessPage | Existing |
| `/farmverse/topup/cancel` | TopupCancelPage | Existing |

### Navigation Flow
```
MainMenu (/)
├── Nông Trại (/farm) → BottomNav [Menu|Farm|Shop|Kho|Bạn]
├── Chiến Dịch (/campaign) → CampaignBottomNav [Menu|Bản Đồ|Kỹ Năng|Farm]
│   ├── Zone (/campaign/:zoneNumber) → ZoneBottomNav [Bản Đồ|Kỹ Năng|C.Thức|N.Vụ|T.Tựu]
│   │   └── Battle (/campaign/battle/:bossId) → fullscreen combat
│   ├── Skills (/campaign/skills)
│   ├── Recipes (/campaign/recipes)
│   ├── Missions (/campaign/missions)
│   ├── Achievements (/campaign/achievements)
│   └── Fragments (/campaign/fragments)
├── Boss Tuần (/boss) → fullscreen combat
├── Cầu Nguyện (/prayer)
├── Đố Vui (/quiz)
├── Chợ (/market)
├── Hồ Sơ (/profile) → back to /
├── Kho Đồ (/inventory)
├── Bạn Bè (/friends)
├── Cài Đặt (/settings) → back to /
├── Vườn IoT (/rwa/my-garden)
└── VIP (/vip/purchase)
```

## Files Created
| File | Purpose |
|------|---------|
| `src/modules/home/screens/MainMenuScreen.tsx` | Main menu: 3x2 grid + secondary row + quick links + PlayerCard |
| `src/shared/components/AppHeader.tsx` | Reusable header: ← back + title + OGN display |
| `src/shared/components/PlayerCard.tsx` | Reusable: avatar, name, level badge, XP bar, OGN |

## Files Modified
| File | Changes |
|------|---------|
| `src/App.tsx` | `/` → MainMenuScreen (was redirect to /farm), added lazy import |
| `src/shared/components/BottomNav.tsx` | Added Home (/) tab, now 5 tabs: Menu, Farm, Shop, Kho, Bạn |
| `src/modules/campaign/screens/CampaignMapScreen.tsx` | Updated bottom nav: [Menu, Bản Đồ, Kỹ Năng, Farm], backTo=/ |
| `src/modules/campaign/screens/CampaignZoneScreen.tsx` | Improved Vietnamese labels: Bản Đồ, Kỹ Năng, C.Thức, N.Vụ, T.Tựu |
| `src/modules/profile/screens/ProfileScreen.tsx` | Back → navigate('/') with playSound |
| `src/modules/settings/screens/SettingsScreen.tsx` | Back → navigate('/') |

## MainMenuScreen Layout
```
┌────────────────────────────────────┐
│                     [🔊]           │
│     ORGANIC KINGDOM                │
│        Farmverse                   │
│                                    │
│  ┌── PlayerCard ──────────────┐    │
│  │ 🧑‍🌾 Name  Lv.12  🌱        │    │
│  │ Nông dân Tập sự            │    │
│  │ ████░░░░░ 30/50 XP   🪙OGN│    │
│  └────────────────────────────┘    │
│                                    │
│  [🌾 Nông Trại] [⚔️ Chiến Dịch] [👹 Boss Tuần]  │
│  [🙏 Cầu Nguyện] [❓ Đố Vui] [🏪 Chợ]          │
│                                    │
│  [👤 Hồ Sơ] [📦 Kho] [👫 Bạn Bè] [⚙️ Cài Đặt]  │
│                                    │
│  [🌿 Vườn IoT] [⭐ VIP]           │
│                                    │
│        v1.2.0 | Hackathon 2026     │
└────────────────────────────────────┘
```

## Verify
- [x] `/` → MainMenu renders
- [x] MainMenu → Campaign works (navigate('/campaign'))
- [x] MainMenu → all screens work (Farm, Boss, Prayer, Quiz, Market, Profile, etc.)
- [x] ← back navigation: Profile → /, Settings → /
- [x] Campaign back → / (was /farm)
- [x] OGN displayed in AppHeader
- [x] PlayerCard shows level, XP bar, OGN
- [x] BottomNav has 5 tabs including Home
- [x] Campaign bottom nav has improved Vietnamese labels
- [x] Boss weekly badge when canFight = true
- [x] tsc: 0 errors
- [x] build: pass (1m 45s)
- [x] No dead routes (catch-all → /)

## Components Reusable
- **PlayerCard**: use in MainMenu + Profile + anywhere needing player summary
- **AppHeader**: use in any sub-screen needing back + title + OGN header

## Next: FE Prompt 14-15 (Final Polish)
