# Phương án tích hợp Alpha Vantage Commodity API → FARMVERSE Backend

> **Generated:** 2026-02-13
> **Environment:** VPS Backend (`cdhc-be`)
> **Purpose:** READ-ONLY scan report for Alpha Vantage Commodity API integration
> **⛔ CONSTRAINT:** No code modifications made. This is a planning document.

---

## 1. Kiến trúc hiện tại

### 1.1 Tech Stack (chính xác)

| Component | Version | Package |
|-----------|----------|---------|
| Runtime | Bun (latest) | Built-in |
| Web Framework | Hono ^4.11.3 | `hono` |
| ORM | Drizzle ^0.45.1 | `drizzle-orm` |
| Database | PostgreSQL | `postgres` ^8.18.0 |
| Cache/Scheduler | ioredis ^5.8.2 | `ioredis` |
| Cron | Croner ^9.1.0 | `croner` |
| Validation | Zod ^4.3.4 | `zod` |
| Auth | jose ^6.1.3 | JWT + Google OAuth |

### 1.2 Folder Structure Diagram

```
src/
├── index.ts                    # Entry point (Bun.serve, route mounting, cron start)
├── db/
│   ├── connection.ts           # Drizzle postgres client (singleton)
│   ├── redis.ts               # Redis ioredis client (singleton)
│   ├── schema/
│   │   ├── index.ts           # Barrel export
│   │   ├── users.ts           # users table
│   │   ├── notifications.ts
│   │   ├── *.ts               # 20+ profile tables
│   │   └── (no market/commodity tables yet)
│   └── auth-adapter/
├── middlewares/
│   ├── index.ts
│   └── trackActivity.ts       # Redis cache user:lastActivity
├── modules/
│   ├── auth/                  # JWT, Google OAuth, middleware
│   ├── game/                  # Farm game module (REFERENCE PATTERN)
│   │   ├── cron/              # wither.cron, warm-leaderboard.cron
│   │   ├── data/              # plants.ts, bosses.ts, quiz-questions.ts, shop-items.ts
│   │   ├── routes/            # player, farm, boss, quiz, shop, social, leaderboard
│   │   ├── schema/            # player-stats, farm-plots, quiz-sessions, etc.
│   │   ├── services/          # reward, quiz, boss, leaderboard, etc.
│   │   ├── types/             # game.types.ts
│   │   └── validators/       # Zod schemas
│   ├── weather/               # EXCELLENT REFERENCE FOR MARKET MODULE
│   │   ├── index.ts           # Barrel export
│   │   ├── weather.routes.ts  # Hono routes (GET /province, /provinces, /location, /refresh)
│   │   ├── weather.service.ts  # API fetch + Redis cache
│   │   ├── weather.cron.ts    # Croner scheduler (*/30 * * * *)
│   │   ├── weather.types.ts    # TypeScript interfaces
│   │   └── provice.json       # Static data
│   ├── admin/
│   ├── admin-v2/
│   ├── news/                  # Has scheduled-publish.cron
│   ├── points/
│   └── legacy/
├── scripts/
└── services/
```

### 1.3 Module Pattern (tham chiếu từ `weather/` module)

Mỗi module theo chuẩn dự án có cấu trúc:

```
src/modules/{module}/
├── index.ts           # Barrel export (export * from ...)
├── {module}.routes.ts # Hono router instance
├── {module}.service.ts # Business logic functions
├── {module}.cron.ts    # Croner scheduler setup (nếu có cron job)
├── {module}.types.ts   # TypeScript interfaces
└── {data|config}*.json # Static data (nếu có)
```

**Pattern từ weather module:**

```typescript
// index.ts — Barrel export
export { default as weatherRoutes } from './weather.routes';
export { startWeatherCron, stopWeatherCron } from './weather.cron';
export type * from './weather.types';

// weather.routes.ts — Hono router
const weather = new Hono();
weather.get('/province/:code', async (c) => { ... });
weather.post('/refresh', async (c) => { ... });
export default weather;

// weather.service.ts — Functions (not class)
export async function fetchAllProvincesWeather(): Promise<void> { ... }
export async function getProvinceWeather(code: string): Promise<ProvinceWeatherData | null> { ... }

// weather.cron.ts — Croner setup
let weatherCronJob: Cron | null = null;
export function startWeatherCron() {
  weatherCronJob = new Cron('*/30 * * * *', async () => { ... }, { timezone: 'Asia/Ho_Chi_Minh' });
}
export function stopWeatherCron() { weatherCronJob?.stop(); }
```

### 1.4 Naming Conventions phát hiện được

| Category | Convention | Example |
|----------|-------------|---------|
| Files | kebab-case | `weather.routes.ts`, `wither.cron.ts` |
| Folders | kebab-case | `src/modules/weather/`, `src/modules/game/` |
| Tables | snake_case | `player_stats`, `farm_plots`, `quiz_sessions` |
| Columns | camelCase | `userId`, `plantTypeId`, `lastWateredAt` |
| Enums | PascalCase + Enum suffix | `userRoleEnum`, `gameActionTypeEnum` |
| Routes | kebab-case | `/api/weather/province/:code`, `/api/game/farm/plant` |
| Services | camelCase + .suffix | `rewardService.addOGN()`, `quizService.startQuiz()` |
| Constants | SCREAMING_SNAKE_CASE | `CACHE_TTL`, `XP_PER_LEVEL`, `MAX_OGN` |
| Redis keys | colon-separated | `weather:province:${code}`, `game:quiz:session:${id}` |
| Type exports | `$inferSelect`, `$inferInsert` | Drizzle generated types |

