# AUTO-PLAY SYSTEM ANALYSIS — FARMVERSE
> **Date:** 2026-03-01
> **Scope:** Full scan FE (local) + BE (MCP VPS) + DB
> **Status:** READ-ONLY scan — no code modified

---

## 1. TONG QUAN COMBAT SYSTEM

### Architecture
- **Game type:** Match-3 Puzzle RPG (real-time hybrid)
- **Grid:** 8x8 (64 cells), 4 gem types: ATK, HP, DEF, Star
- **Two game modes:**
  - **Boss Weekly:** Simple 8x8, basic cascades, 5/day limit, 10-min cooldown
  - **Campaign:** 40 bosses across 10 zones, special gems, skills, debuffs, phase bosses
- **Turn system:** Hybrid — player matches gems (turn-based cascade), boss attacks on real-time timer
- **Win:** Boss HP = 0. **Lose:** Player HP = 0 OR turn limit exceeded (campaign)

### Key Files
| Component | File |
|-----------|------|
| Board engine | `src/shared/match3/board.utils.ts` |
| Combat formulas | `src/shared/utils/combat-formulas.ts` |
| Combat config | `src/shared/match3/combat.config.ts` |
| Combat types | `src/shared/match3/combat.types.ts` |
| Boss match processor | `src/modules/boss/hooks/match-processor.engine.ts` |
| Campaign match processor | `src/modules/campaign/hooks/match3-processor.engine.ts` |
| Boss attack loop | `src/modules/boss/hooks/boss-attack.loop.ts` |
| Campaign boss AI | `src/modules/campaign/hooks/match3-boss-ai.ts` |
| Boss damage handler | `src/modules/boss/hooks/boss-damage.handler.ts` |
| Campaign damage handler | `src/modules/campaign/hooks/match3-damage.handler.ts` |
| Input handlers (boss) | `src/modules/boss/hooks/input-handlers.ts` |
| Input handlers (campaign) | `src/modules/campaign/hooks/match3-input.handlers.ts` |
| Combat effects (dodge/ult) | `src/modules/boss/hooks/combat-effects.ts` |
| Debuff ticker | `src/modules/campaign/hooks/match3-debuff-ticker.ts` |
| Existing auto-play (6x6) | `src/shared/hooks/useAutoPlay.ts` |
| Boss data (40 bosses) | `src/modules/campaign/data/bossDetails.ts` |
| Boss skills | `src/modules/campaign/data/bossSkills.ts` |
| Archetypes | `src/modules/campaign/data/archetypes.ts` |
| Zones | `src/modules/campaign/data/zones.ts` |
| De Vuong phases | `src/modules/campaign/data/deVuongPhases.ts` |

---

## 2. BOSS DATA MAP

### 40 Bosses Across 10 Zones

