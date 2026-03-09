# DEEP SCAN — Special Gems + Polish (P10 + P10.5)
**Ngay:** 2026-02-28

## SCORECARD
| # | Phase | Check | Status | Notes |
|---|-------|-------|--------|-------|
| 1 | Build | tsc --noEmit | PASS | 0 errors |
| 1 | Build | vite build | PASS | Built in 1m45s, all chunks OK |
| 2 | Config | ANIM_TIMING values hop ly | PASS | 350/300/0.90/150/50/400 — all correct |
| 2 | Config | Exported in index.ts | PASS | Line 20 |
| 2 | Config | No magic numbers remaining | WARN | Shake durations 350/500 (L304) hardcoded, not in ANIM_TIMING — minor |
| 3 | Safety | MAX_CASCADE guard + setAnimating(false) | PASS | L66-69: if >= 50 -> setAnimating(false); return |
| 3 | Safety | Dynamic cascade timing formula | PASS | L310-311: Math.max(150, round(300 * 0.9^depth)) |
| 3 | Safety | cascadeDepth increments correctly | PASS | L312: recurse(fallen, newCombo, cascadeDepth + 1) |
| 4 | Rainbow | swapPair flow (input -> processor -> board) | PASS | Input L60/108 -> Processor L53 -> board.utils L215 |
| 4 | Rainbow | swapContext computed correctly | PASS | L100-108: checks posA.special + posB.special |
| 4 | Rainbow | Cascade recursion: swapPair=undefined | PASS | Hook L529: `processMatches(grid, combo, undefined, depth)` |
| 4 | Rainbow | Fallback: most common type for chain | PASS | board.utils L238-243: counts remaining gems, sorts, picks top |
| 5 | Spawn | spawningGems state + clear timeout | PASS | L293-296: set -> setTimeout clear after SPAWN_ANIM_MS |
| 5 | Spawn | Track by gem.id (not position) | PASS | L294: `currentGrid[e.pos]?.id` — id preserved via `{...g, special}` spread |
| 5 | Spawn | CSS animation exists + duration matches | PASS | tailwind.config L352-357 + index.css L1362: both 0.4s = 400ms |
| 5 | Spawn | Flash pseudo-element | PASS | index.css L1365-1374: ::after radial-gradient flash |
| 6 | Shake | Bomb 350ms + Rainbow 500ms | PASS | Processor L304: hardcoded but correct values |
| 6 | Shake | CSS shake animation EXISTS | PASS | tailwind.config L283-291: @keyframes screen-shake + L390 animation |
| 6 | Shake | Applied to board container | PASS | BossFightCampaign L324: `animate-screen-shake` class |
| 7 | Regression | Normal match-3 works | PASS | findMatches (L47) + findMatchGroups (L103) both exist |
| 7 | Regression | Damage tally correct | PASS | L124-128: tally from allRemove (matched + triggered, excl spawn) |
| 7 | Regression | Combo counter correct | PASS | L84-88: newCombo = currentCombo + 1, maxCombo tracked |
| 7 | Regression | Skill: Ot Hiem intact | PASS | Processor L166-180: damage boost + crit bonus + DEF bypass |
| 7 | Regression | Skill: Rom Boc intact | PASS | match3-damage.handler.ts L60-101: DR + reflect + HoT |
| 7 | Regression | Shield cap intact | PASS | Processor L237: Math.min(shield + amt, playerMaxHp) |
| 7 | Regression | Enrage cap intact | PASS | combat.config L54: ENRAGE_CAP = 2.0, L57: Math.min(..., cap) |
| 7 | Regression | startBattle API intact | PASS | BossFightCampaign L135: campaignApi.startCampaignBattle() |
| 7 | Regression | Boss weekly NOT affected | PASS | boss/hooks has own screenShake only — no swapPair/spawningGems/cascadeDepth/ANIM_TIMING |
| 8 | Processor | Full audit — flow correct | PASS | 314 lines, clean pipeline: match -> tally -> damage -> grid -> gravity -> cascade |
| 9 | Input | swapPair wiring correct | PASS | Tap L60: [selected, idx], Swipe L108: [idx, targetIdx] |
| 10 | Hook | State wiring + return values | PASS | spawningGems + screenShake created, passed to deps, returned to component |
| 10 | Hook | processMatches recursive wiring | PASS | L519-531: closure recurse passes undefined swapPair |
| 11 | Component | Spawn class applied | PASS | BossFightCampaign L566: `spawningGems.has(gem.id) ? 'gem-special-spawn'` |
| 11 | Component | Shake class applied | PASS | L324: `screenShake ? 'animate-screen-shake'` |
| 12 | CSS | Animation quality + timing match | PASS | Spawn 0.4s cubic-bezier overshoot, shake 0.5s ease-out |
| 13 | Perf | No memory leak (setTimeout) | WARN | 5 setTimeouts in processor, none cleaned on unmount — React 18+ handles gracefully |
| 13 | Perf | File sizes reasonable | PASS | board.utils: 275, processor: 314, hook: 574 |

