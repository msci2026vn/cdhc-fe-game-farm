# Performance + Smoothness Audit — 8x8 Board
**Date:** 2026-03-01

---

## COMBAT FLOW VERIFY

| Step | Status | Notes |
|------|--------|-------|
| startBattle -> 200 | OK | bossId = Number() in both FE api-campaign.ts:68 and BE battle.routes.ts:46 |
| Match-3 gameplay | OK | 8x8 board, 64 gems, grid-cols-8 |
| Special gems trigger | OK | Striped/Bomb/Rainbow via collectTriggeredCells BFS |
| Boss attack intervals | OK | Zone-scaled 5s->3s, all 7 setIntervals properly cleared |
| Win -> completeBoss -> 200 | OK | Anti-cheat session check, one-time use Redis key |
| Rewards (OGN, XP, stars) | OK | BattleResult shows OGN/XP/stars/zoneProgress/campaignRewards |
| Level up display | OK | showLevelUp overlay, "LEVEL UP! Lv.{newLevel}" |
| Navigate back to zone | OK | onClose callback |

### Combat Flow Issues Found

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 1 | Medium | battle.routes.ts:137 vs boss.service.ts | Campaign session TTL = 600s (10min) but battle session TTL = 1800s (30min). Fights >10min fail with NO_ACTIVE_SESSION |
| 2 | Low | useBossComplete.ts:50-69 | `NO_ACTIVE_SESSION` error code not in FE ERROR_MAP — falls to generic toast |
| 3 | Low | BattleResult.tsx:194 | OGN/XP cards only show when `serverData.won === true` — if server/client disagree on win, rewards invisible |
| 4 | Info | game-api.types.ts.backup | Stale backup type file with incomplete BossCompleteResult — harmless but confusing |
| 5 | Info | Disconnect handling | No active cleanup on disconnect — stale sessions auto-expire 30min, cleaned on next battle start |

---

## DOM PERFORMANCE (64 gems)

| Metric | Value | Rating | Notes |
|--------|-------|--------|-------|
| DOM nodes per gem | 1 (2 if locked) | Excellent | div + text node only, all VFX via CSS classes |
| Total board DOM nodes | ~64-70 | Excellent | Near-optimal for match-3 |
| setState calls per cascade | 6-15 calls, 2-4 renders | OK | React 18 batching helps; worst case 15 calls = 4 renders |
| setTimeout per cascade step | 6 per step | Caution | 350ms main + 400ms spawn + 350-500ms shake + 150-300ms recurse |
| setTimeout storm peak | ~70 concurrent | WARNING | 5-step cascade x 8 popups x 1 timeout each + engine timeouts |
| React.memo on gems? | NO | WARNING | All 64 gems re-render on ANY state change (HP update, combo, etc.) |
| useMemo/useCallback | Yes (17 total) | Good | 7 useMemo + 10 useCallback in useMatch3Campaign |
| Key stability (gem.id) | Stable, unique int | Excellent | Module-level nextId++, survives gravity |
| will-change hint on gems | NONE | WARNING | Only backface-visibility on .gem-shine |
| setInterval cleanup | All 7 cleared | Excellent | No leaks |
| mountedRef guard | All 6 setTimeout guarded | Excellent | No state updates after unmount |

### Performance Details

**setState per cascade step (worst case):**
- Sync: setCombo, setShowCombo, setScreenShake = 3 calls -> 1 render
- 350ms timeout: setBoss, setCombatStatsTracker x5, setEgg, setTotalDmgDealt, setGrid, setMatchedCells, setSpawningGems = 12 calls -> 1 render (React 18 batch)
- 400ms nested: setSpawningGems(clear) -> 1 render
- 350-500ms nested: setScreenShake(false) -> 1 render
- **Total: ~15 setState, 4 render passes per step**

**Popup timeout accumulation:**
- Each cascade step can trigger up to 8 addPopup calls
- Each popup schedules its own 1400ms filter timeout
- 5-step cascade = 40 popup-expire timeouts + 30 engine timeouts = ~70 concurrent closures

**Algorithm complexity (board.utils.ts):**
| Function | Complexity | Notes |
|----------|-----------|-------|
| findRuns | O(128) = O(1) | Optimal linear scan |
| findMatchGroups | O(1024) = O(1) | But triple-spread alloc at line 122 |
| collectTriggeredCells | O(64) BFS | BUT queue.shift() is O(N) per call |
| applyGravity | O(64) | Per-column scan, [...grid] spread each time |

**queue.shift() bug** in collectTriggeredCells (board.utils.ts:222):
```ts
const idx = queue.shift()!;  // O(N) per dequeue - should use head pointer
```

**Double findMatches scan**: input.handlers.ts:46 calls findMatches, then engine.ts:74 calls it again redundantly.

---

## ANIMATION SMOOTHNESS