---

## 2. Điểm tích hợp (Integration Points)

### 2.1 Database

**Schema file cần tạo thêm table:**
- Path: `src/modules/market/schema/` (theo pattern game module)
- Hoặc: `src/db/schema/market-*.ts` (nếu theo pattern core schemas)

**Convention tạo table:**
```typescript
import { pgTable, index, integer, varchar, timestamp, uuid, text, decimal } from 'drizzle-orm/pg-core';
import { users } from '@/db/schema/users';

export const tableName = pgTable(
  'table_name', // snake_case
  {
    id: uuid('id').primaryKey().defaultRandom(), // hoặc serial('id').primaryKey()
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    columnName: varchar('column_name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    indexName: index('table_column_idx').on(table.columnName),
  })
);
```

**Drizzle config:**
```typescript
// File: drizzle.config.ts (đã có)
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/**/schema/*.ts', // Glob pattern — TỰ ĐỘNG TÌM
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

**Migration:**
```bash
bun run db:generate  # Tạo migration SQL từ schema changes
bun run db:push      # Push schema trực tiếp (dev only)
bun run db:studio    # Mở Drizzle Studio UI
```

**Barrel file schema:**
- Path: `src/modules/market/schema/index.ts` (nếu tạo module riêng)
- Export: `export * from './commodities'; export * from './daily-prices'; ...`

### 2.2 Module mới: `src/modules/market/`

**Cần tạo những file (theo đúng convention dự án):**

```
src/modules/market/
├── index.ts                    # Barrel export (routes, cron, types)
├── market.routes.ts            # Hono router (GET /latest, /history, /predictions, POST /predict)
├── market.service.ts           # Business logic (fetch, calculate, resolve)
├── market.cron.ts              # Croner scheduler (6:00 AM T2-T6)
├── market.types.ts             # TypeScript interfaces
├── market.validators.ts         # Zod schemas (input validation)
├── schema/
│   ├── index.ts                # Barrel export schemas
│   ├── commodities.ts          # 5 commodities static master
│   ├── daily-prices.ts         # Daily price history
│   ├── composite-index.ts      # Daily composite index
│   └── predictions.ts         # Player predictions
└── data/
    └── commodities.json        # Static commodity definitions
```

**File naming convention:**
- ✅ `market.routes.ts` (kebab-case, singular "market")
- ✅ `market.service.ts` (kebab-case, singular "market")
- ✅ `market.cron.ts` (kebab-case, singular "market")
- ✅ `market.types.ts` (kebab-case, singular "market")
- ✅ `market.validators.ts` (kebab-case, singular "market")

**Export pattern theo module mẫu (weather/game):**

```typescript
// index.ts
export { default as marketRoutes } from './market.routes';
export { startMarketCron, stopMarketCron } from './market.cron';
export { marketService } from './market.service';
export type * from './market.types';
```

### 2.3 Route mounting

**Mount ở đâu trong `src/index.ts`:**

```typescript
// Thêm import
import { marketRoutes, startMarketCron } from '@/modules/market';

// Thêm route (sau line app.route('/api/game', gameRoutes);)
app.route('/api/market', marketRoutes);

// Thêm cron start (trong startServer() function)
startMarketCron(); // Sau startLeaderboardWarmCron()
```

**Prefix pattern:**
- ✅ `/api/market` — theo đúng convention (`/api/weather`, `/api/game`, `/api/points`)
- ❌ KHÔNG dùng `/api/v1/market` (dự án KHÔNG có versioning)

**Auth middleware cần apply:**

```typescript
// public endpoints (KHÔNG cần auth)
GET    /api/market/latest       // Latest index + prices
GET    /api/market/history      // 30 ngày lịch sử
GET    /api/market/status       // Trading day check

// protected endpoints (CẦN auth + approved)
POST   /api/market/predict      // Place prediction (need OGN stake)
GET    /api/market/predictions  // My prediction history
```

**Pattern từ game routes:**
```typescript
// src/modules/game/routes/index.ts
const game = new Hono<GameEnv>();
game.use('/*', authMiddleware());     // All routes need auth
game.use('/*', approvedMiddleware()); // All routes need approved status
game.route('/player', playerRoutes);
// ...
```

**Market routes pattern:**
```typescript
// src/modules/market/market.routes.ts
import { Hono } from 'hono';
import { authMiddleware, approvedMiddleware } from '@/modules/auth/middleware';
import type { AuthVariables } from '@/modules/auth/types';

type MarketEnv = { Variables: AuthVariables };
const market = new Hono<MarketEnv>();

// Public routes (NO auth)
const publicRoutes = new Hono();
publicRoutes.get('/latest', async (c) => { ... });
publicRoutes.get('/history', async (c) => { ... });
publicRoutes.get('/status', async (c) => { ... });
market.route('/', publicRoutes);