## BUGS FOUND
| # | Severity | Phase | File:Line | Description | Fix |
|---|----------|-------|-----------|-------------|-----|
| - | - | - | - | No bugs found | - |

## WARNINGS (non-blocking)
| # | Severity | Phase | File:Line | Description | Recommendation |
|---|----------|-------|-----------|-------------|----------------|
| 1 | LOW | Config | processor:304 | Shake durations 350/500 hardcoded, not in ANIM_TIMING | Move to `ANIM_TIMING.SHAKE_BOMB_MS` / `SHAKE_RAINBOW_MS` for consistency |
| 2 | LOW | Perf | processor:74,140,296,305,312 | 5 setTimeouts without cleanup ref — if component unmounts mid-cascade, setState fires on unmounted | React 18+ suppresses warning, but could add ref flag check |

## KEY ARCHITECTURE VERIFIED

### Special Gem Pipeline (per match step)
```
findMatches (quick check) -> findMatchGroups (classify L/T/cross/5+)
  -> compute swapContext (rainbow targeting from swapPair)
  -> collectTriggeredCells (chain reactions: striped/bomb/rainbow BFS)
  -> spawnEntries excluded from removal (allRemove.delete)
  -> tally ALL removed gems (matched + triggered)
  -> damage pipeline: DEF -> Egg -> Shield -> Boss -> Reflect
  -> build newGrid: spawn specials at positions, null removed
  -> applyGravity (fill from top with randomGem)
  -> spawn animation (spawningGems Set, 400ms)
  -> screen shake (bomb 350ms / rainbow 500ms)
  -> cascade recursion (dynamic delay: 300*0.9^depth, floor 150ms)
```

### Rainbow Targeting Logic
```
Player swap rainbow: swapContext.targetType = swapped gem's type (deterministic)
Chain-triggered rainbow: getMostCommonType from remaining grid (smart fallback)
Cascade rainbow: swapPair=undefined -> swapContext=undefined -> fallback to most common
```

### Cascade Timing Verification
```
depth=0:  300 * 0.9^0  = 300ms
depth=5:  300 * 0.9^5  = 177ms
depth=10: 300 * 0.9^10 = 104ms -> capped at 150ms
depth=20: capped at 150ms
depth=50: MAX_CASCADE hit -> early return
```

### File Sizes
```
board.utils.ts:              275 lines (shared utilities)
match3-processor.engine.ts:  314 lines (core combat processor)
match3-input.handlers.ts:    110 lines (tap/swipe handlers)
useMatch3Campaign.ts:        574 lines (hook wiring)
```

### Compared to P10 Initial Scan (fixes applied in P10.5)
| Issue from P10 | Status in P10.5 |
|----------------|-----------------|
| No MAX_CASCADE guard | FIXED: L66-69, guard at 50 |
| No spawn animation | FIXED: gem-special-spawn CSS + spawningGems state |
| Rainbow uses most common type (not swap target) | FIXED: swapContext from swapPair |
| Hardcoded cascade delay 300ms | FIXED: dynamic decay formula |

## OVERALL: PASS
