# Feat Report — Recipe Crafting + Farm Integration (Prompt 7/12)
**Ngay:** 2026-02-28
**Commit:** `150d06d` on branch `avalan`

## Tables tao moi
| Table | Rows | Purpose |
|-------|------|---------|
| recipe_definitions | 30 | 10 loai x 3 tier (common/rare/legendary) |
| player_recipes | 0 (dynamic) | Player recipe inventory |
| active_farm_buffs | 0 (dynamic) | Active recipe buffs on farm |

## Files tao/sua
| File | Action | Purpose |
|------|--------|---------|
| schema/recipes.ts | NEW | 3 table schemas (reuse fragmentTierEnum) |
| schema/index.ts | EDIT | Export recipes schema |
| services/recipe.service.ts | NEW | 7 functions: getRecipeDefs, getPlayerRecipes, craft, sell, use, getBuffs, cleanExpired, getYieldMultiplier |
| services/farm.service.ts | EDIT | Apply yield buff multiplier at harvest |
| routes/recipe.ts | NEW | 6 endpoints with zod validation |
| routes/index.ts | EDIT | Mount /recipes routes |

## API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/game/recipes | All recipe catalog (30 definitions) |
| GET | /api/game/recipes/inventory | Player's crafted recipes |
| POST | /api/game/recipes/craft | Craft recipe from fragments |
| POST | /api/game/recipes/sell | Sell recipe -> OGN |
| POST | /api/game/recipes/use | Use recipe -> farm buff |
| GET | /api/game/recipes/buffs | Active farm buffs |

## Recipe Effects Summary
| Tier | Yield | Time | Duration | Weather | NFT | Sell |
|------|-------|------|----------|---------|-----|------|
| Common | +15% | -- | 24h | No | No | 5,000 OGN |
| Rare | +30% | -20% | 48h | No | No | 25,000 OGN |
| Legendary | +50% | -30% | 72h | Yes | Yes | 100,000 OGN |

## Crafting Rules
| Tier | Total Fragments | Same Zone Min | Cross Zone |
|------|----------------|---------------|------------|
| Common | 10 | 10 (100%) | No |
| Rare | 10 | 5 (50%) | Yes, 5 from other zone |
| Legendary | 10 | 5 (50%) | Yes, 5 from other zone |

### Craft Request Example (Cross-zone Rare)
```json
POST /api/game/recipes/craft
{
  "recipeKey": "tru_sau_rare",
  "fragments": [
    { "fragmentKey": "tru_sau_rare", "quantity": 5 },
    { "fragmentKey": "ot_toi_rare", "quantity": 5 }
  ]
}
```

### Validation Rules
- Total fragment quantity must equal fragment_cost (10)
- All fragments must be same tier as recipe
- Same-zone fragments >= same_zone_min
- Cross-zone only allowed for rare/legendary
- Player must own sufficient quantity of each fragment

## Farm Integration
- [x] recipeService.getYieldMultiplier(userId) returns combined yield bonus
- [x] farm.service.ts harvestPlot applies yieldMultiplier to OGN and XP rewards
- [x] buffedOGN = floor(plantType.rewardOGN * yieldMultiplier)
- [x] game_actions log includes baseOgn + yieldMultiplier for audit
- [x] Expired buffs auto-cleaned on getActiveFarmBuffs call
- [ ] Time reduction (growth speed buff) — FE-only for now, BE tracks the value

## 10 Recipe Types (x3 tiers = 30 total)
| Zone | Key | Name |
|------|-----|------|
| 1 | phan_vi_sinh | Phan Vi Sinh |
| 2 | tru_sau | Tru Sau |
| 3 | ot_toi | Ot Toi |
| 4 | dau_neem | Dau Neem |
| 5 | tricho | Trichoderma |
| 6 | lan_sinh | Lan Sinh Hoc |
| 7 | thao_duoc | Thao Duoc |
| 8 | mycorrhiza | Mycorrhiza |
| 9 | em | EM |
| 10 | van_nang | Van Nang |

## DB Indexes
- idx_player_recipes_user ON player_recipes(user_id)
- idx_active_farm_buffs_user ON active_farm_buffs(user_id, is_active)
- idx_active_farm_buffs_expires ON active_farm_buffs(expires_at) WHERE is_active = true

## Error Codes
| Code | HTTP | Description |
|------|------|-------------|
| RECIPE_NOT_FOUND | 404 | Recipe key invalid |
| INVALID_FRAGMENT_COUNT | 400 | Wrong total fragments |
| FRAGMENT_NOT_FOUND | 404 | Fragment key invalid |
| FRAGMENT_TIER_MISMATCH | 400 | Fragment tier != recipe tier |
| CROSS_ZONE_NOT_ALLOWED | 400 | Common recipe, cross-zone fragment |
| INSUFFICIENT_FRAGMENT | 400 | Not enough of specific fragment |
| SAME_ZONE_MIN | 400 | Not enough same-zone fragments |
| INSUFFICIENT_RECIPES | 400 | Not enough recipes to sell/use |

## Next: Prompt 8 — Daily/Weekly Missions