// Protected routes (auth + approved)
const protectedRoutes = new Hono<MarketEnv>();
protectedRoutes.use('/*', authMiddleware());
protectedRoutes.use('/*', approvedMiddleware());
protectedRoutes.post('/predict', async (c) => { ... });
protectedRoutes.get('/predictions', async (c) => { ... });
market.route('/', protectedRoutes);

export default market;
```

### 2.4 Cron job

**Đặt scheduler:**
- File: `src/modules/market/market.cron.ts` (theo pattern)
- Pattern: Copy từ `weather.cron.ts` hoặc `wither.cron.ts`

**Lib scheduler dùng:** Croner ^9.1.0 (đã có trong dự án)

**Khởi tạo lúc nào:** Trong `startServer()` function ở `src/index.ts`

**Pattern từ weather.cron:**
```typescript
import { Cron } from 'croner';
import { marketService } from './market.service';

let marketCronJob: Cron | null = null;

export function startMarketCron() {
  marketCronJob = new Cron(
    '0 6 * * 1-5', // 6:00 AM, Monday-Friday (trading days)
    async () => {
      try {
        console.log('[Market] Cron triggered');
        await marketService.fetchDailyPrices(); // Fetch từ Alpha Vantage
        await marketService.calculateCompositeIndex();
        await marketService.resolvePredictions();
        await marketService.detectGameEvents();
        console.log('[Market] Cron completed');
      } catch (error) {
        console.error('[Market] Cron failed:', error);
      }
    },
    {
      timezone: 'Asia/Ho_Chi_Minh',
      protected: true, // Run even if previous run hasn't finished
    }
  );

  console.log('[Market] Cron started - 6:00 AM T2-T6 (VN timezone)');

  // Run immediately on startup? (optional)
  // marketService.fetchDailyPrices().catch(console.error);
}

export function stopMarketCron() {
  if (marketCronJob) {
    marketCronJob.stop();
    console.log('[Market] Cron stopped');
  }
}
```

**Cron pattern options:**
- `'0 6 * * 1-5'` — 6:00 AM, Mon-Fri (US market days)
- `'0 18 * * 1-5'` — 6:00 PM, Mon-Fri (VN timezone, sau khi US market close)
- `'0 */6 * * 1-5'` — Every 6 hours, Mon-Free (6 AM, 12 PM, 6 PM)

### 2.5 Cache

**Redis pattern copy từ module nào:** `weather.service.ts` hoặc `leaderboard.service.ts`

**Key naming convention hiện tại:**
- Pattern: `prefix:entity:id` (colon-separated)
- Examples:
  - `weather:province:${code}` (weather cache)
  - `game:quiz:session:${id}` (quiz session)
  - `game:quiz:cooldown:${userId}` (quiz cooldown)
  - `lb:ogn:1:20` (leaderboard cache)
  - `user:lastActivity:${userId}` (activity tracking)

**TTL strategy:**
- Weather cache: 3600s (1 hour)
- Quiz session: 3600s (1 hour)
- Leaderboard cache: 300s (5 minutes)
- Quiz cooldown: 300s (5 minutes)

**Market cache TTL đề xuất:**
- Latest prices: 3600s (1 hour) — only update daily
- Historical data: 86400s (24 hours) — static data
- Composite index: 3600s (1 hour)
- Trading status: 300s (5 minutes)

**Redis pattern implementation:**
```typescript
// src/modules/market/market.service.ts
import { redis } from '@/db/redis';

const MARKET_CACHE_TTL = 3600; // 1 hour
const HISTORY_CACHE_TTL = 86400; // 24 hours
const STATUS_CACHE_TTL = 300; // 5 minutes

// GET cache
const cached = await redis.get('market:latest');
if (cached) return JSON.parse(cached);

// SET cache
await redis.setex('market:latest', MARKET_CACHE_TTL, JSON.stringify(data));

// Invalidate cache (sau khi cron update)
await redis.del('market:latest');
await redis.del('market:index:composite');
```

**Cache invalidation:**
- Cron job tự động invalidate sau khi fetch new data
- Hoặc dùng TTL tự động expire

### 2.6 Game integration

**Prediction resolve kết nối player system:**

```typescript
// src/modules/market/market.service.ts
import { rewardService } from '@/modules/game/services/reward.service';
import { db } from '@/db/connection';
import { predictions } from './schema/predictions';
import { eq, and } from 'drizzle-orm';