| Animation | Duration | Easing | Has Animation? | Smoothness | Notes |
|-----------|----------|--------|----------------|------------|-------|
| Gem swap | 0.25s | ease-out | YES (pulse only) | 4/10 | No spatial cross-path movement; gems teleport, only scale bounce |
| Match flash | 0.4s | ease-out | YES | 8/10 | White radial glow, opacity 0->0.8->0 |
| Match remove | 0.35s | cubic-bezier(0.4,0,0.2,1) | YES (3-layer) | 8/10 | gem-pop + match-ring + match-flash — strong |
| Gravity fall | 0.3s | spring cubic-bezier | DEAD CODE | 1/10 | .gem-landed class exists but NEVER applied in JSX |
| Gravity bounce | 0.3s | cubic-bezier(0.34,1.56,0.64,1) | DEAD CODE | 1/10 | Same — built but unused |
| Special spawn | 0.4s | spring cubic-bezier | YES | 8/10 | scale 0->1.3->0.9->1.0, satisfying pop |
| Striped explosion | - | - | NO VFX | 3/10 | Idle stripe pattern only, no line sweep on trigger |
| Bomb explosion | 1.2s idle | ease-in-out | IDLE ONLY | 4/10 | Pulsing gold glow + screen shake, no area burst VFX |
| Rainbow explosion | 2s idle | linear | IDLE ONLY | 4/10 | Hue-rotate glow + shake, no wave sweep |
| Screen shake | 0.5s | ease-out | YES | 7/10 | X-axis only (6px), no Y or rotation |
| Combo tier up | 0.4-0.8s | Spring/blur/scale | YES (7 tiers) | 9/10 | Nice->Great->Excellent->Amazing->Epic->Legendary->Mythic |
| Touch feedback | - | - | YES | 8/10 | active:scale-[0.88], 12px swipe threshold, pointer events API |

### Animation Issues Detail

**1. Gravity Fall (CRITICAL GAP):**
- `.gem-landed` CSS class exists in index.css with perfect spring bounce animation
- `gem-land` keyframe: translateY(-8px) scale(0.9) -> translateY(2px) scale(1.05) -> translateY(0) scale(1)
- Duration: 0.3s, easing: cubic-bezier(0.34, 1.56, 0.64, 1)
- **BUT: Class is NEVER applied to any gem element in BossFightCampaign.tsx**
- Result: After match removal, gems snap into position with zero visual fall

**2. Gem Swap (MAJOR GAP):**
- `animate-gem-swap` only does scale 0.85->1.08->1.0 on the selected gem
- No CSS translate movement from origin cell to destination cell
- Grid re-renders with swapped state instantly; the 200ms before processMatches is unused
- Real match-3 games show gems physically sliding past each other

**3. Special Trigger VFX (MODERATE GAP):**
- Striped: No beam/line-sweep animation on trigger, just standard gem-pop
- Bomb: No expanding ring/radial burst, just screen shake + standard gem-pop
- Rainbow: No wave sweep or sequential pop, all cells pop simultaneously

---

## 8x8 SPECIFIC ISSUES

| Issue | Impact | Fix |
|-------|--------|-----|
| Gem size (375px phone) | ~41px per gem — acceptable | Width: (375-24px pad-8px grid pad-14px gaps)/8 = 41px |
| Gem size (iPhone SE 375x667) | Grid OVERFLOWS vertically | 350px needed, only ~293px available (top 30% + skill rows eat space) |
| Touch target (>=36px?) | 41px on 375px+ = OK | Below 375px (320px): ~33px = borderline |
| Emoji readability | text-[16px] in 41px cell = OK | text-[8px] lock icon is invisible |
| HUD + board fit screen | OVERFLOW on small screens | Top arena 30% + bottom HUD ~148px leaves insufficient grid space |
| Gap between gems | 2px (gap-0.5) | Fine |
| Board max-width | 430px cap | Good for tablets |

### Mobile Layout Math (iPhone SE 375x667)
```
dvh after browser chrome: ~630px
Top arena (30%):          189px
Bottom section (70%):     441px
  - PlayerHPBar:           28px
  - ManaBar:               20px
  - Skill warning:         32px (conditional)
  - Skill buttons:         44px
  - BuffIndicator:         24px
  - Remaining for grid:   293px

Grid height needed:
  8 gems x 41px + 7 gaps x 2px + 8px padding = 350px
  OVERFLOW: 350px > 293px = gems compressed, aspect-square breaks
```

### Mobile Layout (iPhone 14 Pro 390x844)
```
dvh: ~800px
Bottom section (70%): 560px
After HUD: ~412px for grid
Grid needs: ~350px -> FITS with 62px spare
```

---

## KNOWN CONSOLE ISSUES

| Log | Source | Impact | Action |
|-----|--------|--------|--------|
| onboarding.js error | Browser extension | None | Ignore |
| EMPTY_TEXT | Browser extension | None | Ignore |
| completeBoss bossId string | FE intentional | None | BE Zod expects z.string(), parseInt internally — consistent |
| console.log count | App code | 172 lines | Cleanup before production |
| FARM-DEBUG count | App code | 196 lines | Cleanup before production |
| Total debug logs | App code | ~215 unique lines | Strip with build-time transform |