| # | Zone | Boss Name | Tier | HP | ATK | DEF | Freq | Heal% | TurnLimit | Archetype |
|---|------|-----------|------|----|-----|-----|------|-------|-----------|-----------|
| 1 | 1 | Rep Con | minion | 4,500 | 50 | 0 | 1 | 0% | 100 | glass_cannon |
| 2 | 1 | Rep Linh | minion | 7,500 | 70 | 0 | 1 | 0% | 100 | glass_cannon |
| 3 | 1 | Rep Canh | elite | 13,500 | 100 | 0 | 1 | 0% | 100 | glass_cannon |
| 4 | 1 | Rep Chua | boss | 27,000 | 110 | 0 | 1 | 0% | 100 | glass_cannon |
| 5 | 2 | Sau Non | minion | 10,500 | 80 | 0 | 2 | 0% | 100 | assassin |
| 6 | 2 | Sau To | minion | 16,500 | 90 | 0 | 2 | 0% | 100 | assassin |
| 7 | 2 | Sau Khoang | elite | 27,000 | 100 | 0 | 2 | 0% | 100 | assassin |
| 8 | 2 | Buom Dem | boss | 42,000 | 120 | 0 | 2 | 0% | 100 | assassin |
| 9 | 3 | Bo Rua Con | minion | 30,000 | 70 | 150 | 1 | 0% | 125 | tank |
| 10 | 3 | Bo Canh Cam | minion | 45,000 | 80 | 200 | 1 | 0% | 125 | tank |
| 11 | 3 | Bo Hung | elite | 67,500 | 100 | 250 | 1 | 0% | 125 | tank |
| 12 | 3 | Bo Ngua | boss | 105,000 | 100 | 350 | 1 | 0% | 125 | tank |
| 13 | 4 | Chau Chau Non | minion | 52,500 | 160 | 0 | 1 | 0% | 125 | controller |
| 14 | 4 | Chau Chau Canh | minion | 75,000 | 180 | 0 | 1 | 0% | 125 | controller |
| 15 | 4 | De Men | elite | 112,500 | 200 | 0 | 1 | 0% | 125 | controller |
| 16 | 4 | Vua Chau Chau | boss | 150,000 | 230 | 0 | 1 | 0% | 125 | controller |
| 17 | 5 | Bo Xit Xanh | minion | 75,000 | 180 | 0 | 1 | 1.5% | 125 | healer |
| 18 | 5 | Bo Xit Nau | minion | 112,500 | 200 | 0 | 1 | 2% | 125 | healer |
| 19 | 5 | Oc Sen Gai | elite | 150,000 | 220 | 100 | 1 | 2% | 125 | healer |
| 20 | 5 | Oc Sen Chua | boss | 210,000 | 250 | 100 | 1 | 2% | 125 | healer |
| 21 | 6 | Chuot Con | minion | 120,000 | 250 | 0 | 2 | 0% | 150 | assassin |
| 22 | 6 | Chuot Cong | minion | 180,000 | 280 | 0 | 2 | 0% | 150 | assassin |
| 23 | 6 | Chuot Chui | elite | 240,000 | 320 | 0 | 1 | 0% | 150 | assassin |
| 24 | 6 | Chuot Vuong | boss | 330,000 | 350 | 0 | 2 | 0% | 150 | assassin |
| 25 | 7 | Sau Rom Lua | minion | 150,000 | 400 | 0 | 1 | 0% | 150 | glass_cannon |
| 26 | 7 | Bo Cap | minion | 210,000 | 480 | 0 | 1 | 0% | 150 | glass_cannon |
| 27 | 7 | Ret Khong Lo | elite | 270,000 | 550 | 0 | 1 | 0% | 150 | glass_cannon |
| 28 | 7 | Rong Dat | boss | 375,000 | 600 | 0 | 1 | 0% | 150 | glass_cannon |
| 29 | 8 | Dia Khong Lo | minion | 225,000 | 200 | 300 | 1 | 0% | 150 | tank |
| 30 | 8 | Ech Doc | minion | 300,000 | 250 | 350 | 1 | 0% | 150 | tank |
| 31 | 8 | Ran Ho Mang | elite | 420,000 | 300 | 300 | 1 | 0% | 150 | tank |
| 32 | 8 | Rong Nuoc | boss | 570,000 | 300 | 450 | 1 | 0% | 175 | tank |
| 33 | 9 | Bo Lua | minion | 300,000 | 500 | 0 | 1 | 0% | 175 | hybrid |
| 34 | 9 | Than Lan Nham | minion | 420,000 | 350 | 400 | 1 | 1.5% | 175 | hybrid |
| 35 | 9 | Phuong Hoang Den | elite | 480,000 | 500 | 0 | 1 | 0% | 175 | hybrid |
| 36 | 9 | Rong Lua | boss | 720,000 | 650 | 150 | 1 | 1.5% | 175 | hybrid |
| 37 | 10 | Nam Doc | minion | 375,000 | 400 | 0 | 1 | 0% | 175 | mixed |
| 38 | 10 | Moi Chua | minion | 525,000 | 350 | 200 | 1 | 1.5% | 175 | mixed |
| 39 | 10 | Bo Ngua Dem | elite | 630,000 | 700 | 0 | 2 | 0% | 175 | mixed |
| 40 | 10 | De Vuong | FINAL | 1,050,000 | 250-800 | 0-500 | 1-3 | 0-3% | 200 | all |