export const marketService = {
  async resolvePredictions(): Promise<void> {
    // 1. Get all pending predictions
    const pending = await db
      .select()
      .from(predictions)
      .where(eq(predictions.status, 'pending'));

    // 2. Get latest composite index change
    const latestIndex = await this.getLatestCompositeIndex();
    const prevIndex = await this.getPreviousCompositeIndex();
    const percentChange = ((latestIndex.value - prevIndex.value) / prevIndex.value) * 100;
    const isUp = percentChange >= 0;

    // 3. Resolve each prediction
    for (const pred of pending) {
      const won = (pred.direction === 'up' && isUp) || (pred.direction === 'down' && !isUp);

      if (won) {
        // Award OGN reward (3x stake)
        const reward = pred.stakeAmount * 3;
        await rewardService.addOGN(pred.userId, reward, `market_prediction_${pred.id}`);
      }

      // Update prediction status
      await db
        .update(predictions)
        .set({
          status: won ? 'won' : 'lost',
          actualDirection: isUp ? 'up' : 'down',
          actualChange: percentChange,
          reward: won ? pred.stakeAmount * 3 : 0,
          resolvedAt: new Date(),
        })
        .where(eq(predictions.id, pred.id));
    }
  },
};
```

**OGN reward flow qua service:**
- Use: `rewardService.addOGN(userId, amount, reason)`
- Pattern từ: `quiz.service.ts`, `boss.service.ts`
- Features:
  - Transaction safety (row lock with FOR UPDATE)
  - Validate balance (không cho âm)
  - Max cap (999,999 OGN)
  - Auto-update updatedAt timestamp

**Game event dispatch mechanism:**
- Use: `gameActions` table
- Pattern từ: `quiz.service.ts`, `boss.service.ts`

```typescript
import { gameActions } from '@/modules/game/schema/game-actions';