**completeBoss bossId detail:**
- `startCampaignBattle` (api-campaign.ts:68) converts to `Number(bossId)` -> sends number
- `completeBoss` (api-boss.ts:31) sends raw string -> BE Zod validates as `z.string()`
- **Inconsistent but intentionally different APIs** — start expects number, complete expects string
- BE handles both correctly via `parseInt` internally

---

## GPU ACCELERATION STATUS

| Element | GPU Hint | Status |
|---------|----------|--------|
| .gem-shine (all gems) | backface-visibility: hidden | Partial |
| .gem-match-burst | backface-visibility: hidden | Partial |
| .gem-landed | backface-visibility: hidden | Dead code |
| .hp-bar-fill | will-change: width | Good |
| .hp-ghost-bar | will-change: width, opacity | Good |
| Gem cells (div) | NONE | Missing |
| Grid container | NONE | Missing |
| Screen shake root | NONE | Missing |

---

## PROPOSALS (by priority)

### P0 — Fix Now (hackathon blocker)

| # | Issue | Fix | Est. |
|---|-------|-----|------|
| 1 | Gravity fall DEAD CODE | Add `landedGems` Set to state, populate after applyGravity, apply `.gem-landed` class, clear after 300ms | 30min |
| 2 | iPhone SE grid overflow | Change top arena from `flex-[0_0_30%]` to `flex-[0_0_25%]` on small screens, or use `min-h-0` on grid flex child | 20min |
| 3 | React.memo on gem cells | Extract gem div into `React.memo` component with props {gem, isSelected, isMatched, isLocked, isSpawning, meta} — 63 cells skip diffing | 30min |

### P1 — Should Fix (user experience)

| # | Issue | Fix | Est. |
|---|-------|-----|------|
| 4 | Gem swap no spatial movement | Add CSS translate animation for swap pair during 200ms window before processMatches | 1hr |
| 5 | Popup/notif timeout storm (~70 concurrent) | Replace per-popup timeouts with a single 500ms interval that sweeps expired entries | 30min |
| 6 | Striped/Bomb/Rainbow trigger VFX | Add distinct CSS classes: beam sweep for striped, expanding ring for bomb, sequential wave for rainbow | 2hr |
| 7 | will-change on gem cells | Add `will-change: transform` to gem cell divs for GPU layer promotion | 10min |
| 8 | NO_ACTIVE_SESSION error UX | Add to FE ERROR_MAP with user-friendly message "Battle session expired, please start again" | 10min |

### P2 — Nice to Have (polish)

| # | Issue | Fix | Est. |
|---|-------|-----|------|
| 9 | Screen shake Y-axis | Add translateY(+-2px) + slight rotation to @keyframes screen-shake | 10min |
| 10 | queue.shift() O(N) in BFS | Replace with head-pointer pattern `queue[head++]` — O(1) per dequeue | 10min |
| 11 | Double findMatches scan | Remove redundant findMatches in engine.ts:74, pass results from input handler | 15min |
| 12 | Triple-spread in findMatchGroups | Replace `[...new Set([...hr, ...vr])]` with manual dedup loop | 15min |
| 13 | setCombatStatsTracker x5 | Consolidate 5 calls (lines 174,189,252,253,267) into single update with all deltas | 20min |
| 14 | text-[8px] lock icon invisible | Increase to text-[12px] or use a visual lock overlay | 5min |
| 15 | console.log cleanup (215 lines) | Strip with vite build-time plugin or conditional import | 30min |

### P3 — Post-hackathon (PixiJS migration)

| # | Issue | Fix | Est. |
|---|-------|-----|------|
| 16 | All gem animations via CSS | Migrate to PixiJS/Canvas for 60fps guaranteed on low-end Android | 2-3 weeks |
| 17 | setTimeout cascade chain | Replace with requestAnimationFrame-based animation loop in PixiJS | 1 week |
| 18 | 64 DOM nodes per board | Single Canvas element replaces 64+ DOM nodes | Part of PixiJS migration |
| 19 | GC pressure from grid copies | In-place mutation with PixiJS sprite pool | Part of PixiJS migration |

---

## SCORES

### OVERALL PERFORMANCE: 7/10
- DOM node count is excellent (1 per gem)
- Key stability excellent
- setInterval cleanup excellent
- mountedRef guards excellent
- React.memo missing is the biggest gap
- setTimeout accumulation is concerning but bounded
- Algorithm complexity is fine for 8x8

### OVERALL SMOOTHNESS: 5/10
- Match removal (3-layer) is strong
- Special gem spawn is strong
- Combo tiers are excellent (7 levels, spring curves)
- Touch responsiveness is good
- **Gravity fall is completely broken (dead code) — biggest visual gap**
- Gem swap lacks spatial movement
- Special trigger VFX are weak (no distinct explosions)
- Screen shake is functional but X-only

### HACKATHON READY: YES (with P0 fixes)
- Core combat flow works end-to-end
- Rewards display correctly
- Session management is solid
- **Must fix:** gravity fall dead code (30min), iPhone SE overflow (20min), React.memo (30min)
- Without P0 fixes: playable but visually flat (gems snap, small screen overflow)
- With P0 fixes: polished enough for demo