### De Vuong 4-Phase System

| Phase | HP Range | Archetype | ATK | DEF | Freq | Heal% | Skill |
|-------|----------|-----------|-----|-----|------|-------|-------|
| 1 | 100%-75% | Tank | 250 | 500 | 1 | 0% | Giap than! (Shield) |
| 2 | 75%-50% | Assassin | 600 | 0 | 3 | 0% | Tam lien kich! (Triple) |
| 3 | 50%-25% | Healer | 350 | 200 | 1 | 3% | Hoi sinh! (Regen) |
| 4 | 25%-0% | Glass Cannon | 800 | 0 | 2 | 0% | Huy diet! (Self-destruct 2% HP/5s) |

---

## 3. GEM TYPES & EFFECTS

| Gem Type | Icon | Combat Effect | Damage/Value Formula |
|----------|------|---------------|---------------------|
| ATK (atk) | ⚔️ | Deal damage to boss | `40 + ATK_stat * 0.6` per gem |
| HP (hp) | 💚 | Heal player HP | `25 + HP_stat * 0.04` per gem |
| DEF (def) | 🛡️ | Add shield | `20 + DEF_stat * 0.02 + maxHP * 0.01` per gem |
| Star (star) | ⭐ | Charge ULT + minor damage | `25 + ATK_stat * 0.3` dmg + 8 ULT charge per gem |

### Special Gem Creation Rules

| Match Pattern | Creates | Effect |
|---------------|---------|--------|
| 4 horizontal | striped_h | Clear entire row (8 gems) |
| 4 vertical | striped_v | Clear entire column (8 gems) |
| 5 in a line | rainbow | Clear ALL gems of target type |
| L-shape | bomb | Clear 3x3 area (up to 9 gems) |
| T-shape | bomb | Clear 3x3 area (up to 9 gems) |
| 5+ combined L/T | rainbow | Overrides bomb |

### Cascade System
- **Trigger:** After match removal + gravity, check for new matches
- **Max depth:** 50 cascades (safety cap)
- **Timing:** 300ms base, x0.90 each step, floor 150ms
- **Chain reactions:** Special gems trigger BFS queue processing

---

## 4. SKILL / ABILITY MAP

### Player Skills (3 skills, 5 levels each)

| Skill | Type | Trigger/Cost | Effect (Lv1 / Lv5) | Cooldown | Auto-Play Priority |
|-------|------|-------------|---------------------|----------|-------------------|
| Sam Dong | ULT | 80 mana (60 at Lv5) | 3.0x ATK / 5.0x ATK + 2s stun + pierce | charge-based | Fire when charged + good timing |
| Ot Hiem | Active ATK Buff | Skill button | +20% dmg 6s / +60% dmg 10s + 20% crit + 50% DEF bypass + cleanse | 20s | Cast on cooldown for DPS |
| Rom Boc | Active DEF Buff | Skill button | 10% shield + 15% dmg red 4s / 30% shield + 35% dmg red + 3% HoT + 8% reflect + debuff immune 7s | 25s | Cast when HP low or heavy damage phase |
| Dodge | Reactive | 30 mana (25 if Mana>=250) | Avoid boss skill attack | Per warning | ALWAYS dodge when warning + mana |

### Passive Milestones