// Log prediction action
await db.insert(gameActions).values({
  userId,
  type: 'market_predict', // Cần add vào enum
  data: {
    predictionId: pred.id,
    direction: pred.direction,
    stakeAmount: pred.stakeAmount,
  },
});
```

**Add to game action enum:**
```typescript
// src/modules/game/schema/game-actions.ts
export const gameActionTypeEnum = pgEnum('game_action_type', [
  'plant',
  'water',
  'harvest',
  'boss_complete',
  'quiz_complete',
  'shop_buy',
  'social_interact',
  'level_up',
  'market_predict', // NEW
]);
```

---

## 3. Schema đề xuất (Drizzle, theo convention dự án)

### 3.1 commodities (5 rows, static master)

```typescript
// src/modules/market/schema/commodities.ts
import { pgTable, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const commodities = pgTable(
  'commodities',
  {
    id: varchar('id', { length: 20 }).primaryKey(), // 'WHEAT', 'CORN', 'COTTON', 'SUGAR', 'COFFEE'
    name: varchar('name', { length: 50 }).notNull(), // 'Wheat', 'Corn', ...
    symbol: varchar('symbol', { length: 20 }).notNull(), // Alpha Vantage symbol
    emoji: varchar('emoji', { length: 10 }).notNull(), // '🌾', '🌽', '☁️', '🍬', '☕'
    weight: integer('weight').notNull().default(20), // Weight in composite index (%)
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
);

export type Commodity = typeof commodities.$inferSelect;
export type NewCommodity = typeof commodities.$inferInsert;
```

**Static data (seed):**
```json
// src/modules/market/data/commodities.json
[
  { "id": "WHEAT", "name": "Wheat", "symbol": "WHEAT", "emoji": "🌾", "weight": 20, "isActive": true },
  { "id": "CORN", "name": "Corn", "symbol": "CORN", "emoji": "🌽", "weight": 20, "isActive": true },
  { "id": "COTTON", "name": "Cotton", "symbol": "COTTON", "emoji": "☁️", "weight": 20, "isActive": true },
  { "id": "SUGAR", "name": "Sugar", "symbol": "SUGAR", "emoji": "🍬", "weight": 20, "isActive": true },
  { "id": "COFFEE", "name": "Coffee", "symbol": "COFFEE", "emoji": "☕", "weight": 20, "isActive": true }
]
```

### 3.2 daily_prices (5 rows/ngày, 90-day retention)

```typescript
// src/modules/market/schema/daily-prices.ts
import { pgTable, varchar, decimal, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { commodities } from './commodities';

export const dailyPrices = pgTable(
  'daily_prices',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // {COMMODITY_ID}_{DATE}
    commodityId: varchar('commodity_id', { length: 20 })
      .notNull()
      .references(() => commodities.id),
    date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD format
    openPrice: decimal('open_price', { precision: 10, scale: 2 }).notNull(),
    highPrice: decimal('high_price', { precision: 10, scale: 2 }).notNull(),
    lowPrice: decimal('low_price', { precision: 10, scale: 2 }).notNull(),
    closePrice: decimal('close_price', { precision: 10, scale: 2 }).notNull(),
    percentChange: decimal('percent_change', { precision: 10, scale: 2 }), // % change từ previous day
    volume: integer('volume'), // Trading volume (optional)
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    commodityIdIdx: index('daily_prices_commodity_id_idx').on(table.commodityId),
    dateIdx: index('daily_prices_date_idx').on(table.date),
    commodityDateIdx: index('daily_prices_commodity_date_idx').on(table.commodityId, table.date),
  }),
);

export type DailyPrice = typeof dailyPrices.$inferSelect;
export type NewDailyPrice = typeof dailyPrices.$inferInsert;
```

**Retention policy:**
- Cron job cleanup daily: delete rows WHERE `date < NOW() - INTERVAL '90 days'`
- Hoặc dùng PostgreSQL partitioning

### 3.3 composite_index (1 row/ngày, 90-day retention)

```typescript
// src/modules/market/schema/composite-index.ts
import { pgTable, varchar, decimal, timestamp, index } from 'drizzle-orm/pg-core';

export const compositeIndex = pgTable(
  'composite_index',
  {
    id: varchar('id', { length: 20 }).primaryKey(), // YYYY-MM-DD
    date: varchar('date', { length: 10 }).notNull().unique(), // YYYY-MM-DD
    value: decimal('value', { precision: 10, scale: 2 }).notNull(), // Index value
    percentChange: decimal('percent_change', { precision: 10, scale: 2 }), // % change từ previous day
    direction: varchar('direction', { length: 4 }), // 'up' | 'down' | 'flat'

    // Event detection
    eventType: varchar('event_type', { length: 20 }), // 'BOOM' | 'CRISIS' | null
    eventThreshold: decimal('event_threshold', { precision: 10, scale: 2 }), // Threshold triggered

    // Component breakdown
    wheatChange: decimal('wheat_change', { precision: 10, scale: 2 }),
    cornChange: decimal('corn_change', { precision: 10, scale: 2 }),
    cottonChange: decimal('cotton_change', { precision: 10, scale: 2 }),
    sugarChange: decimal('sugar_change', { precision: 10, scale: 2 }),
    coffeeChange: decimal('coffee_change', { precision: 10, scale: 2 }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: index('composite_index_date_idx').on(table.date),
    eventTypeIdx: index('composite_index_event_type_idx').on(table.eventType),
  }),
);

export type CompositeIndex = typeof compositeIndex.$inferSelect;
export type NewCompositeIndex = typeof compositeIndex.$inferInsert;
```

**Index calculation formula:**
```
Composite Index = (Wheat % Change × 20% + Corn % Change × 20% + Cotton % Change × 20% + Sugar % Change × 20% + Coffee % Change × 20%)
```

### 3.4 predictions (player predictions)

```typescript
// src/modules/market/schema/predictions.ts
import { pgTable, uuid, varchar, integer, decimal, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from '@/db/schema/users';

export const predictions = pgTable(
  'predictions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Prediction
    direction: varchar('direction', { length: 4 }).notNull(), // 'up' | 'down'
    stakeAmount: integer('stake_amount').notNull(), // OGN stake (min 10, max 1000)

    // Result (filled when resolved)
    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'won' | 'lost'
    actualDirection: varchar('actual_direction', { length: 4 }), // 'up' | 'down'
    actualChange: decimal('actual_change', { precision: 10, scale: 2 }), // Actual % change
    reward: integer('reward'), // OGN reward (3x stake if won)

    // Timestamps
    predictedAt: timestamp('predicted_at', { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('predictions_user_id_idx').on(table.userId),
    statusIdx: index('predictions_status_idx').on(table.status),
    userIdStatusIdx: index('predictions_user_status_idx').on(table.userId, table.status),
    predictedAtIdx: index('predictions_predicted_at_idx').on(table.predictedAt),
  }),
);

export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;
```

**Validation rules:**
- Min stake: 10 OGN
- Max stake: 1000 OGN
- Max pending predictions: 3 per user (anti-gambling)
- Cooldown: 1 prediction per day (optional)

---

## 4. File list cần tạo (chính xác path)

| # | File Path | Mô tả chức năng | Dependencies | Est. LOC |
|---|-----------|------------------|---------------|-----------|
| 1 | `src/modules/market/index.ts` | Barrel export | Export from all files | ~10 |
| 2 | `src/modules/market/market.routes.ts` | HTTP endpoints (Hono) | `@hono`, `@/modules/auth`, service, validators | ~150 |
| 3 | `src/modules/market/market.service.ts` | Business logic | `@/db/connection`, `@/db/redis`, schemas, rewardService | ~300 |
| 4 | `src/modules/market/market.cron.ts` | Croner scheduler | `croner`, service | ~50 |
| 5 | `src/modules/market/market.types.ts` | TypeScript interfaces | None (pure types) | ~80 |
| 6 | `src/modules/market/market.validators.ts` | Zod validation schemas | `zod` | ~60 |
| 7 | `src/modules/market/schema/index.ts` | Barrel export schemas | Export from schema files | ~10 |
| 8 | `src/modules/market/schema/commodities.ts` | Drizzle schema | `drizzle-orm/pg-core` | ~30 |
| 9 | `src/modules/market/schema/daily-prices.ts` | Drizzle schema | `drizzle-orm/pg-core`, commodities | ~50 |
| 10 | `src/modules/market/schema/composite-index.ts` | Drizzle schema | `drizzle-orm/pg-core` | ~50 |
| 11 | `src/modules/market/schema/predictions.ts` | Drizzle schema | `drizzle-orm/pg-core`, users | ~40 |
| 12 | `src/modules/market/data/commodities.json` | Static commodity data | None | ~20 |
| **TOTAL** | | | | **~850 LOC** |

**Files cần chỉnh sửa:**

| # | File Path | Changes | Lines |
|---|-----------|----------|--------|
| 1 | `src/index.ts` | Add import, mount route, start cron | +5 |
| 2 | `src/modules/game/schema/game-actions.ts` | Add 'market_predict' to enum | +1 |
| **TOTAL** | | | **+6 LOC** |

---

## 5. API Endpoints đề xuất

| Method | Path | Auth? | Mô tả | Request | Response |
|--------|------|-------|---------|---------|----------|
| **PUBLIC ENDPOINTS** |
| GET | `/api/market/latest` | No | Latest index + 5 commodity prices | — | `{ success, data: { index, prices, lastUpdated } }` |
| GET | `/api/market/history` | No | 30 ngày lịch sử composite index | `?days=30` | `{ success, data: [{ date, value, change, eventType }] }` |
| GET | `/api/market/commodities` | No | List all commodities | — | `{ success, data: [{ id, name, symbol, emoji }] }` |
| GET | `/api/market/status` | No | Trading day check | — | `{ success, data: { isTradingDay, nextFetchAt } }` |
| **PROTECTED ENDPOINTS** |
| POST | `/api/market/predict` | Yes | Place prediction (stake OGN) | `{ direction: 'up'\|'down', stakeAmount: number }` | `{ success, data: { predictionId, direction, stake } }` |
| GET | `/api/market/predictions` | Yes | My prediction history | `?status=pending&limit=10` | `{ success, data: [{ id, direction, stake, status, reward, predictedAt }] }` |
| GET | `/api/market/predictions/:id` | Yes | Get prediction detail | — | `{ success, data: { ... } }` |

**Response format pattern (theo dự án):**
```typescript
// Success
{ success: true, data: { ... }, cached: true, cacheAge: 123 }

// Error
{ success: false, error: { code: 'ERROR_CODE', message: 'Human readable message' } }
```

**Error codes:**
- `INSUFFICIENT_OGN` — Không đủ OGN để stake
- `INVALID_STAKE` — Stake amount ngoài range [10, 1000]
- `MAX_PENDING_PREDICTIONS` — Đạt giới hạn 3 pending
- `PREDICTION_COOLDOWN` — Chưa hết cooldown (24h)
- `MARKET_CLOSED` — Market không mở (weekend/holiday)
- `TRADING_DAY_ENDED` — Đã quá deadline prediction (ví dụ 5 PM)

---

## 6. Cron job flow

```
6:00 AM VN Time (Mon-Fri) — Croner
│
├─ [1] Check isTradingDay()
│   └─ Skip if weekend/holiday (check US market calendar)
│
├─ [2] Fetch 5 commodities từ Alpha Vantage
│   ├─ WHEAT, CORN, COTTON, SUGAR, COFFEE
│   ├─ API: https://www.alphavantage.co/query?function=COMMODITY_EXCHANGE_RATE&...
│   ├─ Delay 12s giữa mỗi call (tránh 5 calls/min limit)
│   └─ Parse response: filter ".", parseFloat
│
├─ [3] Upsert daily_prices (5 rows)
│   ├─ Use db.insert().onConflictDoUpdate()
│   └─ Calculate percentChange = (close - prevClose) / prevClose * 100
│
├─ [4] Calc composite index (weighted % change)
│   ├─ Get all 5 % changes from today's prices
│   ├─ Formula: weighted_avg = sum(change_i * weight_i) / sum(weights)
│   ├─ Insert into composite_index table
│   └─ Detect events: if abs(change) >= 1.5% → BOOM/CRISIS
│
├─ [5] Resolve predictions → reward OGN
│   ├─ Get all pending predictions (status = 'pending')
│   ├─ For each: compare direction vs actual
│   ├─ If won: rewardService.addOGN(userId, stake * 3, 'market_prediction')
│   ├─ If lost: no reward
│   └─ Update prediction status → 'won' or 'lost'
│
├─ [6] Invalidate Redis cache
│   ├─ redis.del('market:latest')
│   ├─ redis.del('market:index:composite')
│   └─ redis.del('market:history:*')
│
└─ [7] Discord webhook notification (optional)
    └─ POST to Discord webhook with daily summary
```

**Pseudo-code:**
```typescript
// market.cron.ts
export function startMarketCron() {
  new Cron('0 6 * * 1-5', async () => { // 6:00 AM, Mon-Fri
    // 1. Check trading day
    const isTradingDay = await marketService.isTradingDay();
    if (!isTradingDay) {
      console.log('[Market] Not a trading day, skipping');
      return;
    }

    // 2. Fetch prices (with rate limiting)
    const commodities = ['WHEAT', 'CORN', 'COTTON', 'SUGAR', 'COFFEE'];
    const prices = [];
    for (const commodity of commodities) {
      const price = await marketService.fetchCommodityPrice(commodity);
      prices.push(price);
      await delay(12000); // 12s delay (Alpha Vantage limit: 5/min)
    }

    // 3. Upsert daily prices
    await marketService.upsertDailyPrices(prices);

    // 4. Calculate composite index
    const index = await marketService.calculateCompositeIndex(prices);

    // 5. Resolve predictions
    await marketService.resolvePredictions(index);

    // 6. Invalidate cache
    await marketService.invalidateCache();

    // 7. Discord notification (optional)
    await marketService.sendDiscordNotification(index);
  }, { timezone: 'Asia/Ho_Chi_Minh' });
}
```

**Alpha Vantage rate limiting:**
- Free tier: 25 requests/day, 5 requests/minute
- Strategy: Chỉ call 5 requests/ngày (1 lần/ngày mỗi commodity)
- Delay: 12s giữa calls để an toàn (5 calls / 60s = 12s/call)

---

## 7. Rủi ro & Giải pháp

| Rủi ro | Xử lý | Chi tiết |
|--------|--------|----------|
| **Rate limit (25/ngày)** | Cache + chỉ gọi 5 calls/ngày | 5 commodities × 1 call/day = 5 calls/day. Nếu fail, retry vào ngày hôm sau. |
| **HTTP 200 fake success** | Check `json.Note` hoặc `json.Information` | Alpha Vantage trả 200 nhưng body có `"Note": "Thank you for using Alpha Vantage..."` khi exceed limit. |
| **Missing data "."** | Filter trước parseFloat | Alpha Vantage trả `"."` khi không có data. Filter: `if (price === '.') continue;` |
| **Weekend/holiday** | isTradingDay() skip | Check US market calendar. Skip cron vào T7, CN, US holidays. |
| **API key leak** | Bun.env, .env.example | KHÔNG commit .env. Thêm `ALPHAVANTAGE_API_KEY` vào .env.example (placeholder). |
| **Network timeout** | Timeout + retry logic | Fetch với timeout 10s. Nếu fail, log error và skip (thử lại ngày mai). |
| **Data inconsistency** | Transaction | Wrap prediction resolve trong transaction Drizzle. |
| **Player bankrupt** | Validate balance | Trước khi stake: check player OGN >= stakeAmount. |
| **Gambling addiction** | Hard limits | Max 3 pending predictions, cooldown 24h, max stake 1000 OGN. |
| **Race condition** | Row lock | Dùng `for('update')` khi resolve predictions (như rewardService). |
| **Cache stampede** | Warm cache | Cron job auto-warm cache sau khi fetch new data. |
| **DB connection pool exhausted** | Connection reuse | Dùng singleton `db` connection (đã có trong `src/db/connection.ts`). |

---

## 8. Thứ tự implementation (step-by-step)

### Phase 1: Database Setup (30 phút)

1. **Create schema files**
   - File: `src/modules/market/schema/commodities.ts`
   - File: `src/modules/market/schema/daily-prices.ts`
   - File: `src/modules/market/schema/composite-index.ts`
   - File: `src/modules/market/schema/predictions.ts`
   - File: `src/modules/market/schema/index.ts`
   - Verify: `bun run db:generate` → Tạo migration SQL

2. **Run migration**
   - Command: `bun run db:push` (push directly to DB)
   - Verify: Check tables created in PostgreSQL

3. **Seed static data**
   - File: `src/modules/market/data/commodities.json`
   - Script: `bun run src/scripts/seed-commodities.ts` (optional)
   - Verify: `SELECT * FROM commodities;` → 5 rows

### Phase 2: Core Service (2 giờ)

4. **Create types file**
   - File: `src/modules/market/market.types.ts`
   - Export: `CommodityPrice`, `CompositeIndex`, `Prediction`, `MarketPredictionInput`, etc.

5. **Create validators file**
   - File: `src/modules/market/market.validators.ts`
   - Schemas: `predictSchema`, `historyQuerySchema`, etc.

6. **Create service file**
   - File: `src/modules/market/market.service.ts`
   - Functions:
     - `fetchCommodityPrice(symbol)` — Call Alpha Vantage API
     - `upsertDailyPrices(prices)` — Insert/update daily_prices
     - `calculateCompositeIndex()` — Compute weighted index
     - `resolvePredictions()` — Award rewards
     - `invalidateCache()` — Clear Redis
     - `isTradingDay()` — Check US market calendar
   - Verify: Unit test functions (optional)

### Phase 3: HTTP Routes (1.5 giờ)

7. **Create routes file**
   - File: `src/modules/market/market.routes.ts`
   - Public: GET /latest, /history, /commodities, /status
   - Protected: POST /predict, GET /predictions, GET /predictions/:id
   - Verify: Test with curl/Postman

8. **Create barrel export**
   - File: `src/modules/market/index.ts`
   - Export: routes, cron, types
   - Verify: No import errors

9. **Mount routes in src/index.ts**
   - Add: `import { marketRoutes, startMarketCron } from '@/modules/market';`
   - Add: `app.route('/api/market', marketRoutes);`
   - Verify: `curl http://localhost:3000/api/market/status`

### Phase 4: Cron Job (1 giờ)

10. **Create cron file**
    - File: `src/modules/market/market.cron.ts`
    - Setup: Croner với pattern `'0 6 * * 1-5'`
    - Logic: Call service functions in sequence
    - Verify: Check logs `[Market] Cron triggered`

11. **Start cron in src/index.ts**
    - Add: `startMarketCron();` trong `startServer()` function
    - Verify: PM2 restart → check logs

12. **Test cron manually**
    - Trigger: Gọi service function manually via test script
    - Verify: Check database rows created

### Phase 5: Testing & Polish (1 giờ)

13. **Integration testing**
    - Test: Place prediction via POST /api/market/predict
    - Test: Verify prediction in DB
    - Test: Resolve prediction manually
    - Test: Check OGN balance updated

14. **Cache testing**
    - Test: Verify Redis cache working
    - Test: Check cache invalidation after cron

15. **Error handling**
    - Test: Alpha Vantage API fail → graceful degradation
    - Test: Invalid stake amount → proper error message

16. **Documentation**
    - Update: .env.example (add ALPHAVANTAGE_API_KEY)
    - Update: API docs (Swagger/OpenAPI nếu có)

### Phase 6: Game Integration (30 phút)

17. **Add game action type**
    - File: `src/modules/game/schema/game-actions.ts`
    - Add: `'market_predict'` vào enum

18. **Log prediction actions**
    - File: `src/modules/market/market.service.ts`
    - Add: Insert `gameActions` khi prediction created

19. **Verify leaderboard**
    - Test: Check predictions count in leaderboard (optional)

---

## 9. Environment Variables

**Thêm vào `.env.example`:**
```bash
# ==========================================
# ALPHA VANTAGE COMMODITY API
# ==========================================
# Get free API key from: https://www.alphavantage.co/support/#api-key
# Free tier: 25 requests/day, 5 requests/minute
ALPHAVANTAGE_API_KEY=your_api_key_here
```

**Thêm vào `.env`:**
```bash
ALPHAVANTAGE_API_KEY=XXXXXXXXXXXXXXXXXXXXXX
```

**Access in code:**
```typescript
const apiKey = Bun.env.ALPHAVANTAGE_API_KEY;
if (!apiKey) throw new Error('ALPHAVANTAGE_API_KEY not set');
```

---

## 10. Testing Strategy

### Unit Testing (không bắt buộc)
```bash
bun test src/modules/market/market.service.test.ts
```

### Integration Testing (bắt buộc)
```bash
# Test API endpoints
curl http://localhost:3000/api/market/status
curl http://localhost:3000/api/market/latest
curl http://localhost:3000/api/market/history?days=30

# Test protected endpoints
curl -X POST http://localhost:3000/api/market/predict \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"direction": "up", "stakeAmount": 100}'
```

### Manual Testing Checklist
- [ ] Tables created (commodities, daily_prices, composite_index, predictions)
- [ ] Static data seeded (5 commodities)
- [ ] Public endpoints work without auth
- [ ] Protected endpoints require auth
- [ ] Prediction creation validates stake amount
- [ ] Prediction resolves correctly after cron
- [ ] OGN rewards credited correctly
- [ ] Redis cache works
- [ ] Cache invalidates after cron
- [ ] Cron runs on schedule
- [ ] Logs show correct flow

---

## 11. Monitoring & Logging

**Log patterns (theo dự án):**
```typescript
console.log('[Market] Cron triggered');
console.log('[Market] Fetched WHEAT price:', price);
console.log('[Market] Composite index calculated:', index);
console.log('[Market] Resolved X predictions:', { won, lost });
console.log('[Market] Cron completed');
```

**PM2 monitoring:**
```bash
pm2 logs cdhc-api --lines 100
pm2 monit
```

**Sentry error tracking (đã setup):**
- Errors tự động gửi đến Sentry (đã config trong `src/index.ts`)

---

## 12. Next Steps (Implementation)

**File path trên VPS:**
- Backend root: `/home/cdhc/apps/cdhc-be`
- Module path: `/home/cdhc/apps/cdhc-be/src/modules/market/`

**Commands for implementation:**
```bash
# SSH vào VPS
ssh cdhc@your-vps-ip

# CD vào backend
cd /home/cdhc/apps/cdhc-be

# Tạo module folder
mkdir -p src/modules/market/schema
mkdir -p src/modules/market/data

# Tạo files (dùng nano hoặc vim)
nano src/modules/market/schema/commodities.ts
nano src/modules/market/schema/daily-prices.ts
# ... (continue for all files)

# Generate migration
bun run db:generate

# Push to database
bun run db:push

# Rebuild
bun run build

# Restart PM2
pm2 restart cdhc-api

# Check logs
pm2 logs cdhc-api --lines 50
```

**⚠️ IMPORTANT:** Đây là BÁO CÁO SCAN CHỈ ĐỌC. Implementation sẽ được thực hiện trong bước tiếp theo với sự xác nhận của bạn.

---

## 13. References

**Alpha Vantage API Documentation:**
- https://www.alphavantage.co/documentation/
- COMMODITY_EXCHANGE_RATE endpoint
- Rate limits: https://www.alphavantage.co/premium/

**Drizzle ORM Documentation:**
- https://orm.drizzle.team/docs/overview
- PostgreSQL schema: https://orm.drizzle.team/docs/pg-core

**Croner Documentation:**
- https://github.com/hexagon/croner

**Project References (Best Practices):**
- `src/modules/weather/` — API fetch + cron pattern
- `src/modules/game/` — Game logic + reward pattern
- `src/modules/auth/` — JWT middleware pattern
- `src/modules/quiz/` — Prediction + reward pattern