| Stat | Threshold | Effect |
|------|-----------|--------|
| ATK >= 300 | 10% crit chance | Crit = x2.0 damage |
| ATK >= 800 | 15% crit chance | Crit = x2.0 damage |
| ATK >= 2000 | Destroy bonus | Extra match-5 bonus |
| HP >= 1500 | 5% regen | Heal 5% maxHP every 5 turns |
| HP >= 5000 | 8% regen | Heal 8% maxHP every 5 turns |
| HP >= 15000 | Immortal | Revive once at 20% maxHP |
| DEF >= 200 | 10% reflect | Reflect 10% boss damage |
| DEF >= 600 | 20% reflect | Reflect 20% boss damage |
| DEF >= 1500 | Fort | Immune to boss attack every 10 turns |
| Mana >= 250 | Dodge cost -5 | 25 instead of 30 |
| Mana >= 800 | ULT cost -15 | 65 instead of 80 |
| Mana >= 3000 | Super Mana | Free ULT on 8-turn cooldown |

---

## 5. DAMAGE FORMULA (CHINH XAC)

### Player -> Boss
```
baseDmg = (atkCount * (40 + ATK * 0.6)) + (starCount * (25 + ATK * 0.3))
totalDmg = round(baseDmg * comboMultiplier)

if random < critChance:
  totalDmg = round(totalDmg * 2.0)

if otHiemActive:
  totalDmg = round(totalDmg * (1 + otHiemBonus[level]))
  if lv4+ and !crit and random < critBonus:
    totalDmg = round(totalDmg * 1.5)

// Campaign DEF reduction (diminishing returns):
effectiveDef = bossDef * (1 - otHiemDefBypass[level])
dmgAfterDef = max(1, round(totalDmg * (1 - effectiveDef/(effectiveDef+500))))

// Campaign damage pipeline:
1. Egg absorbs first (if active)
2. Boss Shield reduces 80% (if active)
3. Boss HP -= remaining damage
4. Reflect 30% of dmgAfterDef back to player (if active)
```

### Boss -> Player
```
baseAtk = bossATK * enrageMultiplier
normalDmg = baseAtk + floor(random * baseAtk * 0.2)  // +/- 10% variance
skillDmg = round(baseAtk * 2.0)  // skill attacks do 2x

// Campaign: freq hits with 300ms delay between each
// DEF reduction (same formula):
actualDmg = max(1, floor(rawDmg * (1 - playerDEF/(playerDEF+500))))

// Damage pipeline:
1. Fort check (immune every 10 turns if DEF >= 1500)
2. Armor break check (DEF = 0 if debuff active)
3. Rom Boc damage reduction (if active)
4. Shield absorbs first
5. Player HP -= remaining
6. Immortal revive (once, to 20% maxHP, if HP >= 15000)
7. Reflect damage back to boss (10-20%)
```

### ULT Damage
```
Boss mode: floor(ATK * 3 + MANA * 0.5)
Campaign: round(ATK * SAM_DONG_MULT[level-1])
  Lv1: 3.0x, Lv2: 3.5x, Lv3: 4.0x, Lv4: 4.5x + 1.5s stun, Lv5: 5.0x + 2.0s stun + pierce
```

---

## 6. TURN SYSTEM

| Aspect | Detail |
|--------|--------|
| Turn definition | Each cascade (match -> gravity -> check) = 1 turn |
| Boss attacks | Real-time timer: 3-5s based on zone (NOT turn-based) |
| Enrage | +10% boss ATK every 30 real seconds, cap 2.0x |
| Moves per turn | 1 swap -> triggers full cascade chain -> 1 turn |
| ULT charge per turn | starCount * 8 + atkCount * 3 + (combo >= 2 ? 5 : 0) |
| Mana regen per turn | floor(8 + MANA_stat / 25) |
| HP regen | 5-8% maxHP every 5 turns (if HP milestone) |
| Fort immunity | Every 10 turns (if DEF >= 1500) |
| Win | bossHp <= 0 |
| Lose | playerHp <= 0 OR turnCount >= turnLimit |

---

## 7. EXISTING FUNCTIONS FOR REUSE

### Pure Functions (safe to call in auto-play simulation)

| Function | File:Line | Signature | Use Case |
|----------|-----------|-----------|----------|
| `findMatches` | board.utils.ts:47 | `(grid: Gem[]) => Set<number>` | Validate if swap produces matches |
| `findMatchGroups` | board.utils.ts:103 | `(grid: Gem[], swapPos?) => MatchGroup[]` | Classify match patterns for special gems |
| `areAdjacent` | board.utils.ts:271 | `(a, b) => boolean` | Validate swap positions |
| `triggerStriped` | board.utils.ts:178 | `(pos, dir) => number[]` | Predict striped gem blast |
| `triggerBomb` | board.utils.ts:190 | `(pos) => number[]` | Predict bomb blast radius |
| `triggerRainbow` | board.utils.ts:203 | `(grid, targetType) => number[]` | Predict rainbow clear |
| `collectTriggeredCells` | board.utils.ts:212 | `(grid, initial, ctx?) => Set<number>` | Full chain reaction prediction |
| `atkGemDamage` | combat-formulas.ts:11 | `(atk) => number` | Damage per ATK gem |
| `starGemDamage` | combat-formulas.ts:16 | `(atk) => number` | Damage per star gem |
| `hpPerGem` | combat-formulas.ts:33 | `(hp) => number` | Heal per HP gem |
| `shieldPerGem` | combat-formulas.ts:38 | `(def, maxHp) => number` | Shield per DEF gem |
| `bossDEFReduction` | combat.config.ts:82 | `(rawDmg, bossDef) => number` | Boss DEF mitigation |
| `actualBossDamage` | combat-formulas.ts:50 | `(rawDmg, def) => number` | Player DEF mitigation |
| `getComboTier` | combat.config.ts:18 | `(combo) => ComboTier` | Combo damage multiplier |
| `getActiveMilestones` | combat-formulas.ts:93 | `(stats) => ActiveMilestones` | All passive bonus checks |
| `manaRegenPerTurn` | combat-formulas.ts:63 | `(mana) => number` | Mana gained per turn |
| `ultDamage` | combat-formulas.ts:58 | `(atk, mana) => number` | ULT damage calc |
| `dodgeCost` | combat-formulas.ts:68 | `(reduced) => number` | Mana cost to dodge |
| `ultCost` | combat-formulas.ts:73 | `(reduced) => number` | Mana cost for ULT |

### Semi-Pure (has side effects but useful reference)

| Function | File:Line | Note |
|----------|-----------|------|
| `applyGravity` | board.utils.ts:258 | Calls randomGem internally (counter side effect) |
| `createGrid` | board.utils.ts:33 | Creates random initial board |
| `findBestMove` | useAutoPlay.ts:54 | Existing 6x6 greedy scorer — adapt for 8x8 |

---

## 8. PHUONG AN IMPLEMENT AUTO-PLAY

### Architecture

```
src/shared/autoplay/
  auto-strategy.json        <-- Strategy weights (already created)
  auto-simulator.ts         <-- Pure cascade simulator
  auto-scorer.ts            <-- Move scoring engine
  auto-skill-manager.ts     <-- Skill/dodge/ult decision logic
  auto-controller.ts        <-- Main orchestrator (useAutoPlay hook)
  auto-mcts.ts              <-- MCTS engine for Lv4-5
  auto-learner.ts           <-- Self-learning weight adjuster
```

### Algorithm Flow

```
Every 1000-2500ms (speed based on VIP level):

1. READ game state:
   - grid (8x8 Gem[])
   - bossState (HP, ATK, DEF, phase, debuffs, buffs)
   - playerState (HP, shield, mana, ultCharge)
   - activeDebuffs, activeBossBuffs
   - lockedGems, eggState

2. SKILL DECISIONS (priority order):
   a. If skillWarning → DODGE (if mana sufficient)
   b. If ultCharge >= 100 → FIRE ULT (timing consideration for campaign)
   c. If otHiem off cooldown → CAST (DPS optimization)
   d. If playerHP < 40% and romBoc off cooldown → CAST (survival)

3. MOVE SELECTION (if no skill to use):
   a. Determine weight profile:
      - Check playerHP%, bossHP%, ultCharge, active debuffs/buffs
      - Select appropriate weight set from auto-strategy.json

   b. For each valid swap (i, j) where areAdjacent(i, j):
      - Simulate swap on grid copy
      - Run cascade simulation (findMatches + applyGravity loop)
      - Count gems by type per cascade step
      - Calculate weighted score:
        score = sum(gemCount[type] * weight[type]) * comboMultiplier
             + specialGemBonus * bonusWeights.specialGemCreation
             + cascadeDepth * bonusWeights.cascadePotential

   c. Pick move with highest score
   d. Execute swap via programmatic handleTap/handleSwipe

4. EXECUTE and wait for cascade animation to complete
```

### VIP Level Tiers

| Level | Algorithm | Speed | Features |
|-------|-----------|-------|----------|
| Lv1 (Free) | Random valid | 2500ms | Just picks random legal move |
| Lv2 | Greedy weighted | 2000ms | Scores by gem weights + match count |
| Lv3 | Greedy + cascade sim | 1500ms | Simulates 1-step cascade for better scoring |
| Lv4 | MCTS (30 sims) | 1200ms | Monte Carlo tree search with heuristic guide |
| Lv5 | MCTS (80 sims) | 1000ms | Full MCTS + pattern memory + self-learning |

### Existing Code to Leverage
1. **`useAutoPlay.ts`** — Already has findBestMove for 6x6. Adapt scoring to 8x8 + add gem weights + cascade sim
2. **`board.utils.ts`** — All grid operations (findMatches, applyGravity, areAdjacent, special gems) work for 8x8
3. **`combat-formulas.ts`** — All damage/heal/shield formulas are pure and reusable
4. **`combat.config.ts`** — Combo tiers, skill configs, boss intervals all exported

---

## 9. RISKS & EDGE CASES

### Combat Edge Cases
1. **Boss Shield (80% reduction):** Auto-play must detect and stop wasting ATK gems
2. **Boss Reflect (30%):** High ATK combos can kill the player from reflect
3. **Heal Block debuff:** HP gems become useless — auto-play must zero their weight
4. **Armor Break debuff:** DEF gems useless while active
5. **Stun debuff:** Player can't interact — auto-play must wait
6. **Locked gems:** Can't swap locked positions — must check lockedGemsRef
7. **Egg mechanic:** Should prioritize destroying egg before it heals boss
8. **Boss Phase 2 (De Vuong):** Freq=3, ATK=600. Dodge is critical or player dies in 1-2 attacks
9. **Boss #39 Execute:** Player <20% HP = 5x damage. Auto-play must never let HP drop that low

### Anti-Cheat Considerations
1. **Min fight duration:** max(2s, bossHP/50000). Auto-play can't finish too fast
2. **Damage range:** 0.8x-5x boss HP. Natural play produces this; auto-play should too
3. **Daily limits:** 50 wins/day, 5000 OGN cap. Auto-play should respect these
4. **Rate limit:** 2 req/sec. Auto-play speed tiers (1000-2500ms) are well within this
5. **Backend verification:** BE estimates expected damage. If auto-play produces suspicious patterns, battles get logged

### Performance Concerns
1. **Move search space:** 64 positions x 2 directions = 128 swaps per decision
2. **Cascade simulation:** Each swap can cascade up to 50 steps (typically 3-8)
3. **MCTS Lv5:** 80 simulations x cascade = ~6400 operations. Should complete in <100ms
4. **Animation timing:** Auto-play must wait for cascade animations (300ms base) before next move
5. **Memory:** Grid is 64 cells x ~50 bytes = ~3KB per simulation. 80 sims = ~240KB peak. Trivial

### UX Risks
1. **Too fast = boring:** Speed tiers (1-2.5s) provide visual engagement
2. **Too good = no challenge:** Lv1-2 intentionally play suboptimally
3. **Skill usage timing:** ULT during boss shield wastes damage. Need debuff awareness
4. **Self-learning drift:** Weight adjustments could converge to degenerate strategies. Need bounds

---

## 10. ESTIMATE & IMPLEMENTATION PLAN

### Phase 1: Core Auto-Play (Boss Weekly)
- `auto-simulator.ts` — Pure cascade simulator reusing board.utils
- `auto-scorer.ts` — Move scoring with gem weights from auto-strategy.json
- `auto-controller.ts` — Main hook replacing/extending useAutoPlay for 8x8
- Skill management: Auto-dodge + auto-ULT
- **Complexity:** Medium. Mostly adapt existing useAutoPlay.ts from 6x6 to 8x8

### Phase 2: Campaign Auto-Play
- Special gem awareness (findMatchGroups + collectTriggeredCells)
- Debuff/buff awareness (weight switching)
- Skill casting (Ot Hiem + Rom Boc timing)
- Phase boss awareness (De Vuong 4-phase strategy)
- **Complexity:** High. Campaign has many more mechanics

### Phase 3: MCTS Engine (Lv4-5)
- `auto-mcts.ts` — Monte Carlo tree search with rollout policy
- Heuristic guide from gem weights
- Simulation depth: 2-3 moves lookahead
- **Complexity:** High. MCTS implementation + tuning

### Phase 4: Self-Learning (Lv2-5)
- `auto-learner.ts` — Post-fight weight adjustment
- Win/loss feedback loop
- Per-boss-archetype weight profiles
- Pattern memory (Lv5)
- **Complexity:** Medium. Simple gradient descent on weights

### Summary
| Phase | Scope | Files | Dependencies |
|-------|-------|-------|-------------|
| 1 | Core (Boss Weekly) | 3 new files | board.utils, combat-formulas, useAutoPlay reference |
| 2 | Campaign | +2 files | Phase 1 + bossSkills, campaign data |
| 3 | MCTS | +1 file | Phase 2 + tree search |
| 4 | Self-Learn | +1 file | Phase 3 + storage |

---

## APPENDIX: Backend Details

### API Endpoints (relevant to auto-play)
- `GET /api/game/boss/status` — Check daily fights/cooldown
- `POST /api/game/boss/battle/start` — Start campaign session
- `POST /api/game/boss/complete` — Submit fight result
- `GET /api/game/skills` — Get player skill levels

### Reward System
- **Stars:** 3star=1.5x, 2star=1.2x, 1star=1.0x rewards
- **First clear:** 2.0x bonus
- **Repeat clear reduction:** 1st=1.0x, 2nd=1.0x, 3rd=0.8x, 4th=0.6x, 5+= 0.5x
- **Campaign daily threshold:** Free=20, Standard=30, Premium=45 full-reward battles
- **After threshold:** XP x0.5, OGN x0
- **Daily OGN cap:** 5000 across all boss types

### Weekly Bosses (8 bosses, separate from campaign)
| Boss | HP | ATK | OGN | XP | Min Lv |
|------|-----|-----|-----|-----|--------|
| Rep Xanh | 500 | 20 | 5 | 20 | 1 |
| Sau To | 800 | 25 | 10 | 35 | 3 |
| Bo Rua | 1,200 | 35 | 15 | 50 | 5 |
| Chau Chau | 2,000 | 45 | 25 | 70 | 10 |
| Bo Xit | 3,000 | 55 | 35 | 90 | 15 |
| Oc Sen | 4,000 | 65 | 50 | 110 | 20 |
| Chuot Dong | 5,000 | 80 | 70 | 140 | 30 |
| Rong Lua | 10,000 | 100 | 100 | 200 | 50 |
